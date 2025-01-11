// __tests__/userController.test.js

const request = require("supertest");
const express = require("express");
const User = require("../models/userSchema");
const userRoutes = require("../routes/userRoutes");

// Create Express app for testing
const app = express();
app.use(express.json());
app.use("/api/users", userRoutes);

// Mock the User model
jest.mock("../models/userSchema");

describe("User Controller", () => {
  // Clear all mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("POST /api/users", () => {
    const mockUserData = {
      googleId: "123456789",
      name: "Test User",
      email: "test@example.com",
      profilePicture: "https://example.com/pic.jpg",
    };

    it("should create a new user when user does not exist", async () => {
      // Mock User.findOne to return null (user doesn't exist)
      User.findOne.mockResolvedValue(null);

      // Mock User constructor and save method
      const mockSave = jest.fn();
      User.mockImplementation(() => ({
        save: mockSave,
        ...mockUserData,
        _id: "mock-user-id",
        toJSON: () => ({ ...mockUserData, _id: "mock-user-id" }),
      }));
      mockSave.mockResolvedValue(true);

      const response = await request(app)
        .post("/api/users")
        .send(mockUserData)
        .expect("Content-Type", /json/)
        .expect(201);

      // Verify response
      expect(response.body).toMatchObject(mockUserData);
      expect(response.body._id).toBeDefined();

      // Verify that findOne was called with correct params
      expect(User.findOne).toHaveBeenCalledWith({
        googleId: mockUserData.googleId,
      });

      // Verify that save was called
      expect(mockSave).toHaveBeenCalled();
    });

    it("should return existing user when user already exists", async () => {
      // Mock existing user
      const existingUser = {
        _id: "existing-user-id",
        ...mockUserData,
        toJSON: () => ({ _id: "existing-user-id", ...mockUserData }),
      };

      // Mock User.findOne to return existing user
      User.findOne.mockResolvedValue(existingUser);

      const response = await request(app)
        .post("/api/users")
        .send(mockUserData)
        .expect("Content-Type", /json/)
        .expect(200);

      // Verify response
      expect(response.body).toMatchObject(mockUserData);
      expect(response.body._id).toBe("existing-user-id");

      // Verify that findOne was called with correct params
      expect(User.findOne).toHaveBeenCalledWith({
        googleId: mockUserData.googleId,
      });

      // Verify that save was not called (because user already exists)
      expect(User.prototype.save).not.toHaveBeenCalled();
    });

    it("should handle missing required fields", async () => {
      const invalidUserData = {
        // Missing required fields
        name: "Test User",
      };

      const response = await request(app)
        .post("/api/users")
        .send(invalidUserData)
        .expect("Content-Type", /json/)
        .expect(400); // Changed from 500 to 400

      expect(response.body).toHaveProperty("error", "Missing required fields");
    });

    it("should handle server errors", async () => {
      // Mock User.findOne to throw an error
      User.findOne.mockRejectedValue(new Error("Database error"));

      const response = await request(app)
        .post("/api/users")
        .send(mockUserData)
        .expect("Content-Type", /json/)
        .expect(500);

      expect(response.body).toHaveProperty("error", "Internal server error");
    });
  });
});
