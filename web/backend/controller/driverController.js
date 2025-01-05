const Driver = require("../models/driverSchema");
const ParentStudentLink = require("../models/parentStudentLink");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
require("dotenv").config();

exports.getDriverById = async (req, res) => {
  try {
    const driverId = req.params.driverId;
    console.log("Fetching driver details for ID:", driverId);

    const driver = await Driver.findById(driverId);
    console.log("Raw driver data from DB:", driver);

    if (!driver) {
      console.log("Driver not found");
      return res.status(404).json({
        success: false,
        message: "Driver not found",
      });
    }

    console.log("Driver parentId:", driver.parentId);

    const response = {
      success: true,
      data: {
        id: driver._id,
        name: driver.name,
        email: driver.email,
        phone: driver.phone,
        parentId: driver.parentId,
        isDriver: true,
      },
    };

    console.log("Sending driver response:", response);
    res.json(response);
  } catch (error) {
    console.error("Error fetching driver:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch driver details",
    });
  }
};

exports.loginDriver = async (req, res) => {
  try {
    const { email, password } = req.body;

    const driver = await Driver.findOne({ email: email.toLowerCase() });

    if (!driver) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const isValidPassword = await bcrypt.compare(password, driver.password);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const token = jwt.sign(
      { id: driver._id, isDriver: true },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    console.log("Driver data before response:", {
      id: driver._id,
      parentId: driver.parentId,
      name: driver.name,
    });

    res.json({
      success: true,
      data: {
        token,
        driver: {
          id: driver._id,
          name: driver.name,
          email: driver.email,
          phone: driver.phone,
          isDriver: true,
          parentId: driver.parentId,
        },
      },
    });
  } catch (error) {
    console.error("Driver login error:", error);
    res.status(500).json({
      success: false,
      message: "Login failed",
    });
  }
};

exports.registerDriver = async (req, res) => {
  try {
    const { verificationCode, password } = req.body;

    const driver = await Driver.findOne({ verificationCode });

    if (!driver) {
      return res.status(400).json({
        success: false,
        message: "Invalid verification code",
      });
    }

    if (driver.password) {
      return res.status(400).json({
        success: false,
        message: "Driver already registered",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    driver.password = hashedPassword;
    driver.isRegistered = true;
    await driver.save();

    res.status(201).json({
      success: true,
      message:
        "Registration successful. You can now login with your email and password.",
    });
  } catch (error) {
    console.error("Driver registration error:", error);
    res.status(500).json({
      success: false,
      message: "Registration failed",
    });
  }
};

exports.getDrivers = async (req, res) => {
  try {
    const { parentId } = req.params;
    console.log("Fetching drivers for parentId:", parentId);

    if (!parentId) {
      console.log("No parentId provided");
      return res.status(400).json({
        success: false,
        message: "Parent ID is required",
      });
    }

    const drivers = await Driver.find({ parentId }).select(
      "-password -verificationCode"
    );

    console.log(`Found ${drivers.length} drivers for parent ${parentId}`);

    return res.json({
      success: true,
      data: drivers,
    });
  } catch (error) {
    console.error("Error in getDrivers:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch drivers",
      error: error.message,
    });
  }
};

exports.addDriver = async (req, res) => {
  try {
    const { parentId, name, phone, email } = req.body;
    console.log("Adding new driver for parent:", parentId);

    const verificationCode = crypto
      .randomBytes(4)
      .toString("hex")
      .toUpperCase();

    const driver = new Driver({
      parentId,
      name,
      phone,
      email: email.toLowerCase(),
      verificationCode,
    });

    await driver.save();

    console.log("Successfully added driver:", driver._id);

    res.status(201).json({
      success: true,
      data: {
        driver,
        verificationCode,
      },
      message: "Driver added successfully",
    });
  } catch (error) {
    console.error("Error adding driver:", error);
    res.status(500).json({
      success: false,
      message: "Failed to add driver",
      error: error.message,
    });
  }
};

exports.removeDriver = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const driverId = req.params.driverId;
    console.log("Attempting to delete driver with ID:", driverId);

    // Find the driver first to verify existence
    const driver = await Driver.findById(driverId);
    if (!driver) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        message: "Driver not found",
      });
    }

    // Perform the actual deletion
    const result = await Driver.findByIdAndDelete(driverId);
    if (!result) {
      throw new Error("Failed to delete driver");
    }

    await session.commitTransaction();
    session.endSession();

    console.log("Driver successfully deleted:", driverId);
    res.json({
      success: true,
      message: "Driver has been permanently deleted from the database",
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    console.error("Error in driver deletion:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete driver",
      error: error.message,
    });
  }
};

exports.verifyDriver = async (req, res) => {
  try {
    const { verificationCode } = req.body;

    const driver = await Driver.findOne({ verificationCode });

    if (!driver) {
      return res.status(400).json({
        success: false,
        message: "Invalid verification code",
      });
    }

    const parentStudentLinks = await ParentStudentLink.find({
      parentId: driver.parentId,
      active: true,
    });

    res.json({
      success: true,
      data: {
        driver,
        studentLinks: parentStudentLinks,
      },
    });
  } catch (error) {
    console.error("Error verifying driver:", error);
    res.status(500).json({
      success: false,
      message: "Failed to verify driver",
    });
  }
};

exports.getDriverCode = async (req, res) => {
  try {
    const { driverId } = req.params;

    const driver = await Driver.findById(driverId);

    if (!driver) {
      return res.status(404).json({
        success: false,
        message: "Driver not found",
      });
    }

    if (driver.isRegistered) {
      return res.status(400).json({
        success: false,
        message: "Driver has already registered",
      });
    }

    res.json({
      success: true,
      verificationCode: driver.verificationCode,
    });
  } catch (error) {
    console.error("Error fetching driver code:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve driver code",
    });
  }
};