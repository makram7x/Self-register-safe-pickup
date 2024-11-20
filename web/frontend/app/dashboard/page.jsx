"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
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
} from "lucide-react";
import axios from "axios";
import QRCodeGenerator from "@/components/component/QrGeneration";

export default function Dashboard() {
  const [studentCount, setStudentCount] = useState(0);
  const [parentCount, setParentCount] = useState(0);
  const [recentPickups, setRecentPickups] = useState([]);
  const [isNotificationDrawerOpen, setIsNotificationDrawerOpen] =
    useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedPickup, setSelectedPickup] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [actionType, setActionType] = useState(null);

  // Notification config
  const [api, contextHolder] = notification.useNotification();

  // Weather widget with dark mode support
  const WeatherWidget = () => {
    return (
      <div className="flex items-center space-x-2 bg-blue-950/20 p-3 rounded-lg">
        <div className="text-blue-400">
          <Cloud className="h-8 w-8" />
        </div>
        <div>
          <div className="text-sm font-medium text-blue-100">72°F</div>
          <div className="text-xs text-blue-300">Partly Cloudy</div>
        </div>
      </div>
    );
  };

  const fetchPendingPickups = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get("http://localhost:5000/api/pickup/logs");

      if (response.data.success) {
        const pendingPickups = response.data.data
          .filter((pickup) => pickup.status === "pending")
          .map((pickup) => ({
            id: pickup._id,
            studentName: pickup.studentNames,
            studentCode: pickup.studentCodes,
            parentName: pickup.parent.name,
            parentEmail: pickup.parent.email,
            pickupTime: new Date(pickup.pickupTime).toLocaleString(),
            status: pickup.status,
          }));

        setRecentPickups(pendingPickups);
      }
    } catch (error) {
      console.error("Error fetching pending pickups:", error);
      notification.error({
        message: "Error",
        description: "Failed to fetch pending pickups",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isNotificationDrawerOpen) {
      fetchPendingPickups();
    }
  }, [isNotificationDrawerOpen]);

  // Confirmation modal for actions
  const showActionConfirmation = (pickup, type) => {
    setSelectedPickup(pickup);
    setActionType(type);
    setShowConfirmModal(true);
  };

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

  // Updated NotificationDrawerContent component
  const NotificationDrawerContent = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-lg font-semibold text-white">Pending Pickups</h2>
          <p className="text-sm text-blue-300">
            {recentPickups.length} pending requests
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsNotificationDrawerOpen(false)}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      ) : recentPickups.length === 0 ? (
        <div className="text-center py-8 text-gray-400">No pending pickups</div>
      ) : (
        recentPickups.map((pickup) => (
          <div
            key={pickup.id}
            className="bg-blue-950/30 p-4 rounded-lg space-y-2 border border-blue-900/50"
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-medium text-blue-100">
                  {pickup.studentName}
                </h3>
                <p className="text-sm text-blue-300">
                  Code: {pickup.studentCode}
                </p>
                <p className="text-sm text-blue-300">
                  Parent: {pickup.parentName}
                </p>
                <p className="text-xs text-blue-400">
                  Requested: {pickup.pickupTime}
                </p>
              </div>
              <span className="text-xs bg-yellow-500/20 text-yellow-300 px-2 py-1 rounded-full">
                Pending
              </span>
            </div>
            <div className="flex space-x-2 mt-2">
              <Button
                size="sm"
                className="bg-green-600 hover:bg-green-700"
                onClick={() => showActionConfirmation(pickup, "completed")}
              >
                Complete
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="border-red-500 text-red-500 hover:bg-red-950/20"
                onClick={() => showActionConfirmation(pickup, "cancelled")}
              >
                Cancel
              </Button>
            </div>
          </div>
        ))
      )}
    </div>
  );

  const showPickupNotification = (pickup) => {
    api.info({
      message: "New Pending Pickup",
      description: (
        <div>
          <p>
            <strong>Student:</strong> {pickup.studentName}
          </p>
          <p>
            <strong>Grade:</strong> {pickup.grade}
          </p>
          <p>
            <strong>Parent:</strong> {pickup.parentName}
          </p>
        </div>
      ),
      placement: "topRight",
      duration: 5,
      style: {
        backgroundColor: "#0f172a",
        border: "1px solid #1e3a8a",
        color: "#e2e8f0",
      },
      icon: <AlertTriangle className="h-5 w-5 text-yellow-500" />,
    });
  };

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
    <div className="min-h-screen bg-[#020817]">
      {contextHolder}
      <StatusConfirmationModal />
      {/* Notification Drawer */}
      <Drawer
        title={null}
        placement="right"
        onClose={() => setIsNotificationDrawerOpen(false)}
        open={isNotificationDrawerOpen}
        width={400}
        className="bg-[#0f172a]"
        styles={{
          body: {
            padding: "24px",
            backgroundColor: "#0f172a",
          },
          mask: {
            backgroundColor: "rgba(0, 0, 0, 0.7)",
          },
        }}
      >
        <NotificationDrawerContent />
      </Drawer>

      <div className="bg-[#0f172a] p-4 shadow-lg border-b border-blue-900/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-white">School Dashboard</h1>
            <WeatherWidget />
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              className="flex items-center border-blue-900 text-blue-100 hover:bg-blue-900/20"
            >
              <Calendar className="mr-2 h-4 w-4" />
              {new Date().toLocaleDateString()}
            </Button>
            <Button
              variant="outline"
              className="flex items-center border-blue-900 text-blue-100 hover:bg-blue-900/20"
              onClick={() => setIsNotificationDrawerOpen(true)}
            >
              <Bell className="mr-2 h-4 w-4" />
              <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                {recentPickups.length}
              </span>
            </Button>
          </div>
        </div>
      </div>

      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
        {/* Activity Timeline Card */}
        <Card className="bg-[#0f172a] border-blue-900/20">
          <CardHeader>
            <CardTitle className="text-lg text-white">
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
                  color: "text-green-400",
                },
                {
                  label: "Delayed",
                  value: "3",
                  trend: "-2",
                  color: "text-yellow-400",
                },
                {
                  label: "Completed",
                  value: "45",
                  trend: "+12",
                  color: "text-blue-400",
                },
                {
                  label: "Cancelled",
                  value: "1",
                  trend: "0",
                  color: "text-red-400",
                },
              ].map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-2xl font-bold text-white">
                    {stat.value}
                  </div>
                  <div className="text-sm text-blue-300">{stat.label}</div>
                  <div
                    className={`text-xs flex items-center justify-center ${stat.color}`}
                  >
                    <TrendingUp className="h-3 w-3 mr-1" />
                    {stat.trend}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions Section */}
        <div className="gap-4 mb-6">
          <QRCodeGenerator />
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">
                Pending Pickups
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
                Completed Pickups
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
      </main>
    </div>
  );
}

function CarIcon(props) {
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
      <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" />
      <circle cx="7" cy="17" r="2" />
      <path d="M9 17h6" />
      <circle cx="17" cy="17" r="2" />
    </svg>
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
