const express = require("express");
const connectDB = require("./DB");
const app = express();
const PORT = process.env.PORT || 5000;
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");

// Create HTTP server
const server = http.createServer(app);

console.log("Node.js version:", process.version);

// Allowed origins for CORS
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:5173",
  "https://self-register-safe-pickup.railway.app",
  process.env.FRONTEND_URL || "*",
];

// Initialize Socket.IO with CORS
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
  },
});

// Socket.IO connection handling
io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });

  // Add error handling for socket connections
  socket.on("error", (error) => {
    console.error("Socket error:", error);
  });
});

// Make io accessible to other files
app.set("io", io);

// Middleware
app.use(express.json());
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Basic request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Health check route
app.get("/", (req, res) => {
  res.json({
    status: "success",
    message: "API is running",
    version: "1.0",
    timestamp: new Date().toISOString(),
  });
});

// API status route
app.get("/api", (req, res) => {
  res.json({
    status: "success",
    message: "API is healthy",
    endpoints: {
      students: {
        base: "/api/students",
        description: "Student management endpoints",
      },
      notifications: {
        base: "/api/notifications",
        description: "Notification handling endpoints",
      },
      upload: {
        base: "/api/upload",
        description: "File upload endpoints",
      },
      generateCodes: {
        base: "/api/generate-codes",
        description: "Unique code generation endpoints",
      },
      users: {
        base: "/api/users",
        description: "User management endpoints",
      },
      parentStudentLinks: {
        base: "/api/parent-student-links",
        description: "Parent-student relationship management",
      },
      auth: {
        base: "/api/auth",
        description: "Authentication endpoints",
      },
      pickup: {
        base: "/api/pickup",
        description: "Student pickup management",
      },
      qrCodes: {
        base: "/api/qr-codes",
        description: "QR code generation and management",
      },
      drivers: {
        base: "/api/drivers",
        description: "Driver management endpoints",
      },
    },
  });
});

// Connect to database
connectDB();

// Import routes
const studentRoutes = require("./routes/studentRoutes");
const notificationsRoutes = require("./routes/notificationsRoutes");
const uploadRoutes = require("./routes/uploadRoutes");
const uniqueCodeRoutes = require("./routes/uniqueCodeRoutes");
const userRoutes = require("./routes/userRoutes");
const parentStudentLinkRoutes = require("./routes/parentStudentRoutes");
const authRoutes = require("./routes/authRoutes");
const pickupRoutes = require("./routes/pickupRoutes");
const qrCodeRoutes = require("./routes/qrCodeRoutes");
const driverRoutes = require("./routes/driverRoutes");

// Routes
app.use("/api/students", studentRoutes);
app.use("/api/notifications", notificationsRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/generate-codes", uniqueCodeRoutes);
app.use("/api/users", userRoutes);
app.use("/api/parent-student-links", parentStudentLinkRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/pickup", pickupRoutes);
app.use("/api/qr-codes", qrCodeRoutes);
app.use("/api/drivers", driverRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(err.status || 500).json({
    status: "error",
    message: err.message || "Internal server error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

// 404 handler with detailed logging
app.use((req, res) => {
  const errorDetails = {
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.url,
    headers: req.headers,
    body: req.body,
    query: req.query,
  };

  console.log("404 Error Details:", JSON.stringify(errorDetails, null, 2));

  res.status(404).json({
    status: "error",
    message: `Route ${req.method} ${req.url} not found`,
    timestamp: errorDetails.timestamp,
  });
});

// Start server with enhanced error handling
server.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`Health check: http://localhost:${PORT}/`);
  console.log(`API documentation: http://localhost:${PORT}/api`);
});
