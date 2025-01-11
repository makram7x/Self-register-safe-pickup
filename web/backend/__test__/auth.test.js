const request = require("supertest");
const express = require("express");
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const User = require("../models/userSchema");
const authRoutes = require("../routes/authRoutes");

// Create Express app for testing
const app = express();
app.use(express.json());
app.use("/api/auth", authRoutes);

// Mock modules
jest.mock("bcryptjs");
jest.mock("../models/userSchema");

describe("Authentication Routes & Controller Tests", () => {
  let mockSession;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock mongoose session
    mockSession = {
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      abortTransaction: jest.fn(),
      endSession: jest.fn(),
    };
    mongoose.startSession = jest.fn().mockResolvedValue(mockSession);

    // Mock User model session method
    User.findOne = jest.fn().mockReturnValue({
      session: jest.fn().mockReturnThis(),
    });
  });

  describe("POST /api/auth/register", () => {
    beforeEach(() => {
      bcrypt.genSalt.mockResolvedValue("mockedSalt");
      bcrypt.hash.mockResolvedValue("hashedPassword");
    });

    it("should successfully register a new user", async () => {
      // Mock user creation
      const mockUser = {
        _id: "user123",
        name: "Test User",
        email: "test@example.com",
        profilePicture: null,
        save: jest.fn().mockResolvedValue(true),
      };

      User.findOne.mockReturnValue({
        session: jest.fn().mockResolvedValue(null),
      });

      User.mockImplementation(() => mockUser);

      const response = await request(app).post("/api/auth/register").send({
        name: "Test User",
        email: "test@example.com",
        password: "password123",
      });

      expect(response.status).toBe(201);
      expect(response.body).toEqual({
        success: true,
        data: {
          id: mockUser._id,
          name: mockUser.name,
          email: mockUser.email,
          profilePicture: null,
        },
        message: "Registration successful",
      });

      expect(mockSession.startTransaction).toHaveBeenCalled();
      expect(mockSession.commitTransaction).toHaveBeenCalled();
      expect(mockSession.endSession).toHaveBeenCalled();
    });

    it("should return 400 if required fields are missing", async () => {
      const response = await request(app).post("/api/auth/register").send({
        email: "test@example.com",
        // missing password and name
      });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        success: false,
        message: "Please provide all required fields",
      });
    });

    it("should return 400 if email already exists", async () => {
      User.findOne.mockReturnValue({
        session: jest.fn().mockResolvedValue({ email: "test@example.com" }),
      });

      const response = await request(app).post("/api/auth/register").send({
        name: "Test User",
        email: "test@example.com",
        password: "password123",
      });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        success: false,
        message: "Email already registered",
      });

      expect(mockSession.abortTransaction).toHaveBeenCalled();
    });
  });

  describe("POST /api/auth/login", () => {
    it("should successfully log in a user", async () => {
      const mockUser = {
        _id: "user123",
        name: "Test User",
        email: "test@example.com",
        password: "hashedPassword",
        authType: "email",
        profilePicture: null,
      };

      User.findOne.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(true);

      const response = await request(app).post("/api/auth/login").send({
        email: "test@example.com",
        password: "password123",
      });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: {
          id: mockUser._id,
          name: mockUser.name,
          email: mockUser.email,
          profilePicture: null,
        },
        message: "Login successful",
      });
    });

    it("should return 400 if required fields are missing", async () => {
      const response = await request(app).post("/api/auth/login").send({
        email: "test@example.com",
        // missing password
      });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        success: false,
        message: "Please provide email and password",
      });
    });

    it("should return 401 if user not found", async () => {
      User.findOne.mockResolvedValue(null);

      const response = await request(app).post("/api/auth/login").send({
        email: "nonexistent@example.com",
        password: "password123",
      });

      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        success: false,
        message: "Invalid credentials",
      });
    });

    it("should return 400 if user registered with Google", async () => {
      const mockUser = {
        email: "test@example.com",
        authType: "google",
      };

      User.findOne.mockResolvedValue(mockUser);

      const response = await request(app).post("/api/auth/login").send({
        email: "test@example.com",
        password: "password123",
      });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        success: false,
        message: "This account uses Google Sign-In. Please login with Google.",
      });
    });
  });

  describe("POST /api/auth/google", () => {
    it("should successfully sign in with Google for new user", async () => {
      const mockUser = {
        _id: "user123",
        googleId: "google123",
        name: "Test User",
        email: "test@example.com",
        profilePicture: "profile.jpg",
        authType: "google",
        save: jest.fn().mockResolvedValue(true),
      };

      User.findOne.mockReturnValue({
        session: jest.fn().mockResolvedValue(null),
      });

      User.mockImplementation(() => mockUser);

      const response = await request(app).post("/api/auth/google").send({
        googleId: "google123",
        name: "Test User",
        email: "test@example.com",
        profilePicture: "profile.jpg",
      });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: {
          id: mockUser._id,
          name: mockUser.name,
          email: mockUser.email,
          profilePicture: mockUser.profilePicture,
        },
        message: "Google sign-in successful",
      });

      expect(mockSession.startTransaction).toHaveBeenCalled();
      expect(mockSession.commitTransaction).toHaveBeenCalled();
      expect(mockSession.endSession).toHaveBeenCalled();
    });

    it("should update existing email user with Google info", async () => {
      const existingUser = {
        _id: "user123",
        name: "Test User",
        email: "test@example.com",
        authType: "email",
        save: jest.fn().mockResolvedValue(true),
      };

      User.findOne.mockReturnValue({
        session: jest.fn().mockResolvedValue(existingUser),
      });

      const response = await request(app).post("/api/auth/google").send({
        googleId: "google123",
        name: "Test User",
        email: "test@example.com",
        profilePicture: "profile.jpg",
      });

      expect(response.status).toBe(200);
      expect(existingUser.save).toHaveBeenCalled();
      expect(mockSession.commitTransaction).toHaveBeenCalled();
    });

    it("should handle Google sign-in errors properly", async () => {
      User.findOne.mockImplementation(() => {
        throw new Error("Database error");
      });

      const response = await request(app).post("/api/auth/google").send({
        googleId: "google123",
        name: "Test User",
        email: "test@example.com",
        profilePicture: "profile.jpg",
      });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Google sign-in failed");
      expect(mockSession.abortTransaction).toHaveBeenCalled();
    });
  });
});
