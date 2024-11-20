// middleware/qrCodeValidation.js
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
  const { code, parentId, studentId } = req.body;

  if (!code || !parentId || !studentId) {
    return res.status(400).json({
      success: false,
      message: "Code, parent ID, and student ID are required",
    });
  }

  next();
};

module.exports = {
  validateQRCodeGeneration,
  validateQRCodeVerification,
};
