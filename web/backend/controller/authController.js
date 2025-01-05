const User = require("../models/userSchema");
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");

const register = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { name, email, password } = req.body;

    // Validate required fields
    if (!email || !password || !name) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required fields",
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email }).session(session);
    if (existingUser) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: "Email already registered",
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user with explicit null values for Google-specific fields
    const user = new User({
      name,
      email,
      password: hashedPassword,
      authType: "email",
      googleId: null, // Explicitly set to null
      profilePicture: null, // Explicitly set to null
    });

    await user.save({ session });
    await session.commitTransaction();

    // Return user data (excluding sensitive information)
    res.status(201).json({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        profilePicture: user.profilePicture,
      },
      message: "Registration successful",
    });
  } catch (error) {
    await session.abortTransaction();
    console.error("Registration error:", error);

    // Improved error handling
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "This email is already registered",
      });
    }

    res.status(500).json({
      success: false,
      message: "Registration failed",
      error: error.message,
    });
  } finally {
    session.endSession();
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide email and password",
      });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Check if user was registered with Google
    if (user.authType === "google") {
      return res.status(400).json({
        success: false,
        message: "This account uses Google Sign-In. Please login with Google.",
      });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Return user data (matching Google sign-in response structure)
    res.status(200).json({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        profilePicture: user.profilePicture,
      },
      message: "Login successful",
    });
  } catch (error) {
    console.error("Login error:", {
      message: error.message,
      stack: error.stack,
    });

    res.status(500).json({
      success: false,
      message: "Login failed",
      error: error.message,
    });
  }
};

const googleSignIn = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { googleId, name, email, profilePicture } = req.body;

    // Find or create user
    let user = await User.findOne({ email }).session(session);

    if (user) {
      // Update existing user's Google info if needed
      if (user.authType !== "google") {
        // If user exists but used email registration, update to include Google
        user.googleId = googleId;
        user.authType = "google";
        user.profilePicture = profilePicture;
        await user.save({ session });
      }
    } else {
      // Create new user
      user = new User({
        googleId,
        name,
        email,
        profilePicture,
        authType: "google",
      });
      await user.save({ session });
    }

    await session.commitTransaction();

    res.status(200).json({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        profilePicture: user.profilePicture,
      },
      message: "Google sign-in successful",
    });
  } catch (error) {
    await session.abortTransaction();
    console.error("Google sign-in error:", {
      message: error.message,
      stack: error.stack,
    });

    res.status(500).json({
      success: false,
      message: "Google sign-in failed",
      error: error.message,
    });
  } finally {
    session.endSession();
  }
};

module.exports = {
  register,
  login,
  googleSignIn,
};
