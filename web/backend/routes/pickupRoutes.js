const express = require("express");
const router = express.Router();
const {
  createPickup,
  getParentPickups,
  deleteAllPickupLogs,
  deletePickup,
  updatePickupStatus,
  getAllPickupLogs, // Add this import
  getActivePickupsCount,
  getDelayedPickupsCount,
  getCompletedPickupsCount,
  getCancelledPickupsCount,
} = require("../controller/pickupController");

router.get("/active/count", getActivePickupsCount);
router.get("/delayed/count", getDelayedPickupsCount);
router.get("/completed/count", getCompletedPickupsCount);
router.get("/cancelled/count", getCancelledPickupsCount);
// Add this new route
router.delete("/delete-all", deleteAllPickupLogs); // This must come before the /:id route
router.get("/logs", getAllPickupLogs);
router.post("/", createPickup);
router.get("/parent", getParentPickups);
router.delete("/:id", deletePickup); // This should come after /delete-all
router.put("/:id/status", updatePickupStatus);

module.exports = router;
