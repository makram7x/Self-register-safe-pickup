// notificationsRoutes.js
const express = require("express");
const Notifications = require("../models/notificationsSchema");

// Create a function that takes io as a parameter
const createNotificationRoutes = (io) => {
  const router = express.Router();

  // GET route to retrieve all notifications
  router.get("/", async (req, res) => {
    try {
      const notifications = await Notifications.find().sort({ createdAt: -1 });
      console.log("Retrieved notifications:", notifications);
      res.json(notifications);
    } catch (error) {
      console.error("Error retrieving notifications:", error);
      res.status(500).json({ error: "An error occurred" });
    }
  });

  // POST route to create a new notification
  router.post("/", async (req, res) => {
    try {
      const { title, description, icon } = req.body;
      const createdAt = new Date();

      const newNotification = new Notifications({
        title,
        description,
        icon,
        createdAt,
      });

      const savedNotification = await newNotification.save();

      // Emit the new notification to all connected clients
      io.emit("newNotification", savedNotification);

      res.status(201).json(savedNotification);
    } catch (error) {
      console.error("Error creating Notification:", error);
      res.status(500).json({ error: "An error occurred" });
    }
  });

  // DELETE route for bulk deletion
  router.delete("/bulk", async (req, res) => {
    try {
      const { ids } = req.body;
      const result = await Notifications.deleteMany({ _id: { $in: ids } });

      // Emit deletion event to all connected clients
      io.emit("notificationsDeleted", ids);

      res.json({
        message: "Notifications deleted successfully",
        deletedCount: result.deletedCount,
      });
    } catch (error) {
      console.error("Error deleting notifications:", error);
      res.status(500).json({ error: "An error occurred" });
    }
  });

  return router;
};

module.exports = createNotificationRoutes;
