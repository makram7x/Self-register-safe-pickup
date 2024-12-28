const validateQRCodeGeneration = (req, res, next) => {
  const { schoolId } = req.body;

  if (!schoolId) {
    return res.status(400).json({
      success: false,
      message: "School ID is required",
    });
  }

  next();
};

const validateQRCodeVerification = (req, res, next) => {
  const { code, parentId, studentId, driverId } = req.body;

  // QR code is always required
  if (!code) {
    return res.status(400).json({
      success: false,
      message: "QR code is required",
    });
  }

  // Check if either a parentId or driverId is provided
  if (!parentId && !driverId) {
    return res.status(400).json({
      success: false,
      message: "Either parent ID or driver ID is required",
    });
  }

  // If it's a parent scan (not a driver), studentId is required
  if (parentId && !driverId && !studentId) {
    return res.status(400).json({
      success: false,
      message: "Student ID is required for parent scans",
    });
  }

  // Don't allow both parentId and driverId
  if (parentId && driverId) {
    return res.status(400).json({
      success: false,
      message: "Cannot provide both parent ID and driver ID",
    });
  }

  next();
};

module.exports = {
  validateQRCodeGeneration,
  validateQRCodeVerification,
};
