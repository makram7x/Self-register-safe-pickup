// server.js
const express = require("express");
const connectDB = require("./DB");
const app = express();
const PORT = process.env.PORT || 5000;
const cors = require("cors");

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
const authMiddleware = require('./middleware/authMiddleware');
// app.use('/api/pickup', authMiddleware, pickupRoutes);

// Middleware
app.use(express.json());
app.use(cors());

// Connect to database
connectDB();

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

// 404 handler
app.use((req, res) => {
  console.log(`404: ${req.method} ${req.url} not found`);
  res.status(404).json({
    success: false,
    message: `Route ${req.url} not found`,
  });
});

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
