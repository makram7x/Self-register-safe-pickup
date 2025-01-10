"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Modal, Spin, notification, Drawer, List, Table } from "antd";
import { Button } from "@/components/ui/button";
import {
  CardTitle,
  CardDescription,
  CardHeader,
  CardContent,
  Card,
} from "@/components/ui/card";
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
import PickupCharts from "@/components/component/PickupChart";
import io from "socket.io-client";

export default function Dashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // State variables
  const [studentCount, setStudentCount] = useState(0);
  const [parentCount, setParentCount] = useState(0);
  const [announcementCount, setAnnouncementCount] = useState(0);
  const [latestStudents, setLatestStudents] = useState([]);
  const [latestAnnouncements, setLatestAnnouncements] = useState([]);
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
  const [pickupStats, setPickupStats] = useState({
    activeCount: 0,
    delayedCount: 0,
    completedCount: 0,
    cancelledCount: 0,
  });

  useEffect(() => {
    const fetchLatestStudents = async () => {
      try {
        const response = await axios.get("http://localhost:5000/api/students");
        // Get the last 3 students
        setLatestStudents(response.data);
      } catch (error) {
        console.error("Error fetching latest students:", error);
      }
    };
    fetchLatestStudents();
  }, []);

  // Fetch latest announcements
  useEffect(() => {
    const fetchLatestAnnouncements = async () => {
      try {
        const response = await axios.get(
          "http://localhost:5000/api/notifications"
        );
        // Get the last 4 announcements
        setLatestAnnouncements(response.data.slice(-4));
      } catch (error) {
        console.error("Error fetching latest announcements:", error);
      }
    };
    fetchLatestAnnouncements();
  }, []);

  // Socket initialization and stats update effects
  useEffect(() => {
    console.log("Initializing socket connection...");
    const newSocket = io("http://localhost:5000", {
      transports: ["websocket"],
      upgrade: false,
    });

    newSocket.on("connect", () => {
      console.log("Socket connected:", newSocket.id);
    });

    newSocket.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
    });

    setSocket(newSocket);

    return () => {
      console.log("Disconnecting socket...");
      newSocket.disconnect();
    };
  }, []);


  // Stats update effect
  useEffect(() => {
    const fetchInitialStats = async () => {
      try {
        console.log("Fetching initial stats...");
        const [active, delayed, completed, cancelled] = await Promise.all([
          axios.get("http://localhost:5000/api/pickup/active/count"),
          axios.get("http://localhost:5000/api/pickup/delayed/count"),
          axios.get("http://localhost:5000/api/pickup/completed/count"),
          axios.get("http://localhost:5000/api/pickup/cancelled/count"),
        ]);

        const newStats = {
          activeCount: active.data.count,
          delayedCount: delayed.data.count,
          completedCount: completed.data.count,
          cancelledCount: cancelled.data.count,
        };

        console.log("Setting initial stats:", newStats);
        setPickupStats(newStats);
      } catch (error) {
        console.error("Error fetching initial stats:", error);
      }
    };

    fetchInitialStats();

    if (socket) {
      console.log("Setting up stats listener on socket:", socket.id);

      socket.on("pickup-stats-update", (stats) => {
        console.log("Received stats update:", stats);
        setPickupStats((prevStats) => {
          console.log("Updating stats from:", prevStats, "to:", stats);
          return stats;
        });
      });

      return () => {
        console.log("Cleaning up socket listener");
        socket.off("pickup-stats-update");
      };
    }
  }, [socket]);

  // Stats display component
  const StatsDisplay = () => {
    console.log("Rendering stats:", pickupStats); // Debug log
    return (
      <div className="flex space-x-8">
        {[
          {
            label: "Active Pickups",
            value: pickupStats.activeCount,
            icon: <UsersIcon className="h-4 w-4" />,
            color: "text-green-500",
          },
          {
            label: "Delayed",
            value: pickupStats.delayedCount,
            icon: <ClockIcon className="h-4 w-4" />,
            color: "text-yellow-500",
          },
          {
            label: "Completed",
            value: pickupStats.completedCount,
            icon: <CheckIcon className="h-4 w-4" />,
            color: "text-grey-500",
          },
          {
            label: "Cancelled",
            value: pickupStats.cancelledCount,
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
              {stat.icon}
            </div>
          </div>
        ))}
      </div>
    );
  };

  useEffect(() => {
    const fetchSchoolData = async () => {
      try {
        const [studentRes, parentRes] = await Promise.all([
          axios.get("http://localhost:5000/api/students/count"),
          axios.get("http://localhost:5000/api/students/parent-count"),
        ]);

        setStudentCount(studentRes.data.count);
        setParentCount(parentRes.data.count);
      } catch (error) {
        console.error("Error fetching school data:", error);
      }
    };

    fetchSchoolData();
  }, []);

  useEffect(() => {
    const fetchAnnouncementCount = async () => {
      try {
        const response = await axios.get(
          "http://localhost:5000/api/notifications"
        );
        setAnnouncementCount(response.data.length);
      } catch (error) {
        console.error("Error fetching announcements:", error);
      }
    };

    fetchAnnouncementCount();

    // Set up real-time updates if using socket
    if (socket) {
      socket.on("notification-created", fetchAnnouncementCount);
      socket.on("notification-deleted", fetchAnnouncementCount);
    }

    return () => {
      if (socket) {
        socket.off("notification-created");
        socket.off("notification-deleted");
      }
    };
  }, [socket]);

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
              <StatsDisplay />
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
                <div className="text-2xl font-bold">{studentCount}</div>
                {/* <p className="text-xs text-gray-500 dark:text-gray-400">
                  +3 since last hour
                </p> */}
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
                <div className="text-2xl font-bold">{parentCount}</div>
                {/* <p className="text-xs text-gray-500 dark:text-gray-400">
                  +50 since last hour
                </p> */}
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
                <div className="text-2xl font-bold">{announcementCount}</div>
              </CardContent>
            </Card>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 ">
            {/* Latest Students Card */}
            <Card className="h-full flex flex-col">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium">
                  Latest Students
                </CardTitle>
                <Button
                  className="shrink-0"
                  size="sm"
                  onClick={() => router.push("/student")}
                >
                  View All
                </Button>
              </CardHeader>
              <CardContent className="p-0 flex-1">
                {" "}
                {/* Use flex-1 to take remaining space */}
                <div className="h-[36rem] overflow-auto ml-4 mb-4 mt-2">
                  {" "}
                  {/* Full height container */}
                  <Table
                    dataSource={latestStudents}
                    columns={[
                      {
                        title: "Student Name",
                        dataIndex: "studentName",
                        key: "studentName",
                      },
                      {
                        title: "Grade",
                        dataIndex: "grade",
                        key: "grade",
                      },
                      {
                        title: "Parent",
                        dataIndex: "parentName",
                        key: "parentName",
                      },
                    ]}
                    pagination={false}
                    size="small"
                    scroll={{ y: true }}
                    className="overflow-hidden"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Latest Announcements Card */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium">
                  Latest Announcements
                </CardTitle>
                <Button
                  className="shrink-0"
                  size="sm"
                  onClick={() => router.push("/notifications")}
                >
                  View All
                </Button>
              </CardHeader>
              <CardContent>
                <List
                  itemLayout="horizontal"
                  dataSource={latestAnnouncements}
                  renderItem={(item) => (
                    <List.Item
                    // actions={[
                    //   <Button
                    //     key="delete"
                    //     type="text"
                    //     // icon={<DeleteIcon className="h-4 w-4" />}
                    //   />,
                    // ]}
                    >
                      <List.Item.Meta
                        title={item.title}
                        description={
                          <div>
                            <p className="text-sm">{item.description}</p>
                            <p className="text-xs text-gray-500">
                              {new Date(item.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        }
                      />
                    </List.Item>
                  )}
                />
              </CardContent>
            </Card>
          </div>
          <div className="mb-6 mt-6">
            <PickupCharts />
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
            backgroundColor: bgColor,
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
