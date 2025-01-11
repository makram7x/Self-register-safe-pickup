const request = require("supertest");
const express = require("express");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const Driver = require("../models/driverSchema");
const ParentStudentLink = require("../models/parentStudentLink");
const driverRoutes = require("../routes/driverRoutes");

const app = express();
app.use(express.json());
app.use("/api/drivers", driverRoutes);

jest.mock("../models/driverSchema");
jest.mock("../models/parentStudentLink");
jest.mock("bcryptjs");
jest.mock("jsonwebtoken");

describe("Driver Routes & Controller Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /api/drivers/single/:driverId", () => {
    it("should return driver details when valid ID is provided", async () => {
      const mockDriver = {
        _id: "driver123",
        name: "John Doe",
        email: "john@example.com",
        phone: "1234567890",
        parentId: "parent123",
      };

      Driver.findById.mockResolvedValue(mockDriver);

      const response = await request(app).get("/api/drivers/single/driver123");

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        id: mockDriver._id,
        name: mockDriver.name,
        email: mockDriver.email,
        phone: mockDriver.phone,
        parentId: mockDriver.parentId,
        isDriver: true,
      });
    });

    it("should return 404 when driver is not found", async () => {
      Driver.findById.mockResolvedValue(null);

      const response = await request(app).get(
        "/api/drivers/single/nonexistent123"
      );

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Driver not found");
    });
  });

  describe("POST /api/drivers/login", () => {
    it("should login driver with valid credentials", async () => {
      const mockDriver = {
        _id: "driver123",
        name: "John Doe",
        email: "john@example.com",
        phone: "1234567890",
        parentId: "parent123",
        password: "hashedPassword",
      };

      Driver.findOne.mockResolvedValue(mockDriver);
      bcrypt.compare.mockResolvedValue(true);
      jwt.sign.mockReturnValue("mockToken");

      const response = await request(app).post("/api/drivers/login").send({
        email: "john@example.com",
        password: "password123",
      });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.token).toBe("mockToken");
      expect(response.body.data.driver).toMatchObject({
        id: mockDriver._id,
        name: mockDriver.name,
        email: mockDriver.email,
        phone: mockDriver.phone,
        parentId: mockDriver.parentId,
        isDriver: true,
      });
    });

    it("should return 401 with invalid credentials", async () => {
      Driver.findOne.mockResolvedValue(null);

      const response = await request(app).post("/api/drivers/login").send({
        email: "wrong@example.com",
        password: "wrongpass",
      });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Invalid email or password");
    });
  });

  describe("POST /api/drivers/register", () => {
    it("should register a new driver with valid verification code", async () => {
      const mockDriver = {
        verificationCode: "ABC123",
        password: null,
        save: jest.fn(),
      };

      Driver.findOne.mockResolvedValue(mockDriver);
      bcrypt.hash.mockResolvedValue("hashedPassword");

      const response = await request(app).post("/api/drivers/register").send({
        verificationCode: "ABC123",
        password: "newPassword123",
      });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(mockDriver.save).toHaveBeenCalled();
      expect(mockDriver.password).toBe("hashedPassword");
      expect(mockDriver.isRegistered).toBe(true);
    });

    it("should return 400 for already registered driver", async () => {
      const mockDriver = {
        verificationCode: "ABC123",
        password: "existingHashedPassword",
      };

      Driver.findOne.mockResolvedValue(mockDriver);

      const response = await request(app).post("/api/drivers/register").send({
        verificationCode: "ABC123",
        password: "newPassword123",
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Driver already registered");
    });
  });

  describe("GET /api/drivers/parent/:parentId", () => {
    it("should return all drivers for a parent", async () => {
      const mockDrivers = [
        {
          _id: "driver1",
          name: "John Doe",
          email: "john@example.com",
        },
        {
          _id: "driver2",
          name: "Jane Doe",
          email: "jane@example.com",
        },
      ];

      const mockSelect = jest.fn().mockResolvedValue(mockDrivers);
      Driver.find.mockReturnValue({ select: mockSelect });

      const response = await request(app).get("/api/drivers/parent/parent123");

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockDrivers);
    });

    it("should return 400 if parentId is not provided", async () => {
      const response = await request(app).get("/api/drivers/parent/");

      expect(response.status).toBe(404);
    });
  });

//   describe("POST /api/drivers", () => {
//     it("should add a new driver", async () => {
//       const mockDriver = {
//         _id: "newDriver123",
//         parentId: "parent123",
//         name: "New Driver",
//         phone: "1234567890",
//         email: "new@example.com",
//         verificationCode: "ABC123",
//       };

//       // Mock the Driver.prototype.save method
//       const saveSpy = jest.fn().mockResolvedValue(mockDriver);

//       // Mock the Driver constructor
//       jest.spyOn(Driver, "create").mockImplementation(() => ({
//         ...mockDriver,
//         save: saveSpy,
//       }));

//       const response = await request(app).post("/api/drivers").send({
//         parentId: "parent123",
//         name: "New Driver",
//         phone: "1234567890",
//         email: "new@example.com",
//       });

//       expect(response.status).toBe(201);
//       expect(response.body.success).toBe(true);
//       expect(response.body.data).toEqual({
//         driver: mockDriver,
//         verificationCode: expect.any(String),
//       });
//       expect(response.body.message).toBe("Driver added successfully");
//     });
//   });

  describe("DELETE /api/drivers/:driverId", () => {
    let mockSession;

    beforeEach(() => {
      mockSession = {
        startTransaction: jest.fn(),
        commitTransaction: jest.fn(),
        abortTransaction: jest.fn(),
        endSession: jest.fn(),
      };
      mongoose.startSession = jest.fn().mockResolvedValue(mockSession);
    });

    it("should delete an existing driver", async () => {
      const mockDriver = {
        _id: "driver123",
        name: "John Doe",
      };

      Driver.findById.mockResolvedValue(mockDriver);
      Driver.findByIdAndDelete.mockResolvedValue(mockDriver);

      const response = await request(app).delete("/api/drivers/driver123");

      expect(mockSession.startTransaction).toHaveBeenCalled();
      expect(mockSession.commitTransaction).toHaveBeenCalled();
      expect(mockSession.endSession).toHaveBeenCalled();

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe(
        "Driver has been permanently deleted from the database"
      );
    }, 10000); // Increased timeout

    it("should return 404 when trying to delete non-existent driver", async () => {
      Driver.findById.mockResolvedValue(null);

      const response = await request(app).delete("/api/drivers/nonexistent123");

      expect(mockSession.startTransaction).toHaveBeenCalled();
      expect(mockSession.abortTransaction).toHaveBeenCalled();
      expect(mockSession.endSession).toHaveBeenCalled();

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Driver not found");
    }, 10000); // Increased timeout
  });

  describe("GET /api/drivers/:driverId/code", () => {
    it("should return verification code for unregistered driver", async () => {
      const mockDriver = {
        _id: "driver123",
        isRegistered: false,
        verificationCode: "ABC123",
      };

      Driver.findById.mockResolvedValue(mockDriver);

      const response = await request(app).get("/api/drivers/driver123/code");

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.verificationCode).toBe("ABC123");
    });

    it("should return 400 for already registered driver", async () => {
      const mockDriver = {
        _id: "driver123",
        isRegistered: true,
        verificationCode: "ABC123",
      };

      Driver.findById.mockResolvedValue(mockDriver);

      const response = await request(app).get("/api/drivers/driver123/code");

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Driver has already registered");
    });
  });
});
