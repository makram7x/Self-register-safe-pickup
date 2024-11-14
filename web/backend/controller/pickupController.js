const Pickup = require("../models/pickupLogsSchema");
const ParentStudentLink = require("../models/parentStudentLink");
const mongoose = require("mongoose");

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

const updatePickupStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const parentId = req.user?._id || req.user?.id || req.user;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid pickup id",
      });
    }

    const pickup = await Pickup.findOne({
      _id: id,
      parentId: parentId,
    });

    if (!pickup) {
      return res.status(404).json({
        success: false,
        message: "Pickup not found or unauthorized",
      });
    }

    pickup.status = status;
    await pickup.save();

    res.status(200).json({
      success: true,
      message: "Pickup status updated successfully",
      data: pickup,
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

const deletePickup = async (req, res) => {
  try {
    const { id } = req.params;
    const parentId = req.user?._id || req.user?.id || req.user;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid pickup id",
      });
    }

    const pickup = await Pickup.findOne({
      _id: id,
      parentId: parentId,
    });

    if (!pickup) {
      return res.status(404).json({
        success: false,
        message: "Pickup not found or unauthorized",
      });
    }

    await pickup.delete();

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

const createPickup = async (req, res) => {
  try {
    const { pickupCode, studentIds, studentInfo, parent } = req.body;

    console.log("Creating pickup with data:", {
      pickupCode,
      studentIds,
      studentInfo,
      parent,
    });

    // Validate required data
    if (!pickupCode || !studentIds || !studentIds.length || !parent) {
      return res.status(400).json({
        success: false,
        message:
          "Pickup code, student information, and parent information are required",
      });
    }

    // Create new pickup with the extended information
    const newPickup = new Pickup({
      pickupCode,
      studentIds, // Keep original array of IDs
      parent: {
        id: parent.id,
        name: parent.name,
        email: parent.email,
      },
      // Store full student info
      studentNames: studentInfo.map((s) => s.name).join(", "),
      studentCodes: studentInfo.map((s) => s.code).join(", "),
      status: "pending",
    });

    await newPickup.save();

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

// Update getAllPickupLogs to match the new schema
const getAllPickupLogs = async (req, res) => {
  try {
    const pickups = await Pickup.find().sort({ pickupTime: -1 });

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
