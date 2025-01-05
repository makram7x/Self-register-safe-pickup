// server.js
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
// Initialize Socket.IO with CORS
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:3000", "http://localhost:5173"], // Your frontend URL
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
    allowedHeaders: ["Content-Type"],
  },
});

// Socket.IO connection handling
io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

// Make io accessible to other files
app.set("io", io);

// Middleware
app.use(express.json());
app.use(cors());

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

// 404 handler
app.use((req, res, next) => {
  console.log(`Request received: ${req.method} ${req.url}`);
  next();
});

// 404 handler
app.use((req, res) => {
  console.log(`404 Error Details:`);
  console.log(`- Method: ${req.method}`);
  console.log(`- URL: ${req.url}`);
  console.log(`- Headers:`, req.headers);
  console.log(`- Body:`, req.body);

  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.url} not found`,
  });
});

// Important: Use 'server' instead of 'app' to listen
server.listen(PORT, () => console.log(`Server started on port ${PORT}`));
