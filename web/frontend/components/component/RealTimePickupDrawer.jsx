import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { Modal, notification } from "antd";
import axios from "axios";
import { Bell } from "lucide-react";

const RealtimePickupDrawer = ({ isOpen, onClose, onPickupsUpdate }) => {
  const [pickups, setPickups] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [socket, setSocket] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedPickup, setSelectedPickup] = useState(null);
  const [actionType, setActionType] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [api, contextHolder] = notification.useNotification();

  useEffect(() => {
    if (isOpen) {
      fetchPendingPickups();
    }
  }, [isOpen]);

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
            <span className="font-medium">{pickup.studentName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Parent:</span>
            <span className="font-medium">{pickup.parentName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Code:</span>
            <span className="font-mono bg-gray-100 px-2 rounded">
              {pickup.studentCode}
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
            // Close the notification and open the drawer if it's not already open
            api.destroy();
            if (!isOpen) {
              onClose(false);
            }
          }}
        >
          View Details
        </Button>
      ),
    });

    // Play a notification sound
    const audio = new Audio("/sounds/notification-sound.mp3"); // Make sure to add this file to your public folder
    audio.play().catch((error) => console.log("Error playing sound:", error));
  };

  // Listen for real-time updates
  useEffect(() => {
    if (!socket) return;

    socket.on("new-pickup", (pickup) => {
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
        onPickupsUpdate(newPickups); // Update parent component
        return newPickups;
      });
      showPickupNotification(formattedPickup);
    });

    socket.on("pickup-status-updated", ({ pickupId, status }) => {
      setPickups((prev) =>
        prev.map((pickup) =>
          pickup.id === pickupId ? { ...pickup, status } : pickup
        )
      );
    });

    socket.on("pickup-deleted", (pickupId) => {
      setPickups((prev) => prev.filter((pickup) => pickup.id !== pickupId));
    });

    return () => {
      socket.off("new-pickup");
      socket.off("pickup-status-updated");
      socket.off("pickup-deleted");
    };
  }, [socket]);

  useEffect(() => {
    if (isOpen) {
      fetchPendingPickups();
    }
  }, [isOpen]);

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

        setPickups(pendingPickups);
        onPickupsUpdate(pendingPickups); // Update parent component
      }
    } catch (error) {
      console.error("Error fetching pending pickups:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const showActionConfirmation = (pickup, type) => {
    setSelectedPickup(pickup);
    setActionType(type);
    setShowConfirmModal(true);
  };

 const handlePickupStatus = async () => {
   if (!selectedPickup || !actionType) return;

   try {
     setIsProcessing(true);
     await axios.put(
       `http://localhost:5000/api/pickup/${selectedPickup.id}/status`,
       {
         status: actionType,
         updatedBy: {
           id: "507f1f77bcf86cd799439011", // A valid ObjectId format
           name: "Admin User",
           type: "staff", // Changed from 'admin' to 'staff' to match enum
           email: "admin@example.com",
         },
         notes: `Pickup ${actionType} by admin at ${new Date().toISOString()}`,
       }
     );

     // Show success notification
     notification.success({
       message: "Success",
       description: `Pickup ${actionType} successfully`,
       placement: "topRight",
     });

     // Remove from local state if completed or cancelled
     setPickups((prev) => prev.filter((p) => p.id !== selectedPickup.id));
   } catch (error) {
     console.error(`Error updating pickup status:`, error);
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

  return (
    <>
      {contextHolder}
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
      <StatusConfirmationModal />
    </>
  );
};

export default RealtimePickupDrawer;
