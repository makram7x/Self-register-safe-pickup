const authMiddleware = (req, res, next) => {
  try {
    console.log("Auth Middleware - Full req.user:", req.user);

    // Check if user exists in request
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    // Extract parent ID based on your auth structure
    const parentId =
      req.user.data?.id || // For email login
      req.user.data?._id || // Alternative email login format
      req.user._id || // For Google auth
      req.user.id; // Fallback

    if (!parentId) {
      console.error("No parent ID found in auth data:", req.user);
      return res.status(401).json({
        success: false,
        message: "User ID not found",
      });
    }

    // Add parentId to req for use in controllers
    req.parentId = parentId;
    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    return res.status(401).json({
      success: false,
      message: "Authentication error",
    });
  }
};
