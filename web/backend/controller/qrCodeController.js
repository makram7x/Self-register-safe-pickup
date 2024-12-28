const express = require("express");
const router = express.Router();
const QRCode = require("../models/QRcode");
const crypto = require("crypto");

// Generate new QR code
const generateQRCode = async (req, res) => {
  try {
    const { schoolId, timestamp, expiresAt } = req.body;

    // Generate unique code
    const code = crypto.randomBytes(16).toString("hex");

    const qrCode = new QRCode({
      schoolId,
      code,
      createdAt: timestamp || new Date(),
      expiresAt: expiresAt || new Date(Date.now() + 24 * 60 * 60 * 1000),
      isActive: true,
      scans: [],
    });

    await qrCode.save();

    res.json({
      success: true,
      qrCode: code,
      expiresAt: qrCode.expiresAt,
      generatedAt: qrCode.createdAt,
    });
  } catch (error) {
    console.error("Error generating QR code:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate QR code",
      error: error.message,
    });
  }
};

// Verify QR code
const verifyQRCode = async (req, res) => {
  try {
    const { code, parentId, studentId, driverId } = req.body;
    console.log("Verifying QR code with data:", {
      code,
      parentId,
      studentId,
      driverId,
    });

    // First check if QR code is valid
    const qrCode = await QRCode.findOne({
      code,
      isActive: true,
      expiresAt: { $gt: new Date() },
    });

    if (!qrCode) {
      console.log("QR code not found or expired:", code);
      return res.status(400).json({
        success: false,
        message: "Invalid or expired QR code",
      });
    }

    // If it's a driver scanning
    if (driverId) {
      // Get the driver to find their associated parentId
      const driver = await Driver.findById(driverId);
      if (!driver || !driver.active) {
        console.log("Driver not found or inactive:", driverId);
        return res.status(400).json({
          success: false,
          message: "Invalid driver credentials",
        });
      }

      // Record the scan with the driver's parent ID
      qrCode.scans.push({
        parentId: driver.parentId,
        driverId: driverId,
        timestamp: new Date(),
      });

      await qrCode.save();

      return res.json({
        success: true,
        schoolId: qrCode.schoolId,
        driverId: driverId,
        parentId: driver.parentId,
      });
    }

    // If it's a parent scanning
    if (parentId) {
      qrCode.scans.push({
        parentId,
        studentId,
        timestamp: new Date(),
      });

      await qrCode.save();

      return res.json({
        success: true,
        schoolId: qrCode.schoolId,
        parentId: parentId,
      });
    }

    // If neither driverId nor parentId provided
    return res.status(400).json({
      success: false,
      message: "Missing required identification",
    });
  } catch (error) {
    console.error("Error verifying QR code:", error);
    res.status(500).json({
      success: false,
      message: "Failed to verify QR code",
      error: error.message,
    });
  }
};

// Get QR code history
const getQRCodeHistory = async (req, res) => {
  try {
    const { schoolId } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;

    const qrCodes = await QRCode.find({ schoolId })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(); // Using lean() for better performance since we don't need Mongoose instances

    const total = await QRCode.countDocuments({ schoolId });

    const formattedQRCodes = qrCodes.map((qr) => ({
      ...qr,
      status: qr.isActive
        ? new Date() > qr.expiresAt
          ? "expired"
          : "active"
        : "deactivated",
    }));

    res.json({
      success: true,
      qrCodes: formattedQRCodes,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalQRCodes: total,
    });
  } catch (error) {
    console.error("Error fetching QR codes:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch QR codes",
      error: error.message,
    });
  }
};

// Get active QR codes
const getActiveQRCodes = async (req, res) => {
  try {
    const { schoolId } = req.query;

    const activeQRCodes = await QRCode.find({
      schoolId,
      isActive: true,
      expiresAt: { $gt: new Date() },
    })
      .sort({ createdAt: -1 })
      .lean();

    const formattedQRCodes = activeQRCodes.map((qr) => ({
      ...qr,
      status: "active",
      timeLeft: new Date(qr.expiresAt) - new Date(),
    }));

    res.json({
      success: true,
      activeQRCodes: formattedQRCodes,
    });
  } catch (error) {
    console.error("Error fetching active QR codes:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch active QR codes",
      error: error.message,
    });
  }
};

// Deactivate QR code
const deactivateQRCode = async (req, res) => {
  try {
    const { code } = req.params;

    const qrCode = await QRCode.findOne({ code });

    if (!qrCode) {
      return res.status(404).json({
        success: false,
        message: "QR code not found",
      });
    }

    qrCode.isActive = false;
    await qrCode.save();

    res.json({
      success: true,
      message: "QR code deactivated successfully",
    });
  } catch (error) {
    console.error("Error deactivating QR code:", error);
    res.status(500).json({
      success: false,
      message: "Failed to deactivate QR code",
      error: error.message,
    });
  }
};

//export all the functions
module.exports = {
  generateQRCode,
  verifyQRCode,
  getQRCodeHistory,
  getActiveQRCodes,
  deactivateQRCode,
};
