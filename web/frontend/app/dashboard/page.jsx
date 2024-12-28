"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Modal, Spin, notification, Drawer } from "antd";
import { Button } from "@/components/ui/button";
import {
  CardTitle,
  CardDescription,
  CardHeader,
  CardContent,
  Card,
} from "@/components/ui/card";
import {
  TableHead,
  TableRow,
  TableHeader,
  TableCell,
  TableBody,
  Table,
} from "@/components/ui/table";
import {
  UsersIcon,
  ClockIcon,
  MegaphoneIcon,
  DeleteIcon,
  Bell,
  TrendingUp,
  Calendar,
  AlertTriangle,
  Cloud,
  X,
  XIcon,
  QrCode,
  Activity,
  Trash2,
  Badge,
} from "lucide-react";
import axios from "axios";
import QRCodeGenerator from "@/components/component/QrGeneration";
import WeatherWidget from "@/components/component/DynamicWeatherWidget";
import RealtimePickupDrawer from "@/components/component/RealTimePickupDrawer";
import io from "socket.io-client";

export default function Dashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [studentCount, setStudentCount] = useState(0);
  const [parentCount, setParentCount] = useState(0);
  const [isNotificationDrawerOpen, setIsNotificationDrawerOpen] = useState(
    searchParams.get("drawer") === "true"
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedPickup, setSelectedPickup] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [actionType, setActionType] = useState(null);
  const [pendingPickups, setPendingPickups] = useState([]);
  const [socket, setSocket] = useState(null);
  const [bgColor, setBgColor] = useState("white");

  
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const updateBgColor = (isDark) => {
      setBgColor(isDark ? "#0f172a" : "white");
    };

    // Set initial color
    updateBgColor(mediaQuery.matches);

    // Listen for theme changes
    const handleChange = (e) => updateBgColor(e.matches);
    mediaQuery.addEventListener("change", handleChange);

    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  const handleDrawerClose = () => {
    const url = new URL(window.location.href);
    url.searchParams.delete("drawer");
    router.replace(url.pathname + url.search);
    setIsNotificationDrawerOpen(false);
  };

  const handleDrawerOpen = () => {
    const url = new URL(window.location.href);
    url.searchParams.set("drawer", "true");
    router.replace(url.pathname + url.search);
    setIsNotificationDrawerOpen(true);
  };

  // Update the drawer state when URL parameters change
  useEffect(() => {
    setIsNotificationDrawerOpen(searchParams.get("drawer") === "true");
  }, [searchParams]);

  // Update the button click handler
  const handleBellClick = () => {
    handleDrawerOpen();
  };

  // Initialize Socket connection
  useEffect(() => {
    const newSocket = io("http://localhost:5000");
    setSocket(newSocket);

    return () => newSocket.disconnect();
  }, []);

  // Fetch initial pending pickups
  const fetchPendingPickups = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/pickup/logs");
      if (response.data.success) {
        const pending = response.data.data.filter(
          (pickup) => pickup.status === "pending"
        );
        setPendingPickups(pending);
      }
    } catch (error) {
      console.error("Error fetching pending pickups:", error);
    }
  };

  // Initial fetch and socket listeners
  useEffect(() => {
    fetchPendingPickups();

    if (socket) {
      // Listen for new pickups
      socket.on("new-pickup", (pickup) => {
        if (pickup.status === "pending") {
          setPendingPickups((prev) => [...prev, pickup]);
          // showPickupNotification(pickup);
        }
      });

      // Listen for pickup status updates
      socket.on("pickup-status-updated", ({ pickupId, status }) => {
        setPendingPickups((prev) => {
          if (status !== "pending") {
            return prev.filter((p) => p._id !== pickupId);
          }
          return prev;
        });
      });

      // Listen for deleted pickups
      socket.on("pickup-deleted", (pickupId) => {
        setPendingPickups((prev) => prev.filter((p) => p._id !== pickupId));
      });
    }

    return () => {
      if (socket) {
        socket.off("new-pickup");
        socket.off("pickup-status-updated");
        socket.off("pickup-deleted");
      }
    };
  }, [socket]);

  // Handle pickup status update
  const handlePickupStatus = async () => {
    if (!selectedPickup || !actionType) return;

    try {
      setIsProcessing(true);
      const response = await axios.put(
        `http://localhost:5000/api/pickup/${selectedPickup.id}/status`,
        {
          status: actionType,
          updatedBy: "admin", // You might want to pass actual admin ID here
          notes: `Pickup ${actionType} by admin at ${new Date().toISOString()}`,
        }
      );

      if (response.data.success) {
        notification.success({
          message: "Success",
          description: `Pickup ${actionType} successfully`,
          placement: "topRight",
        });

        // Refresh the pickup list
        await fetchPendingPickups();
      }
    } catch (error) {
      console.error(`Error updating pickup status:`, error);
      notification.error({
        message: "Error",
        description: `Failed to ${actionType} pickup`,
      });
    } finally {
      setIsProcessing(false);
      setShowConfirmModal(false);
      setSelectedPickup(null);
      setActionType(null);
    }
  };

  // Status confirmation modal
  const StatusConfirmationModal = () => (
    <Modal
      title={`Confirm ${actionType} Pickup`}
      open={showConfirmModal}
      onCancel={() => setShowConfirmModal(false)}
      onOk={handlePickupStatus}
      okText={actionType === "completed" ? "Complete Pickup" : "Cancel Pickup"}
      okButtonProps={{
        danger: actionType === "cancelled",
        loading: isProcessing,
      }}
      cancelButtonProps={{ disabled: isProcessing }}
    >
      <p>Are you sure you want to {actionType} this pickup?</p>
      {selectedPickup && (
        <div className="mt-4 p-4 bg-gray-50 rounded">
          <p>
            <strong>Student:</strong> {selectedPickup.studentName}
          </p>
          <p>
            <strong>Parent:</strong> {selectedPickup.parentName}
          </p>
          <p>
            <strong>Pickup Time:</strong> {selectedPickup.pickupTime}
          </p>
        </div>
      )}
    </Modal>
  );

  useEffect(() => {
    const fetchStudentCount = async () => {
      try {
        const response = await axios.get(
          "http://localhost:5000/api/students/count"
        );
        setStudentCount(response.data.count);
      } catch (error) {
        console.error("Error fetching student count:", error);
      }
    };

    fetchStudentCount();
  }, []);

  useEffect(() => {
    const fetchParentCount = async () => {
      try {
        const response = await axios.get(
          "http://localhost:5000/api/students/parent-count"
        );
        setParentCount(response.data.count);
      } catch (error) {
        console.error("Error fetching parent count:", error);
      }
    };

    fetchParentCount();
  }, []);
  return (
    <div className="relative flex h-screen overflow-hidden bg-grey-900">
      <div className="flex-1 overflow-y-auto">
        {/* Header section */}
        <div className="bg-grey-900 p-4 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-black dark:text-white">
                School Dashboard
              </h1>
              <WeatherWidget />
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                className="flex items-center border-grey-900 text-grey-100 hover:bg-grey-900/20"
              >
                <Calendar className="mr-2 h-4 w-4" />
                {new Date().toLocaleDateString()}
              </Button>
              <Button
                variant="outline"
                className="flex items-center border-grey-900 text-grey-100 hover:bg-grey-900/20"
                onClick={handleBellClick}
              >
                <Bell className="mr-2 h-4 w-4" />
                <span
                  className={`bg-red-500 text-white text-xs px-2 py-0.5 rounded-full ${
                    pendingPickups.length === 0 ? "hidden" : ""
                  }`}
                >
                  {pendingPickups.length}
                </span>
              </Button>
            </div>
          </div>
        </div>

        {/* Scrollable content */}
        <div className="p-4 md:p-6">
          {/* Activity Timeline Card */}
          <Card className="bg-gray-300 border-grey-900/20 mb-6">
            <CardHeader>
              <CardTitle className="text-lg text-black dark:text-white">
                Today's Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex space-x-8">
                {[
                  {
                    label: "Active Pickups",
                    value: "23",
                    trend: "+5",
                    icon: <UsersIcon className="h-4 w-4" />,
                    color: "text-green-500",
                  },
                  {
                    label: "Delayed",
                    value: "3",
                    trend: "-2",
                    icon: <ClockIcon className="h-4 w-4" />,
                    color: "text-yellow-500",
                  },
                  {
                    label: "Completed",
                    value: "45",
                    trend: "+12",
                    icon: <CheckIcon className="h-4 w-4" />,
                    color: "text-grey-500",
                  },
                  {
                    label: "Cancelled",
                    value: "1",
                    trend: "0",
                    icon: <XIcon className="h-4 w-4" />,
                    color: "text-red-500",
                  },
                ].map((stat, index) => (
                  <div key={index} className="text-center">
                    <div className={`text-2xl font-bold ${stat.color}`}>
                      {stat.value}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">
                      {stat.label}
                    </div>
                    <div
                      className={`text-xs flex items-center justify-center mt-1 ${stat.color}`}
                    >
                      <TrendingUp className="h-3 w-3 mr-1" />
                      {stat.trend}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* QR Code Actions */}
          <div className=" gap-4">
            <QRCodeGenerator />
          </div>

          {/* Info Cards Grid */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 mb-[3rem] mt-[3rem]">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium">
                  Total number of students
                </CardTitle>
                <ClockIcon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">45</div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  +3 since last hour
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium">
                  Total number of Guardians
                </CardTitle>
                <CheckIcon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">987</div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  +50 since last hour
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium">
                  Announcements Sent
                </CardTitle>
                <MegaphoneIcon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">12</div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  +2 since last hour
                </p>
              </CardContent>
            </Card>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium">
                  Student Information
                </CardTitle>
                <Button className="shrink-0" size="sm">
                  Add Student
                </Button>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Grade</TableHead>
                      <TableHead>Parent</TableHead>
                      <TableHead>Driver</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-medium">John Doe</TableCell>
                      <TableCell>5th</TableCell>
                      <TableCell>Jane Doe</TableCell>
                      <TableCell>Bob Smith</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Jane Smith</TableCell>
                      <TableCell>3rd</TableCell>
                      <TableCell>John Smith</TableCell>
                      <TableCell>Alice Johnson</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Michael Lee</TableCell>
                      <TableCell>2nd</TableCell>
                      <TableCell>Sarah Lee</TableCell>
                      <TableCell>David Kim</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium">
                  Announcements
                </CardTitle>
                <Button className="shrink-0" size="sm">
                  New Announcement
                </Button>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium">
                        Early Dismissal on Friday
                      </h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Sent 2 hours ago
                      </p>
                    </div>
                    <Button className="shrink-0" size="icon" variant="ghost">
                      <DeleteIcon className="h-4 w-4" />
                      <span className="sr-only">Edit announcement</span>
                    </Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium">
                        PTA Meeting Next Week
                      </h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Sent 1 day ago
                      </p>
                    </div>
                    <Button className="shrink-0" size="icon" variant="ghost">
                      <DeleteIcon className="h-4 w-4" />
                      <span className="sr-only">Edit announcement</span>
                    </Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium">
                        School Closed Tomorrow
                      </h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Sent 3 days ago
                      </p>
                    </div>
                    <Button className="shrink-0" size="icon" variant="ghost">
                      <DeleteIcon className="h-4 w-4" />
                      <span className="sr-only">Edit announcement</span>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium">
                  Pick-up Process
                </CardTitle>
                <Button className="shrink-0" size="sm">
                  View Details
                </Button>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium">
                        Dismissal Time: 3:00 PM
                      </h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Students begin lining up
                      </p>
                    </div>
                    <div className="text-sm font-medium">
                      <span className="text-green-500">On Schedule</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium">
                        Parent Arrival: 3:15 PM
                      </h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Parents begin arriving
                      </p>
                    </div>
                    <div className="text-sm font-medium">
                      <span className="text-yellow-500">Delayed</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium">
                        Student Pickup: 3:30 PM
                      </h4>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Notification Drawer */}
      <div className="bg-white dark:bg-gray-800 h-full">
        <Drawer
          title={null}
          placement="right"
          onClose={handleDrawerClose}
          open={isNotificationDrawerOpen}
          width={400}
          drawerStyle={{
            backgroundColor: bgColor
          }}
          styles={{
            body: {
              padding: "24px",
            },
            mask: {
              backgroundColor: "rgba(0, 0, 0, 0.7)",
            },
          }}
        >
          {/* <div className="bg-white dark:bg-gray-800 h-full"> */}
            <RealtimePickupDrawer
              isOpen={isNotificationDrawerOpen}
              // onClose={handleDrawerClose}
              onPickupsUpdate={(pickups) => setPendingPickups(pickups)}
              socket={socket}
            />
          {/* </div> */}
        </Drawer>
      </div>
      <StatusConfirmationModal />
    </div>
  );
}

function CheckIcon(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}
