"use client";
import React, { createContext, useContext, useState, useEffect } from "react";
import { notification } from "antd";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter, useSearchParams } from "next/navigation";
import io from "socket.io-client";

const NotificationContext = createContext();

export function NotificationProvider({ children }) {
  const [socket, setSocket] = useState(null);
  const [pendingPickups, setPendingPickups] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState("disconnected");
  const router = useRouter();
  const searchParams = useSearchParams();

  const isDrawerOpen = searchParams.get("drawer") === "true";

  useEffect(() => {
    const SOCKET_URL =
      process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:5000";

    console.log("Attempting socket connection to:", SOCKET_URL);

    const newSocket = io(SOCKET_URL, {
      transports: ["polling", "websocket"], // Allow both polling and websocket
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 10000,
      withCredentials: true,
      autoConnect: true,
    });

    // Debug listeners
    newSocket.on("connect", () => {
      console.log("Socket connected successfully, ID:", newSocket.id);
      setConnectionStatus("connected");
      newSocket.emit("join", "admin"); // Join admin room
    });

    newSocket.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
      setConnectionStatus("error");
    });

    setSocket(newSocket);

    return () => {
      if (newSocket) {
        newSocket.disconnect();
      }
    };
  }, []);

  const setIsDrawerOpen = (open) => {
    const url = new URL(window.location.href);
    if (open) {
      url.searchParams.set("drawer", "true");
    } else {
      url.searchParams.delete("drawer");
    }
    router.replace(url.pathname + url.search);
  };

  const showPickupNotification = (pickup) => {
    notification.open({
      message: (
        <div className="flex items-center space-x-2">
          <Bell className="h-5 w-5 text-blue-500" />
          <span className="font-semibold">New Pickup Request</span>
        </div>
      ),
      description: (
        <div className="mt-2 space-y-1">
          <div className="flex justify-between">
            <span className="text-gray-500">Student:</span>
            <span className="font-medium">
              {pickup.studentNames || pickup.studentName}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Parent:</span>
            <span className="font-medium">
              {pickup.parent?.name || pickup.parentName}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Code:</span>
            <span className="font-mono bg-gray-100 px-2 rounded">
              {pickup.studentCodes || pickup.studentCode}
            </span>
          </div>
        </div>
      ),
      placement: "topRight",
      duration: 6,
      className: "custom-notification",
      btn: (
        <Button
          size="sm"
          className="mt-2 bg-blue-500 hover:bg-blue-600 text-white"
          onClick={() => {
            notification.destroy();
            const dashboardUrl = new URL("/dashboard", window.location.origin);
            dashboardUrl.searchParams.set("drawer", "true");
            router.push(dashboardUrl.toString());
          }}
        >
          View Details
        </Button>
      ),
    });

    // Play notification sound with error handling
    const audio = new Audio("/sounds/notification-sound.mp3");
    audio.play().catch((error) => {
      console.log("Error playing sound:", error);
      // Don't show error to user as sound is not critical
    });
  };

  useEffect(() => {
    if (!socket) return;

    const handleNewPickup = (pickup) => {
      console.log("New pickup received in provider:", pickup);
      if (pickup.status === "pending") {
        setPendingPickups((prev) => [...prev, pickup]);
        showPickupNotification(pickup);
      }
    };

    const handleStatusUpdate = ({ pickupId, status }) => {
      console.log("Status update received in provider:", { pickupId, status });
      setPendingPickups((prev) => {
        if (status !== "pending") {
          return prev.filter((p) => p._id !== pickupId);
        }
        return prev;
      });
    };

    const handlePickupDelete = (pickupId) => {
      console.log("Pickup deletion received in provider:", pickupId);
      setPendingPickups((prev) => prev.filter((p) => p._id !== pickupId));
    };

    socket.on("new-pickup", handleNewPickup);
    socket.on("pickup-status-updated", handleStatusUpdate);
    socket.on("pickup-deleted", handlePickupDelete);

    return () => {
      socket.off("new-pickup", handleNewPickup);
      socket.off("pickup-status-updated", handleStatusUpdate);
      socket.off("pickup-deleted", handlePickupDelete);
    };
  }, [socket]);

  const value = {
    socket,
    pendingPickups,
    setPendingPickups,
    isDrawerOpen,
    setIsDrawerOpen,
    connectionStatus,
    showPickupNotification,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      "useNotification must be used within a NotificationProvider"
    );
  }
  return context;
};
