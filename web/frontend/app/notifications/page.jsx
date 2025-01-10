"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { CardTitle, CardHeader, CardContent, Card } from "@/components/ui/card";
import { Checkbox, message } from "antd";
import io from "socket.io-client";
import AnnouncementModal from "@/components/component/AnnoucementModal";
import {
  CalendarCheckIcon,
  CircleAlertIcon,
  MegaphoneIcon,
} from "@/public/icons/icons";

export default function Notifications() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [announcements, setAnnouncements] = useState([]);
  const [selectedAnnouncements, setSelectedAnnouncements] = useState([]);
  const [socket, setSocket] = useState(null);
  const [deleteAlert, setDeleteAlert] = useState({
    visible: false,
    message: "",
    count: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      hour12: true,
    });
  };

  const getRelativeTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) {
      return "just now";
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} ${minutes === 1 ? "minute" : "minutes"} ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} ${hours === 1 ? "hour" : "hours"} ago`;
    } else if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} ${days === 1 ? "day" : "days"} ago`;
    } else {
      return formatDate(date);
    }
  };

  // Add debug logging for state changes
  useEffect(() => {
    console.log("Current announcements:", announcements);
  }, [announcements]);

  useEffect(() => {
    // Initialize socket connection with error handling
    const newSocket = io("http://localhost:5000", {
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    newSocket.on("connect", () => {
      console.log("Connected to WebSocket server");
      // Explicitly fetch announcements after connection
      fetchAnnouncements();
    });

    newSocket.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
      message.error("Failed to connect to notification server");
    });

    newSocket.on("disconnect", () => {
      console.log("Disconnected from WebSocket server");
    });

    newSocket.on("newNotification", (notification) => {
      console.log("New notification received:", notification);
      setAnnouncements((prev) => {
        const updated = [notification, ...prev];
        console.log("Updated announcements:", updated);
        return updated;
      });
      message.info("New notification received");
    });

    setSocket(newSocket);

    return () => {
      if (newSocket) {
        console.log("Cleaning up socket connection");
        newSocket.disconnect();
      }
    };
  }, []);

  const fetchAnnouncements = async () => {
    console.log("Fetching announcements...");
    setLoading(true);
    setError(null);

    try {
      console.log("Making API request...");
      const response = await fetch("http://localhost:5000/api/notifications", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      console.log("API Response status:", response.status);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Received data:", data);

      if (Array.isArray(data)) {
        setAnnouncements(data);
      } else {
        console.error("Received non-array data:", data);
        setAnnouncements([]);
      }
    } catch (error) {
      console.error("Error fetching announcements:", error);
      setError(error.message);
      message.error("Failed to fetch announcements");
      setAnnouncements([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAnnouncement = async (data) => {
    try {
      const response = await fetch("http://localhost:5000/api/notifications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        const newAnnouncement = await response.json();
        setIsModalOpen(false);
        message.success("Announcement created successfully");
        // Fetch updated announcements
        fetchAnnouncements();
      } else {
        message.error("Error creating announcement");
      }
    } catch (error) {
      console.error("Error creating announcement:", error);
      message.error("Error creating announcement");
    }
  };

  const handleDeleteSelected = async () => {
    try {
      const response = await fetch(
        "http://localhost:5000/api/notifications/bulk",
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ ids: selectedAnnouncements }),
        }
      );

      if (response.ok) {
        const deletedCount = selectedAnnouncements.length;
        message.success(
          `Successfully deleted ${deletedCount} notification${
            deletedCount !== 1 ? "s" : ""
          }`
        );
        setSelectedAnnouncements([]);
        // Fetch updated announcements
        fetchAnnouncements();
      } else {
        message.error("Error deleting notifications");
      }
    } catch (error) {
      console.error("Error deleting announcements:", error);
      message.error("Error deleting notifications");
    }
  };

  // Initial fetch of announcements
  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedAnnouncements(announcements.map((a) => a._id));
    } else {
      setSelectedAnnouncements([]);
    }
  };

  const handleSelectAnnouncement = (id) => {
    setSelectedAnnouncements((prev) => {
      if (prev.includes(id)) {
        return prev.filter((item) => item !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  function getIcon(icon) {
    switch (icon) {
      case "calendar":
        return (
          <CalendarCheckIcon className="w-6 h-6 text-gray-700 dark:text-black" />
        );
      case "alert":
        return (
          <CircleAlertIcon className="w-6 h-6 text-gray-700 dark:text-black" />
        );
      case "megaphone":
        return (
          <MegaphoneIcon className="w-6 h-6 text-gray-700 dark:text-black" />
        );
      default:
        return (
          <CalendarCheckIcon className="w-6 h-6 text-gray-700 dark:text-black" />
        );
    }
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <div className="flex-1 flex flex-col overflow-auto">
        <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
          <div className="flex items-center justify-between">
            <Card className="w-full">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 mb-4">
                <div className="flex items-center gap-4">
                  <CardTitle className="text-sm font-medium text-gray-900 dark:text-white">
                    Announcements
                  </CardTitle>
                  <Checkbox
                    checked={
                      selectedAnnouncements.length === announcements.length &&
                      announcements.length > 0
                    }
                    indeterminate={
                      selectedAnnouncements.length > 0 &&
                      selectedAnnouncements.length < announcements.length
                    }
                    onChange={handleSelectAll}
                  >
                    <span className="text-sm ml-2 text-gray-700 dark:text-gray-300">
                      Select All ({selectedAnnouncements.length}/
                      {announcements.length})
                    </span>
                  </Checkbox>
                </div>
                <div className="flex gap-2">
                  {selectedAnnouncements.length > 0 && (
                    <Button
                      className="bg-red-500 text-white hover:bg-red-600 transition-colors"
                      size="sm"
                      onClick={handleDeleteSelected}
                    >
                      Delete Selected
                    </Button>
                  )}
                  <Button
                    className="bg-black text-white hover:bg-gray-900 transition-colors"
                    size="sm"
                    onClick={() => setIsModalOpen(true)}
                  >
                    Create New Announcement
                  </Button>
                </div>
                <AnnouncementModal
                  open={isModalOpen}
                  onClose={() => setIsModalOpen(false)}
                  onSubmit={handleCreateAnnouncement}
                  className="dark:bg-gray-800"
                />
              </CardHeader>
              <CardContent className="overflow-auto">
                <div className="bg-white dark:bg-gray-900 p-6">
                  <div className="space-y-4">
                    {announcements.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        No notifications yet
                      </div>
                    ) : (
                      announcements.map((announcement) => (
                        <div
                          key={announcement._id}
                          className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4"
                        >
                          <div className="flex items-start">
                            <Checkbox
                              checked={selectedAnnouncements.includes(
                                announcement._id
                              )}
                              onChange={() =>
                                handleSelectAnnouncement(announcement._id)
                              }
                              className="mt-2 mr-4"
                            />
                            <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center">
                              {getIcon(announcement.icon)}
                            </div>
                            <div className="ml-4 flex-1">
                              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                {announcement.title}
                              </h3>
                              <p className="text-gray-600 dark:text-gray-400 mt-1 text-sm">
                                {announcement.description}
                              </p>
                              <p className="text-gray-500 dark:text-gray-500 text-xs mt-2">
                                {getRelativeTime(announcement.createdAt)}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
