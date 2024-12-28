"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { CardTitle, CardHeader, CardContent, Card } from "@/components/ui/card";
import {
  TableHead,
  TableRow,
  TableHeader,
  TableCell,
  TableBody,
  Table,
} from "@/components/ui/table";
import { Tabs, Tag, Tooltip, notification } from "antd";
import { ReloadIcon } from "@radix-ui/react-icons";
import axios from "axios";

export default function PickupPage() {
  const [pickupLogs, setPickupLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);
  const [isDeletingAll, setIsDeletingAll] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedLogId, setSelectedLogId] = useState(null);
  const [activeKey, setActiveKey] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [displayLogs, setDisplayLogs] = useState({});

  useEffect(() => {
    fetchPickupLogs();
    const interval = setInterval(fetchPickupLogs, 30000000);
    return () => clearInterval(interval);
  }, []);

  const handleSearch = (value) => {
    if (value.trim() === "") {
      setDisplayLogs(pickupLogs);
      return;
    }

    const searchValue = value.toLowerCase().trim();

    const filtered = Object.entries(pickupLogs).reduce((acc, [date, logs]) => {
      const filteredDateLogs = logs.filter((log) => {
        // Check student information
        const studentMatch =
          log.studentNames?.toLowerCase().includes(searchValue) ||
          log.studentCodes?.toLowerCase().includes(searchValue);

        // Check parent information
        const parentMatch =
          log.parent?.name?.toLowerCase().includes(searchValue) ||
          log.parent?.email?.toLowerCase().includes(searchValue);

        // Check completed by information (driver or staff)
        const completedByMatch =
          log.completedBy &&
          (log.completedBy.name?.toLowerCase().includes(searchValue) ||
            log.completedBy.email?.toLowerCase().includes(searchValue) ||
            log.completedBy.phone?.toLowerCase().includes(searchValue) ||
            log.completedBy.verificationCode
              ?.toLowerCase()
              .includes(searchValue));

        return studentMatch || parentMatch || completedByMatch;
      });

      if (filteredDateLogs.length > 0) {
        acc[date] = filteredDateLogs;
      }
      return acc;
    }, {});

    setDisplayLogs(filtered);
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      weekday: "short",
    });
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return "N/A";
    return new Date(timestamp).toLocaleString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const formatDateTime = (timestamp) => {
    if (!timestamp) return "N/A";
    return new Date(timestamp).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const getStatusTag = (status) => {
    const statusColors = {
      pending: "gold",
      completed: "green",
      cancelled: "red",
      initiated: "blue",
    };

    return (
      <Tag color={statusColors[status] || "default"}>
        {status?.charAt(0).toUpperCase() + status?.slice(1) || "N/A"}
      </Tag>
    );
  };

  // First, let's check the data in fetchPickupLogs
  const fetchPickupLogs = async () => {
    try {
      setLoading(true);
      const response = await axios.get("http://localhost:5000/api/pickup/logs");
      if (response.data.success) {
        const logs = response.data.data;

        // Debug log to see the structure
        // console.log("Raw pickup log data:", JSON.stringify(logs[0], null, 2));

        // Debug logs to check the structure of the fetched data
        console.log("Fetched pickup logs:", logs);
        console.log("Sample pickup log:", logs[0]);
        console.log("completedBy property:", logs[0].completedBy);

        // Sort all logs by time (newest first)
        // logs.sort((a, b) => new Date(b.pickupTime) - new Date(a.pickupTime));

        // Organize logs into sections
        const organized = organizeLogs(logs);

        setPickupLogs(organized);
        setDisplayLogs(organized);

        const firstTab = Object.keys(organized)[0];
        if (firstTab && !activeKey) {
          setActiveKey(firstTab);
        }
      }
    } catch (error) {
      console.error("Error fetching pickup logs:", error);
      notification.error({
        message: "Error",
        description: "Failed to fetch pickup logs",
        placement: "topRight",
      });
    } finally {
      setLoading(false);
    }
  };

  // Now let's update getPickupDetails to properly handle the data
  const getPickupDetails = (log) => {
    console.log("Processing pickup log:", log); // Debug log

    const getInitiatorInfo = () => {
      // If driver initiated, show driver information
      if (log.initiatedBy?.type === "driver") {
        return (
          <div className="space-y-2 border-l-2 border-blue-400 pl-2">
            <div className="text-xs font-medium text-blue-500 dark:text-blue-400">
              Driver-Initiated Pickup
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              Driver: {log.initiatedBy.name}
            </div>
            {log.initiatedBy.phone && (
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Phone: {log.initiatedBy.phone}
              </div>
            )}
          </div>
        );
      }

      // Default to parent-initiated info
      return (
        <div className="text-xs space-y-1 border-l-2 border-gray-400 pl-2">
          <div className="text-xs font-medium text-gray-600 dark:text-gray-400">
            Parent-Initiated Pickup
          </div>
        </div>
      );
    };

    const getCompletionInfo = () => {
      console.log("Completion Info - Full log:", log);
      console.log("CompletedBy data:", log.completedBy);

      if (log.status === "completed") {
        // Check both completedBy and the last status update
        const lastStatus = log.statusHistory?.[log.statusHistory.length - 1];
        console.log("Last status entry:", lastStatus);

        // Determine who completed the pickup by checking multiple sources
        let completedByType;

        // First check the status history since it's more reliable for type info
        if (lastStatus?.updatedBy?.type) {
          completedByType =
            lastStatus.updatedBy.type === "staff"
              ? "Admin"
              : lastStatus.updatedBy.type === "driver"
              ? "Driver"
              : lastStatus.updatedBy.type === "admin"
              ? "Admin"
              : "Parent";
        }
        // Then check completedBy if no type in status history
        else if (log.completedBy?.type) {
          completedByType =
            log.completedBy.type === "staff"
              ? "Admin"
              : log.completedBy.type === "driver"
              ? "Driver"
              : log.completedBy.type === "admin"
              ? "Admin"
              : "Parent";
        }
        // Default to Parent if no type information found
        else {
          completedByType = "Parent";
        }

        console.log("Determined completedByType:", completedByType);

        return (
          <div className="space-y-1 border-l-2 border-green-400 pl-2">
            <div className="text-xs text-green-500 dark:text-green-400">
              Picked up at {formatDateTime(log.completedAt || log.updatedAt)}
            </div>
            <div className="text-xs font-medium text-green-600 dark:text-green-400">
              Verified by {completedByType}
            </div>
          </div>
        );
      }
      return null;
    };

    const getCancellationInfo = () => {
      console.log("Cancellation Info - Full log:", log);

      if (log.status === "cancelled") {
        // Check both completedBy and the last status update
        const lastStatus = log.statusHistory?.[log.statusHistory.length - 1];
        console.log("Last status entry for cancellation:", lastStatus);

        // Determine who cancelled the pickup by checking multiple sources
        let cancelledByType;

        // First check the status history since it's more reliable for type info
        if (lastStatus?.updatedBy?.type) {
          cancelledByType =
            lastStatus.updatedBy.type === "staff"
              ? "Admin"
              : lastStatus.updatedBy.type === "driver"
              ? "Driver"
              : lastStatus.updatedBy.type === "admin"
              ? "Admin"
              : "Parent";
        }
        // Then check completedBy if no type in status history
        else if (log.completedBy?.type) {
          cancelledByType =
            log.completedBy.type === "staff"
              ? "Admin"
              : log.completedBy.type === "driver"
              ? "Driver"
              : log.completedBy.type === "admin"
              ? "Admin"
              : "Parent";
        }
        // Default to Parent if no type information found
        else {
          cancelledByType = "Parent";
        }

        console.log("Determined cancelledByType:", cancelledByType);

        return (
          <div className="space-y-1 border-l-2 border-red-400 pl-2">
            <div className="text-xs text-red-500 dark:text-red-400">
              Cancelled at {formatDateTime(lastStatus?.updatedAt)}
            </div>
          
            <div className="text-xs font-medium text-red-600 dark:text-red-400">
              Cancelled by {cancelledByType}
            </div>
          </div>
        );
      }
      return null;
    };

    return (
      <div className="space-y-2">
        {getInitiatorInfo()}
        {log.status === "completed" && getCompletionInfo()}
        {log.status === "cancelled" && getCancellationInfo()}
        {log.status !== "completed" && log.status !== "cancelled" && (
          <div className="text-xs text-gray-500 dark:text-gray-400 border-l-2 border-gray-400 pl-2">
            Requested at {formatDateTime(log.pickupTime)}
          </div>
        )}
      </div>
    );
  };

  const organizeLogs = (logs) => {
    const today = new Date();
    const grouped = {};

    // Initialize sections
    grouped["Today"] = [];

    // Last 7 days individually
    for (let i = 1; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      grouped[formatDate(date)] = [];
    }

    grouped["Last Month"] = [];
    grouped["Last 3 Months"] = [];

    // Sort logs into appropriate sections
    logs.forEach((log) => {
      const logDate = new Date(log.pickupTime);
      const dayDiff = Math.floor((today - logDate) / (1000 * 60 * 60 * 24));
      const monthDiff =
        today.getMonth() +
        12 * today.getFullYear() -
        (logDate.getMonth() + 12 * logDate.getFullYear());

      if (dayDiff === 0) {
        grouped["Today"].push(log);
      } else if (dayDiff < 7) {
        const dateKey = formatDate(logDate);
        if (grouped[dateKey]) {
          grouped[dateKey].push(log);
        }
      } else if (monthDiff === 0) {
        grouped["Last Month"].push(log);
      } else if (monthDiff <= 3) {
        grouped["Last 3 Months"].push(log);
      }
    });

    // Remove empty sections
    return Object.fromEntries(
      Object.entries(grouped).filter(([_, logs]) => logs.length > 0)
    );
  };

  const handleDeleteAllLogs = async () => {
    setIsDeletingAll(true);
    try {
      const response = await axios.delete(
        "http://localhost:5000/api/pickup/delete-all"
      );

      if (response.data.success) {
        const deletedCount = response.data.deletedCount;
        await fetchPickupLogs();
        setShowDeleteAllModal(false);

        notification.success({
          message: "Success",
          description: `Successfully deleted ${deletedCount} pickup log${
            deletedCount !== 1 ? "s" : ""
          }`,
          placement: "topRight",
          duration: 3,
        });
      } else {
        throw new Error(
          response.data.message || "Failed to delete pickup logs"
        );
      }
    } catch (error) {
      console.error("Error deleting pickup logs:", error);
      notification.error({
        message: "Error",
        description: error.response?.data?.message || error.message,
        placement: "topRight",
        duration: 4,
      });
    } finally {
      setIsDeletingAll(false);
    }
  };

  const handleDeleteLog = async (logId) => {
    try {
      const response = await axios.delete(
        `http://localhost:5000/api/pickup/${logId}`
      );
      if (response.data.success) {
        await fetchPickupLogs();
        setShowDeleteModal(false);
        setSelectedLogId(null);

        notification.success({
          message: "Success",
          description: "Pickup log has been deleted successfully",
          placement: "topRight",
          duration: 3,
        });
      } else {
        throw new Error(response.data.message || "Failed to delete log");
      }
    } catch (error) {
      console.error("Error deleting log:", error);
      notification.error({
        message: "Error",
        description: error.response?.data?.message || error.message,
        placement: "topRight",
        duration: 4,
      });
    }
  };

  const tabItems = Object.entries(displayLogs).map(([label, logs]) => ({
    label: label,
    key: label,
    children: (
      <div className="rounded-md border dark:border-gray-700">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="dark:text-gray-200">Student Name</TableHead>
              <TableHead className="dark:text-gray-200">Student Code</TableHead>
              <TableHead className="dark:text-gray-200">Parent Name</TableHead>
              <TableHead className="dark:text-gray-200">Parent Email</TableHead>
              <TableHead className="dark:text-gray-200">Request Time</TableHead>
              <TableHead className="dark:text-gray-200">Status</TableHead>
              <TableHead className="dark:text-gray-200 min-w-[250px]">
                Pickup Details
              </TableHead>
              <TableHead className="text-right dark:text-gray-200">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.map((log) => (
              <TableRow key={log._id} className="dark:hover:bg-gray-800/50">
                <TableCell className="font-medium dark:text-gray-300">
                  {log.studentNames || "N/A"}
                </TableCell>
                <TableCell className="dark:text-gray-300">
                  {log.studentCodes || "N/A"}
                </TableCell>
                <TableCell className="dark:text-gray-300">
                  {log.parent?.name || "N/A"}
                </TableCell>
                <TableCell className="dark:text-gray-300">
                  {log.parent?.email || "N/A"}
                </TableCell>
                <TableCell className="dark:text-gray-300">
                  <Tooltip title={formatDateTime(log.pickupTime)}>
                    {formatTime(log.pickupTime)}
                  </Tooltip>
                </TableCell>
                <TableCell className="dark:text-gray-300">
                  {getStatusTag(log.status)}
                </TableCell>
                <TableCell className="dark:text-gray-300">
                  {getPickupDetails(log)}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end space-x-2">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        setSelectedLogId(log._id);
                        setShowDeleteModal(true);
                      }}
                      className="bg-red-500 hover:bg-red-600 text-white"
                    >
                      Delete
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {(!logs || logs.length === 0) && (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="text-center py-8 text-gray-500 dark:text-gray-400"
                >
                  No pickup logs found for this date
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    ),
  }));

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <main className="flex-1 flex flex-col gap-4 p-4 md:gap-8 md:p-6 overflow-auto">
        <Card className="flex-1 flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-2xl font-bold dark:text-white w-1/4">
              Student Pickup Log
            </CardTitle>

            {/* Search Container */}
            <div className="flex items-center justify-center gap-2 w-1/2">
              <div className="relative flex items-center w-full max-w-md">
                <input
                  type="text"
                  placeholder="Search by student, parent, driver, or code..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleSearch(e.target.value);
                    }
                  }}
                  className="w-full px-3 py-2 border rounded-l-md dark:bg-gray-800 dark:border-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <Button
                  onClick={() => handleSearch(searchTerm)}
                  className="rounded-l-none border-l-0"
                  variant="outline"
                >
                  Search
                </Button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 w-1/4 justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={fetchPickupLogs}
                disabled={loading}
                className="gap-2"
              >
                {loading && <ReloadIcon className="h-4 w-4 animate-spin" />}
                {loading ? "Refreshing..." : "Refresh"}
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setShowDeleteAllModal(true)}
                className="bg-red-500 hover:bg-red-600 text-white"
              >
                Delete All Logs
              </Button>
            </div>
          </CardHeader>

          <CardContent className="flex-1 overflow-auto">
            {loading && Object.keys(pickupLogs).length === 0 ? (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-gray-100"></div>
              </div>
            ) : (
              <div className="dark:[&_.ant-tabs-tab]:text-gray-300 dark:[&_.ant-tabs-tab-active]:bg-gray-800 dark:[&_.ant-tabs-nav]:bg-gray-900">
                <Tabs
                  activeKey={activeKey}
                  onChange={setActiveKey}
                  items={tabItems}
                  className="h-full text-teal-500 flex flex-col dark:text-gray-300 dark:bg-gray-900"
                  type="card"
                />
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Delete All Modal */}
      {showDeleteAllModal && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen">
            <div
              className="fixed inset-0 transition-opacity"
              onClick={() => setShowDeleteAllModal(false)}
            >
              <div className="absolute inset-0 bg-gray-500/75 dark:bg-gray-900/80"></div>
            </div>

            <div className="relative bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-xl transform transition-all sm:max-w-lg sm:w-full">
              <div className="px-4 pt-5 pb-4 sm:p-6">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:text-left">
                    <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-gray-100">
                      Delete All Pickup Logs
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Are you sure you want to delete all pickup logs? This
                        action cannot be undone.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                  <button
                    type="button"
                    className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm ${
                      isDeletingAll ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                    onClick={handleDeleteAllLogs}
                    disabled={isDeletingAll}
                  >
                    {isDeletingAll ? "Deleting..." : "Delete All"}
                  </button>
                  <button
                    type="button"
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
                    onClick={() => setShowDeleteAllModal(false)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Single Log Modal */}
      {showDeleteModal && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen">
            <div
              className="fixed inset-0 transition-opacity"
              onClick={() => setShowDeleteModal(false)}
            >
              <div className="absolute inset-0 bg-gray-500/75 dark:bg-gray-900/80"></div>
            </div>

            <div className="relative bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-xl transform transition-all sm:max-w-lg sm:w-full">
              <div className="px-4 pt-5 pb-4 sm:p-6">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:text-left">
                    <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-gray-100">
                      Delete Pickup Log
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Are you sure you want to delete this pickup log? This
                        action cannot be undone.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                  <button
                    type="button"
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                    onClick={() => handleDeleteLog(selectedLogId)}
                  >
                    Delete
                  </button>
                  <button
                    type="button"
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
                    onClick={() => setShowDeleteModal(false)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
