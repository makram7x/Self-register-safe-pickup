const Pickup = require("../models/pickupLogsSchema");
const ParentStudentLink = require("../models/parentStudentLink");
const mongoose = require("mongoose");
const Driver = require("../models/driverSchema");
const User = require("../models/userSchema");

// Helper function for emitting pickup stats
const emitPickupStats = async (io) => {
  try {
    // Get counts directly instead of using the route handlers
    const [activeCount, delayedCount, completedCount, cancelledCount] = await Promise.all([
      Pickup.countDocuments({ status: "pending" }),
      Pickup.countDocuments({
        status: "pending",
        pickupTime: {
          $lt: new Date(Date.now() - 15 * 60 * 1000) // 15 minutes ago
        }
      }),
      Pickup.countDocuments({ status: "completed" }),
      Pickup.countDocuments({ status: "cancelled" })
    ]);

    const stats = {
      activeCount,
      delayedCount,
      completedCount,
      cancelledCount
    };

    console.log('Emitting new stats:', stats); // Debug log
    io.emit("pickup-stats-update", stats);
  } catch (error) {
    console.error("Error emitting pickup stats:", error);
  }
};

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
    const io = req.app.get("io");

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

    if (io) {
      io.emit("pickup-deleted", id);
      await emitPickupStats(io);
    }

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
    const io = req.app.get("io");

    if (io) {
      await emitPickupStats(io);
    }

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

const createPickup = async (req, res) => {
  try {
    const { pickupCode, studentIds, studentInfo, parent, driverId } = req.body;
    const io = req.app.get("io");

    if (!pickupCode || !studentIds || !studentIds.length) {
      return res.status(400).json({
        success: false,
        message: "Pickup code and student information are required",
      });
    }

    let initiator = null;
    let parentInfo = parent;

    if (driverId) {
      const driver = await Driver.findById(driverId);
      if (!driver) {
        return res.status(404).json({
          success: false,
          message: "Driver not found",
        });
      }

      const parentUser = await User.findById(driver.parentId);
      if (!parentUser) {
        return res.status(404).json({
          success: false,
          message: "Parent not found for this driver",
        });
      }

      initiator = {
        id: driver._id,
        name: driver.name,
        email: driver.email,
        phone: driver.phone,
        type: "driver",
        verificationCode: driver.verificationCode,
      };

      parentInfo = {
        id: parentUser._id,
        name: parentUser.name,
        email: parentUser.email,
      };
    }

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

    if (io) {
      io.emit("new-pickup", newPickup);
      await emitPickupStats(io);
    }

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

    pickup.status = status;

    if (status === "completed") {
      pickup.completedAt = new Date();

      if (updatedBy?.type === "staff") {
        pickup.completedBy = {
          ...updatedBy,
          type: "staff",
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
          type: "staff",
        };
      }

      pickup.statusHistory.push({
        status,
        updatedAt: new Date(),
        notes,
        updatedBy: {
          id: updatedBy?.id || pickup.parent.id,
          name: updatedBy?.name || pickup.parent.name,
          type: updatedBy?.type || "parent",
          email: updatedBy?.email || pickup.parent.email,
        },
      });
    }

    const updatedPickup = await pickup.save();

    if (io) {
      io.emit("pickup-status-updated", {
        pickupId: id,
        status,
        pickup: updatedPickup,
      });
      await emitPickupStats(io);
    }

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

const getActivePickupsCount = async (req, res) => {
  try {
    const count = await Pickup.countDocuments({ status: "pending" });
    res.json({ count });
  } catch (error) {
    console.error("Error fetching active pickups count:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const getDelayedPickupsCount = async (req, res) => {
  try {
    const currentTime = new Date();
    const fifteenMinutesInMs = 15 * 60 * 1000;

    const count = await Pickup.countDocuments({
      status: "pending",
      pickupTime: {
        $lt: new Date(currentTime.getTime() - fifteenMinutesInMs),
      },
    });

    res.json({ count });
  } catch (error) {
    console.error("Error fetching delayed pickups count:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const getCompletedPickupsCount = async (req, res) => {
  try {
    const count = await Pickup.countDocuments({ status: "completed" });
    res.json({ count });
  } catch (error) {
    console.error("Error fetching completed pickups count:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const getCancelledPickupsCount = async (req, res) => {
  try {
    const count = await Pickup.countDocuments({ status: "cancelled" });
    res.json({ count });
  } catch (error) {
    console.error("Error fetching cancelled pickups count:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
  createPickup,
  getParentPickups,
  updatePickupStatus,
  deletePickup,
  getAllPickupLogs,
  deleteAllPickupLogs,
  getActivePickupsCount,
  getCompletedPickupsCount,
  getCancelledPickupsCount,
  getDelayedPickupsCount,
  emitPickupStats,
};
