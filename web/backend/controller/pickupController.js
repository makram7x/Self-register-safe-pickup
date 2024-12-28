const Pickup = require("../models/pickupLogsSchema");
const ParentStudentLink = require("../models/parentStudentLink");
const mongoose = require("mongoose");
const Driver = require("../models/driverSchema");
const User = require("../models/userSchema");

const getParentPickups = async (req, res) => {
  try {
    const parentId = req.user?._id || req.user?.id || req.user;

    if (!parentId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const pickups = await Pickup.find({ parentId })
      .populate({
        path: "studentIds",
        select: "studentInfo.name studentInfo.uniqueCode",
      })
      .sort({ pickupTime: -1 });

    res.json({
      success: true,
      data: pickups,
    });
  } catch (error) {
    console.error("Error fetching pickups:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch pickups",
      error: error.message,
    });
  }
};

const deletePickup = async (req, res) => {
  try {
    const { id } = req.params;
    const IO = req.app.get("io"); // Get Socket.IO instance

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid pickup id",
      });
    }

    const pickup = await Pickup.findByIdAndDelete(id);

    if (!pickup) {
      return res.status(404).json({
        success: false,
        message: "Pickup not found",
      });
    }

    // Emit socket event for real-time updates
    IO.emit("pickup-deleted", id);

    res.status(200).json({
      success: true,
      message: "Pickup deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting pickup:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete pickup",
      error: error.message,
    });
  }
};

const deleteAllPickupLogs = async (req, res) => {
  try {
    const result = await Pickup.deleteMany({});
    return res.status(200).json({
      success: true,
      message: "All pickup logs deleted successfully",
      deletedCount: result.deletedCount || 0,
    });
  } catch (error) {
    console.error("Error deleting all pickup logs:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete all pickup logs",
      error: error.message,
    });
  }
};

// Create new pickup
const createPickup = async (req, res) => {
  console.log("Request body:", req.body);
  console.log("Driver ID:", req.body.driverId);
  if (req.body.driverId) {
    const driver = await Driver.findById(req.body.driverId);
    console.log("Found driver:", driver);
    const parentUser = await User.findById(driver.parentId);
    console.log("Found parent:", parentUser);
  }
  try {
    const { pickupCode, studentIds, studentInfo, parent, driverId } = req.body;
    const io = req.app.get("io");

    // Validate required data
    if (!pickupCode || !studentIds || !studentIds.length) {
      return res.status(400).json({
        success: false,
        message: "Pickup code and student information are required",
      });
    }

    // If driverId is provided, get driver and parent information
    let initiator = null;
    let parentInfo = parent;

    if (driverId) {
      // Get driver information
      const driver = await Driver.findById(driverId);
      if (!driver) {
        return res.status(404).json({
          success: false,
          message: "Driver not found",
        });
      }

      // Get parent information using the driver's parentId
      const parentUser = await User.findById(driver.parentId);
      if (!parentUser) {
        return res.status(404).json({
          success: false,
          message: "Parent not found for this driver",
        });
      }

      // Set initiator as driver
      initiator = {
        id: driver._id,
        name: driver.name,
        email: driver.email,
        phone: driver.phone,
        type: "driver",
        verificationCode: driver.verificationCode,
      };

      // Set parent information from the found parent user
      parentInfo = {
        id: parentUser._id,
        name: parentUser.name,
        email: parentUser.email,
      };
    }

    // Validate parent information is available
    if (
      !parentInfo ||
      !parentInfo.id ||
      !parentInfo.name ||
      !parentInfo.email
    ) {
      return res.status(400).json({
        success: false,
        message: "Parent information is required",
      });
    }

    // Create new pickup
    const newPickup = new Pickup({
      pickupCode,
      studentIds,
      studentNames: studentInfo.map((s) => s.name).join(", "),
      studentCodes: studentInfo.map((s) => s.code).join(", "),
      parent: {
        id: parentInfo.id,
        name: parentInfo.name,
        email: parentInfo.email,
      },
      initiatedBy: initiator || {
        id: parentInfo.id,
        name: parentInfo.name,
        email: parentInfo.email,
        type: "parent",
      },
      status: "pending",
    });

    // Initialize status history
    newPickup.statusHistory.push({
      status: "pending",
      updatedBy: {
        id: initiator?.id || parentInfo.id,
        name: initiator?.name || parentInfo.name,
        type: initiator ? "driver" : "parent",
      },
      updatedAt: new Date(),
    });

    await newPickup.save();

    // Emit socket event for real-time updates
    io.emit("new-pickup", newPickup);

    res.status(201).json({
      success: true,
      message: "Pickup registered successfully",
      data: {
        pickup: newPickup,
        students: studentInfo,
      },
    });
  } catch (error) {
    console.error("Pickup creation error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to register pickup",
      error: error.message,
    });
  }
};

const updatePickupStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, updatedBy, notes } = req.body;
    const io = req.app.get("io");

    console.log("Update request body:", req.body); // Debug log

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid pickup id",
      });
    }

    const pickup = await Pickup.findById(id);

    if (!pickup) {
      return res.status(404).json({
        success: false,
        message: "Pickup not found",
      });
    }

    // Update pickup status
    pickup.status = status;

    // Set completed information if status is completed
    if (status === "completed") {
      pickup.completedAt = new Date();

      // Set completedBy based on who's completing the pickup
      if (updatedBy?.type === "staff") {
        pickup.completedBy = {
          ...updatedBy,
          type: "staff", // Ensure type is set correctly for admin/staff
        };
      } else if (updatedBy?.type === "driver") {
        pickup.completedBy = {
          ...updatedBy,
          type: "driver",
        };
      } else {
        pickup.completedBy = {
          id: pickup.parent.id,
          name: pickup.parent.name,
          email: pickup.parent.email,
          type: "staff", // Default to staff for parent completions in completedBy
        };
      }

      // Add to status history with original updater type
      pickup.statusHistory.push({
        status,
        updatedAt: new Date(),
        notes,
        updatedBy: {
          id: updatedBy?.id || pickup.parent.id,
          name: updatedBy?.name || pickup.parent.name,
          type: updatedBy?.type || "parent", // Keep original type in history
          email: updatedBy?.email || pickup.parent.email,
        },
      });
    }

    console.log("Updated pickup before save:", JSON.stringify(pickup, null, 2)); // Debug log

    const updatedPickup = await pickup.save();

    console.log("Pickup after save:", JSON.stringify(updatedPickup, null, 2)); // Debug log

    io.emit("pickup-status-updated", {
      pickupId: id,
      status,
      pickup: updatedPickup,
    });

    res.json({
      success: true,
      message: `Pickup status updated to ${status}`,
      data: updatedPickup,
    });
  } catch (error) {
    console.error("Error updating pickup status:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update pickup status",
      error: error.message,
    });
  }
};

// Update getAllPickupLogs to match the new schema
const getAllPickupLogs = async (req, res) => {
  try {
    const pickups = await Pickup.find()
      .select({
        pickupCode: 1,
        studentNames: 1,
        studentCodes: 1,
        parent: 1,
        initiatedBy: 1,
        completedBy: 1,
        status: 1,
        pickupTime: 1,
        statusHistory: 1,
        completedAt: 1,
      })
      .sort({ pickupTime: -1 });

    console.log("Sample pickup data:", pickups[0]); // Debug log

    res.json({
      success: true,
      data: pickups,
    });
  } catch (error) {
    console.error("Error fetching pickup logs:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch pickup logs",
      error: error.message,
    });
  }
};

module.exports = {
  createPickup,
  getParentPickups,
  updatePickupStatus,
  deletePickup,
  getAllPickupLogs,
  deleteAllPickupLogs,
};
