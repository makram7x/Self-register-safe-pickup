"use client";
import React, { createContext, useContext, useState, useEffect } from "react";
import { notification } from "antd";
import { Bell, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter, useSearchParams } from "next/navigation";
import io from "socket.io-client";

const NotificationContext = createContext();

export function NotificationProvider({ children }) {
  const [socket, setSocket] = useState(null);
  const [pendingPickups, setPendingPickups] = useState([]);
  const router = useRouter();
  const searchParams = useSearchParams();
  const [api, contextHolder] = notification.useNotification();

  // Get drawer state from URL parameter
  const isDrawerOpen = searchParams.get("drawer") === "true";

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
            <span className="font-medium">{pickup.studentNames}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Parent:</span>
            <span className="font-medium">{pickup.parent.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Code:</span>
            <span className="font-mono bg-gray-100 px-2 rounded">
              {pickup.studentCodes}
            </span>
          </div>
        </div>
      ),
      placement: "topRight",
      duration: 6,
      style: {
        backgroundColor: "#ffffff",
        borderRadius: "8px",
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
        border: "1px solid #e5e7eb",
      },
      className: "custom-notification",
      btn: (
        <Button
          size="sm"
          className="mt-2 bg-blue-500 hover:bg-blue-600 text-white"
          onClick={() => {
            notification.destroy();
            // Navigate to dashboard with drawer parameter
            const dashboardUrl = new URL("/dashboard", window.location.origin);
            dashboardUrl.searchParams.set("drawer", "true");
            router.push(dashboardUrl.toString());
          }}
        >
          View Details
        </Button>
      ),
      icon: <AlertTriangle className="h-5 w-5 text-yellow-500" />,
    });
    const audio = new Audio("/sounds/notification-sound.mp3"); // Remove 'public' from the path
    audio.play().catch((error) => {
      // More detailed error handling
      console.log("Error playing sound:", error);
    });
  };

  useEffect(() => {
    const newSocket = io("http://localhost:5000");
    setSocket(newSocket);

    return () => newSocket.disconnect();
  }, []);

  useEffect(() => {
    if (!socket) return;

    socket.on("new-pickup", (pickup) => {
      if (pickup.status === "pending") {
        setPendingPickups((prev) => [...prev, pickup]);
        showPickupNotification(pickup);
      }
    });

    socket.on("pickup-status-updated", ({ pickupId, status }) => {
      setPendingPickups((prev) => {
        if (status !== "pending") {
          return prev.filter((p) => p._id !== pickupId);
        }
        return prev;
      });
    });

    socket.on("pickup-deleted", (pickupId) => {
      setPendingPickups((prev) => prev.filter((p) => p._id !== pickupId));
    });

    return () => {
      socket.off("new-pickup");
      socket.off("pickup-status-updated");
      socket.off("pickup-deleted");
    };
  }, [socket]);

  return (
    <NotificationContext.Provider
      value={{
        socket,
        pendingPickups,
        setPendingPickups,
        isDrawerOpen,
        setIsDrawerOpen,
      }}
    >
      {contextHolder}
      {children}
    </NotificationContext.Provider>
  );
}

export const useNotification = () => useContext(NotificationContext);
