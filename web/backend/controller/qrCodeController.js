const QRCode = require("../models/QRcode");
const Driver = require("../models/driverSchema");
const crypto = require("crypto");

module.exports = (io) => {
  // Generate QR Code
  const generateQRCode = async (req, res) => {
    try {
      const { schoolId, timestamp, expiresAt } = req.body;
      const code = crypto.randomBytes(16).toString("hex");

      const qrCode = new QRCode({
        schoolId: schoolId || "default",
        code,
        createdAt: timestamp || new Date(),
        expiresAt: expiresAt || new Date(Date.now() + 24 * 60 * 60 * 1000),
        isActive: true,
        scans: [],
      });

      await qrCode.save();
      console.log("Generated new QR code:", qrCode);

      // Emit socket event for real-time updates
      io.emit("qrCodeUpdated");

      res.json({
        success: true,
        qrCode: {
          ...qrCode.toObject(),
          id: qrCode._id.toString(),
          generatedAt: qrCode.createdAt,
        },
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

  // Verify QR Code
  const verifyQRCode = async (req, res) => {
    try {
      const { code, parentId, studentId, driverId } = req.body;
      console.log("Verifying QR code with data:", {
        code,
        parentId,
        studentId,
        driverId,
      });

      // Check if QR code exists and is valid
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

      // Handle driver scanning
      if (driverId) {
        const driver = await Driver.findById(driverId);
        if (!driver || !driver.active) {
          console.log("Driver not found or inactive:", driverId);
          return res.status(400).json({
            success: false,
            message: "Invalid driver credentials",
          });
        }

        qrCode.scans.push({
          parentId: driver.parentId,
          driverId: driverId,
          timestamp: new Date(),
        });

        await qrCode.save();
        io.emit("qrCodeScanned", { driverId, code });

        return res.json({
          success: true,
          schoolId: qrCode.schoolId,
          driverId: driverId,
          parentId: driver.parentId,
        });
      }

      // Handle parent scanning
      if (parentId) {
        qrCode.scans.push({
          parentId,
          studentId,
          timestamp: new Date(),
        });

        await qrCode.save();
        io.emit("qrCodeScanned", { parentId, code });

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

  // Get Active QR Codes
  const getActiveQRCodes = async (req, res) => {
    try {
      const activeQRCodes = await QRCode.find({
        isActive: true,
        expiresAt: { $gt: new Date() },
      }).lean();

      console.log("Found active QR codes:", activeQRCodes.length);

      const formattedQRCodes = activeQRCodes.map((qr) => ({
        ...qr,
        id: qr._id.toString(),
        code: qr.code,
        createdAt: qr.createdAt,
        generatedAt: qr.createdAt,
        expiresAt: qr.expiresAt,
        isActive: qr.isActive,
        status: "active",
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

  // Get QR Code History
  const getQRCodeHistory = async (req, res) => {
    try {
      const qrCodes = await QRCode.find({}).sort({ createdAt: -1 }).lean();

      console.log("Found QR codes in history:", qrCodes.length);

      const formattedQRCodes = qrCodes.map((qr) => {
        const now = new Date();
        const expiry = new Date(qr.expiresAt);

        let status = qr.isActive
          ? now > expiry
            ? "expired"
            : "active"
          : "deactivated";

        return {
          ...qr,
          id: qr._id.toString(),
          code: qr.code,
          createdAt: qr.createdAt,
          generatedAt: qr.createdAt,
          expiresAt: qr.expiresAt,
          status: status,
        };
      });

      res.json({
        success: true,
        qrCodes: formattedQRCodes,
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

  // Deactivate QR Code
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

      // Emit socket event for real-time updates
      io.emit("qrCodeUpdated");

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

  // Delete QR Code
  const deleteQRCode = async (req, res) => {
    try {
      const { code } = req.params;
      const result = await QRCode.findOneAndDelete({ code });

      if (!result) {
        return res.status(404).json({
          success: false,
          message: "QR code not found",
        });
      }

      // Emit socket event for real-time updates
      io.emit("qrCodeUpdated");

      res.json({
        success: true,
        message: "QR code deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting QR code:", error);
      res.status(500).json({
        success: false,
        message: "Failed to delete QR code",
        error: error.message,
      });
    }
  };

  // Return all controller functions
  return {
    generateQRCode,
    verifyQRCode,
    getQRCodeHistory,
    getActiveQRCodes,
    deactivateQRCode,
    deleteQRCode,
  };
};
