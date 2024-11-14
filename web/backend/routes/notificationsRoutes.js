const express = require('express');
const Notifications = require('../models/notificationsSchema');

const router = express.Router();

// GET route to retrieve all notifications
router.get('/', async (req, res) => {
  try {
    const notifications = await Notifications.find();
    console.log('Retrieved notifications:', notifications);
    res.json(notifications);
  } catch (error) {
    console.error('Error retrieving notifications:', error);
    res.status(500).json({ error: 'An error occurred' });
  }
});

// POST route to create a new notification
router.post('/', async (req, res) => {
  try {
    const { title, description, icon } = req.body;
    const createdAt = new Date();

    const newNotifications = new Notifications({
      title,
      description,
      icon,
      createdAt,
    });

    const savedNotifications = await newNotifications.save();
    res.status(201).json(savedNotifications);
  } catch (error) {
    console.error('Error creating Notification:', error);
    res.status(500).json({ error: 'An error occurred' });
  }
});

router.delete("/bulk", async (req, res) => {
  try {
    const { ids } = req.body;
    const result = await Notifications.deleteMany({ _id: { $in: ids } });
    res.json({
      message: "Notifications deleted successfully",
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error("Error deleting notifications:", error);
    res.status(500).json({ error: "An error occurred" });
  }
});
module.exports = router;