const express = require("express");
const router = express.Router();
const QRCodeController = require("../controller/qrCodeController");
const {
  validateQRCodeGeneration,
  validateQRCodeVerification,
} = require("../middleware/qrCodeValidation");

// Routes with validation middleware
router.post(
  "/generate",
  validateQRCodeGeneration,
  QRCodeController.generateQRCode
);

router.post(
  "/verify",
  validateQRCodeVerification,
  QRCodeController.verifyQRCode
);

router.get("/history", QRCodeController.getQRCodeHistory);

router.get("/active", QRCodeController.getActiveQRCodes);

router.patch("/:code/deactivate", QRCodeController.deactivateQRCode);

router.delete("/:code", QRCodeController.deleteQRCode);

module.exports = router;
