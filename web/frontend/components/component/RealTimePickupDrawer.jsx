import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Modal, notification } from "antd";
import { Bell } from "lucide-react";
import axios from "axios";
import { useNotification } from "./NotificationProvider";

const RealtimePickupDrawer = ({ isOpen, onClose, onPickupsUpdate }) => {
  const [pickups, setPickups] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedPickup, setSelectedPickup] = useState(null);
  const [actionType, setActionType] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const { socket } = useNotification();

  // Base API URL from environment variable
  const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

  useEffect(() => {
    if (isOpen) {
      fetchPendingPickups();
    }
  }, [isOpen]);

  // Socket effect handler
  useEffect(() => {
    if (!socket) return;

    const handleNewPickup = (pickup) => {
      console.log("New pickup received:", pickup);
      if (pickup.status === "pending") {
        const formattedPickup = {
          id: pickup._id,
          studentName: pickup.studentNames,
          studentCode: pickup.studentCodes,
          parentName: pickup.parent.name,
          parentEmail: pickup.parent.email,
          pickupTime: new Date(pickup.pickupTime).toLocaleString(),
          status: pickup.status,
        };

        setPickups((prev) => {
          const newPickups = [formattedPickup, ...prev];
          onPickupsUpdate?.(newPickups);
          return newPickups;
        });
      }
    };

    const handleStatusUpdate = ({ pickupId, status }) => {
      console.log("Status update received:", { pickupId, status });
      if (status !== "pending") {
        setPickups((prev) => {
          const updatedPickups = prev.filter((p) => p.id !== pickupId);
          onPickupsUpdate?.(updatedPickups);
          return updatedPickups;
        });
      }
    };

    const handlePickupDelete = (pickupId) => {
      console.log("Pickup deletion received:", pickupId);
      setPickups((prev) => {
        const updatedPickups = prev.filter((p) => p.id !== pickupId);
        onPickupsUpdate?.(updatedPickups);
        return updatedPickups;
      });
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

  const showActionConfirmation = (pickup, type) => {
    setSelectedPickup(pickup);
    setActionType(type);
    setShowConfirmModal(true);
  };

  const fetchPendingPickups = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(`${API_BASE_URL}/api/pickup/logs`);

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

        setPickups(pendingPickups);
        onPickupsUpdate?.(pendingPickups);
      }
    } catch (error) {
      console.error("Error fetching pending pickups:", error);
      notification.error({
        message: "Error",
        description: "Failed to fetch pending pickups",
        placement: "topRight",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePickupStatus = async () => {
    if (!selectedPickup || !actionType) return;

    try {
      setIsProcessing(true);
      await axios.put(
        `${API_BASE_URL}/api/pickup/${selectedPickup.id}/status`,
        {
          status: actionType,
          updatedBy: {
            id: "507f1f77bcf86cd799439011",
            name: "Admin User",
            type: "staff",
            email: "admin@example.com",
          },
          notes: `Pickup ${actionType} by admin at ${new Date().toISOString()}`,
        }
      );

      notification.success({
        message: "Success",
        description: `Pickup ${actionType} successfully`,
        placement: "topRight",
      });

      setPickups((prev) => {
        const updatedPickups = prev.filter((p) => p.id !== selectedPickup.id);
        onPickupsUpdate?.(updatedPickups);
        return updatedPickups;
      });
    } catch (error) {
      console.error("Error updating pickup status:", error);
      notification.error({
        message: "Error",
        description: `Failed to ${actionType} pickup: ${
          error.response?.data?.message || error.message
        }`,
        placement: "topRight",
      });
    } finally {
      setIsProcessing(false);
      setShowConfirmModal(false);
      setSelectedPickup(null);
      setActionType(null);
    }
  };

  return (
    <>
      <div className="space-y-4">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Pending Pickups
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {pickups.length} pending requests
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-700 dark:border-gray-300"></div>
          </div>
        ) : pickups.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            No pending pickups
          </div>
        ) : (
          pickups.map((pickup) => (
            <div
              key={pickup.id}
              className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg space-y-2 border border-gray-200 dark:border-gray-700"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">
                    {pickup.studentName}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Code: {pickup.studentCode}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Parent: {pickup.parentName}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500">
                    Requested: {pickup.pickupTime}
                  </p>
                </div>
                <span className="text-xs bg-yellow-500/20 text-yellow-700 dark:text-yellow-500 px-2 py-1 rounded-full">
                  Pending
                </span>
              </div>
              <div className="flex space-x-2 mt-2">
                <Button
                  size="sm"
                  variant="primary"
                  className="bg-green-600 hover:bg-green-700 text-white"
                  onClick={() => showActionConfirmation(pickup, "completed")}
                >
                  Complete
                </Button>
                <Button
                  size="sm"
                  variant="primary"
                  className="bg-red-500 text-white hover:bg-red-950/20"
                  onClick={() => showActionConfirmation(pickup, "cancelled")}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      <Modal
        title={`Confirm ${actionType} Pickup`}
        open={showConfirmModal}
        onCancel={() => setShowConfirmModal(false)}
        onOk={handlePickupStatus}
        okText={
          actionType === "completed" ? "Complete Pickup" : "Cancel Pickup"
        }
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
    </>
  );
};

export default RealtimePickupDrawer;
