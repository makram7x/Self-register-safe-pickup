/**
 * This code was generated by v0 by Vercel.
 * @see https://v0.dev/t/j3ROUP98UtM
 * Documentation: https://v0.dev/docs#integrating-generated-code-into-your-nextjs-app
 */

/** Add fonts into your Next.js project:

import { Inter } from 'next/font/google'

inter({
  subsets: ['latin'],
  display: 'swap',
})

To read more about using these font, please visit the Next.js documentation:
- App Directory: https://nextjs.org/docs/app/building-your-application/optimizing/fonts
- Pages Directory: https://nextjs.org/docs/pages/building-your-application/optimizing/fonts
**/
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
import { Tabs, Tag,Tooltip } from "antd";
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

  useEffect(() => {
    fetchPickupLogs();
    const interval = setInterval(fetchPickupLogs, 30000);
    return () => clearInterval(interval);
  }, []);

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

  const getStatusTag = (status) => {
    const statusColors = {
      pending: "gold",
      completed: "green",
      cancelled: "red",
      initiated: "blue"
    };

    return (
      <Tag color={statusColors[status] || 'default'}>
        {status?.charAt(0).toUpperCase() + status?.slice(1) || 'N/A'}
      </Tag>
    );
  };

  const formatDateTime = (timestamp) => {
    if (!timestamp) return "N/A";
    return new Date(timestamp).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true
    });
  };


  const fetchPickupLogs = async () => {
    try {
      setLoading(true);
      const response = await axios.get("http://localhost:5000/api/pickup/logs");
      if (response.data.success) {
        const logs = response.data.data;

        // Group logs by date with shortened date format
        const grouped = logs.reduce((acc, log) => {
          const date = formatDate(log.pickupTime);
          if (!acc[date]) {
            acc[date] = [];
          }
          acc[date].push(log);
          return acc;
        }, {});

        // Sort logs within each date group by time (newest first)
        Object.keys(grouped).forEach((date) => {
          grouped[date].sort(
            (a, b) => new Date(b.pickupTime) - new Date(a.pickupTime)
          );
        });

        setPickupLogs(grouped);

        // Set initial active tab to most recent date
        const dates = Object.keys(grouped).sort(
          (a, b) => new Date(b.split(",")[1]) - new Date(a.split(",")[1])
        );
        if (dates.length > 0 && !activeKey) {
          setActiveKey(dates[0]);
        }
      }
    } catch (error) {
      console.error("Error fetching pickup logs:", error);
    } finally {
      setLoading(false);
    }
  };

  // Updated tab items with status column
  const tabItems = Object.entries(pickupLogs)
    .sort(
      ([dateA], [dateB]) =>
        new Date(dateB.split(",")[1]) - new Date(dateA.split(",")[1])
    )
    .map(([date, logs]) => ({
      label: date,
      key: date,
      children: (
        <div className="rounded-md border dark:border-gray-700">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="dark:text-gray-200">
                  Student Name
                </TableHead>
                <TableHead className="dark:text-gray-200">
                  Student Code
                </TableHead>
                <TableHead className="dark:text-gray-200">
                  Parent Name
                </TableHead>
                <TableHead className="dark:text-gray-200">
                  Parent Email
                </TableHead>
                <TableHead className="dark:text-gray-200">
                  Request Time
                </TableHead>
                <TableHead className="dark:text-gray-200">Status</TableHead>
                <TableHead className="dark:text-gray-200">
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
                    {log.status === "completed" ? (
                      <div className="space-y-1">
                        <div className="text-xs text-green-500 dark:text-green-400">
                          Picked up at {formatDateTime(log.completedAt)}
                        </div>
                        {log.completedBy && (
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            Verified by: {log.completedBy}
                          </div>
                        )}
                      </div>
                    ) : log.status === "cancelled" ? (
                      <div className="text-xs text-red-500 dark:text-red-400">
                        Cancelled
                        {log.cancelReason && `: ${log.cancelReason}`}
                      </div>
                    ) : (
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Awaiting pickup
                      </div>
                    )}
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


  const handleDeleteAllLogs = async () => {
    setIsDeletingAll(true);
    try {
      const response = await axios.delete(
        "http://localhost:5000/api/pickup/delete-all"
      );

      if (response.data.success) {
        const deletedCount = response.data.deletedCount;
        alert(
          `Successfully deleted ${deletedCount} pickup log${
            deletedCount !== 1 ? "s" : ""
          }`
        );
        await fetchPickupLogs();
        setShowDeleteAllModal(false);
      } else {
        throw new Error(
          response.data.message || "Failed to delete pickup logs"
        );
      }
    } catch (error) {
      console.error("Error deleting pickup logs:", error);
      alert(
        `Error deleting pickup logs: ${
          error.response?.data?.message || error.message || "Please try again."
        }`
      );
    } finally {
      setIsDeletingAll(false);
    }
  };

  const handleDeleteLog = async (logId) => {
    try {
      const response = await axios.delete(
        `http://localhost:5000/api/pickup/logs/${logId}`
      );
      if (response.data.success) {
        await fetchPickupLogs();
        setShowDeleteModal(false);
      }
    } catch (error) {
      console.error("Error deleting log:", error);
      alert("Error deleting log. Please try again.");
    }
  };

  return (
    <div className="h-screen flex flex-col">
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6 overflow-hidden">
        <Card className="flex-1 flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-2xl font-bold dark:text-white">
              Student Pickup Log
            </CardTitle>
            <div className="flex items-center gap-2">
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

          <CardContent className="flex-1 overflow-hidden">
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