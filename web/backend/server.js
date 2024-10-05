//setup express.js server
const express = require("express");
const connectDB = require("./DB");
const app = express();
const PORT = process.env.PORT || 5000;
const studentRoutes = require("./routes/studentRoutes");
const cors = require("cors");
const notificationsRoutes = require("./routes/notificationsRoutes");
const uploadRoutes = require("./routes/uploadRoutes");
const uniqueCodeRoutes = require("./routes/uniqueCodeRoutes");
app.use(express.json());
app.use(cors());
//connect to database
connectDB();

app.use("/api/students", studentRoutes);
app.use("/api/notifications", notificationsRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/generate-codes", uniqueCodeRoutes);

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
