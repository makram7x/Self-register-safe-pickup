const mongoose = require("mongoose");

const qrCodeSchema = new mongoose.Schema({
  schoolId: {
    type: String,
    required: true,
  },
  code: {
    type: String,
    required: true,
    unique: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  expiresAt: {
    type: Date,
    required: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  scans: [
    {
      parentId: String,
      studentId: String,
      timestamp: Date,
    },
  ],
});

module.exports = mongoose.model("QRCode", qrCodeSchema);
