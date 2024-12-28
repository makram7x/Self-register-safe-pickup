const express = require("express");
const router = express.Router();
const {
  getDrivers,
  addDriver,
  removeDriver,
  verifyDriver,
  loginDriver,
  registerDriver,
  getDriverById,
  getDriverCode,
} = require("../controller/driverController");

// Debug logs for each route hit
router.use((req, res, next) => {
  console.log(`Driver route hit: ${req.method} ${req.path}`);
  next();
});

// Auth routes should come first
router.post("/login", (req, res) => {
  console.log("POST login route hit");
  loginDriver(req, res);
});

router.post("/register", (req, res) => {
  console.log("POST register route hit");
  registerDriver(req, res);
});

router.post("/verify", (req, res) => {
  console.log("POST verify route hit");
  verifyDriver(req, res);
});

// Get single driver by ID - using same endpoint as frontend
router.get("/single/:driverId", (req, res) => {
  console.log("GET single driver route hit with ID:", req.params.driverId);
  getDriverById(req, res);
});

// Get all drivers for a parent - moved after specific routes
router.get("/parent/:parentId", (req, res) => {
  console.log("GET all drivers route hit for parent:", req.params.parentId);
  getDrivers(req, res);
});

// Other routes
router.post("/", (req, res) => {
  console.log("POST new driver route hit");
  addDriver(req, res);
});

router.delete("/:driverId", (req, res) => {
  console.log("DELETE driver route hit");
  removeDriver(req, res);
});

router.get("/:driverId/code", (req, res) => {
  getDriverCode(req, res);
});

module.exports = router;
