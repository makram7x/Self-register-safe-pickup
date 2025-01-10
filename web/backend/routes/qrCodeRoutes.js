const express = require("express");
const {
  validateQRCodeGeneration,
  validateQRCodeVerification,
} = require("../middleware/qrCodeValidation");

// Export a function that takes io as parameter
module.exports = (io) => {
  const router = express.Router();

  // Get the controller instance with io
  const QRCodeController = require("../controller/qrCodeController")(io);

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

  return router;
};
