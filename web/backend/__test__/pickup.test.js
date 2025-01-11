const request = require("supertest");
const express = require("express");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const Pickup = require("../models/pickupLogsSchema");
const Driver = require("../models/driverSchema");
const User = require("../models/userSchema");

// Mock the models
jest.mock("../models/pickupLogsSchema", () => {
  const mockPickupModel = jest.fn().mockImplementation((data) => ({
    ...data,
    save: jest.fn().mockResolvedValue(data),
    toObject: jest.fn().mockReturnValue(data),
    toJSON: jest.fn().mockReturnValue(data),
  }));

  mockPickupModel.find = jest.fn();
  mockPickupModel.findById = jest.fn();
  mockPickupModel.findByIdAndDelete = jest.fn();
  mockPickupModel.deleteMany = jest.fn();
  mockPickupModel.countDocuments = jest.fn();

  return mockPickupModel;
});

jest.mock("../models/driverSchema", () => {
  const mockDriverModel = jest.fn().mockImplementation((data) => ({
    ...data,
    save: jest.fn().mockResolvedValue(data),
    toObject: jest.fn().mockReturnValue(data),
    toJSON: jest.fn().mockReturnValue(data),
  }));

  mockDriverModel.findById = jest.fn();
  mockDriverModel.prototype.toJSON = jest.fn().mockImplementation(function () {
    const obj = this.toObject();
    delete obj.password;
    return obj;
  });

  return mockDriverModel;
});

jest.mock("../models/userSchema", () => {
  const mockUserModel = jest.fn().mockImplementation((data) => ({
    ...data,
    save: jest.fn().mockResolvedValue(data),
    toObject: jest.fn().mockReturnValue(data),
    toJSON: jest.fn().mockReturnValue(data),
  }));

  mockUserModel.findById = jest.fn();
  return mockUserModel;
});

jest.mock("mongoose", () => ({
  ...jest.requireActual("mongoose"),
  Types: {
    ObjectId: {
      isValid: jest.fn().mockReturnValue(true),
    },
  },
}));

// Setup express app and socket.io for testing
const app = express();
const server = require("http").createServer(app);
const io = new Server(server);
app.set("io", io);

// Mock authentication middleware
app.use((req, res, next) => {
  if (req.headers.authorization) {
    req.user = JSON.parse(req.headers.authorization);
  }
  next();
});

// Routes setup
const pickupRoutes = require("../routes/pickupRoutes");
app.use(express.json());
app.use("/api/pickups", pickupRoutes);

// Mock data
const mockPickup = {
  _id: "pickup123",
  pickupCode: "PICK123",
  studentIds: ["student1", "student2"],
  studentNames: "John Doe, Jane Doe",
  studentCodes: "S001, S002",
  parent: {
    id: "parent123",
    name: "Parent Name",
    email: "parent@test.com",
  },
  initiatedBy: {
    id: "parent123",
    name: "Parent Name",
    email: "parent@test.com",
    type: "parent",
  },
  status: "pending",
  statusHistory: [],
  save: jest.fn(),
  toObject: jest.fn().mockReturnValue({
    _id: "pickup123",
    pickupCode: "PICK123",
    status: "pending",
  }),
};

const mockDriver = {
  _id: "driver123",
  name: "Driver Name",
  email: "driver@test.com",
  phone: "1234567890",
  parentId: "parent123",
  verificationCode: "DRV123",
};

const mockParentUser = {
  _id: "parent123",
  name: "Parent Name",
  email: "parent@test.com",
};

describe("Pickup Controller", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mongoose.Types.ObjectId.isValid.mockImplementation(() => true);
  });

  describe("Create Pickup", () => {
    it("should create a new pickup successfully", async () => {
      const pickupData = {
        pickupCode: "PICK123",
        studentIds: ["student1", "student2"],
        studentInfo: [
          { name: "John Doe", code: "S001" },
          { name: "Jane Doe", code: "S002" },
        ],
        parent: {
          id: "parent123",
          name: "Parent Name",
          email: "parent@test.com",
        },
      };

      Pickup.mockImplementation(() => ({
        ...mockPickup,
        save: jest.fn().mockResolvedValueOnce(mockPickup),
      }));

      const response = await request(app).post("/api/pickups").send(pickupData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
    }, 10000);
  });

  describe("Get Parent Pickups", () => {
    it("should get pickups for a parent", async () => {
      const mockParentId = "parent123";

      Pickup.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockResolvedValue([mockPickup]),
        }),
      });

      const response = await request(app)
        .get("/api/pickups/parent")
        .set("Authorization", JSON.stringify({ _id: mockParentId }));

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    }, 10000);
  });

  describe("Delete Pickup", () => {
    it("should delete a pickup successfully", async () => {
      Pickup.findByIdAndDelete.mockResolvedValueOnce(mockPickup);

      const response = await request(app).delete("/api/pickups/pickup123");

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Pickup deleted successfully");
    }, 10000);
  });

  describe("Update Pickup Status", () => {
    it("should update pickup status successfully", async () => {
      const updatedPickup = {
        ...mockPickup,
        status: "completed",
        completedAt: new Date(),
        save: jest
          .fn()
          .mockResolvedValueOnce({ ...mockPickup, status: "completed" }),
      };

      Pickup.findById.mockResolvedValueOnce(updatedPickup);

      const response = await request(app)
        .put("/api/pickups/pickup123/status")
        .send({
          status: "completed",
          updatedBy: {
            id: "staff123",
            name: "Staff Name",
            type: "staff",
          },
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Pickup status updated to completed");
    }, 10000);
  });

  describe("Get All Pickup Logs", () => {
    it("should get all pickup logs successfully", async () => {
      Pickup.find.mockReturnValue({
        select: jest.fn().mockReturnValue({
          sort: jest.fn().mockResolvedValue([mockPickup]),
        }),
      });

      const response = await request(app).get("/api/pickups/logs");

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    }, 10000);
  });

  describe("Delete All Pickup Logs", () => {
    it("should delete all pickup logs successfully", async () => {
      Pickup.deleteMany.mockResolvedValueOnce({ deletedCount: 5 });

      const response = await request(app).delete("/api/pickups/delete-all");

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.deletedCount).toBe(5);
    }, 10000);
  });

  describe("Pickup Counts", () => {
    beforeEach(() => {
      Pickup.countDocuments.mockReset();
    });

    it("should get active pickups count", async () => {
      Pickup.countDocuments.mockResolvedValueOnce(3);

      const response = await request(app).get("/api/pickups/active/count");

      expect(response.status).toBe(200);
      expect(response.body.count).toBe(3);
    });

    it("should get delayed pickups count", async () => {
      Pickup.countDocuments.mockResolvedValueOnce(2);

      const response = await request(app).get("/api/pickups/delayed/count");

      expect(response.status).toBe(200);
      expect(response.body.count).toBe(2);
    });

    it("should get completed pickups count", async () => {
      Pickup.countDocuments.mockResolvedValueOnce(5);

      const response = await request(app).get("/api/pickups/completed/count");

      expect(response.status).toBe(200);
      expect(response.body.count).toBe(5);
    });

    it("should get cancelled pickups count", async () => {
      Pickup.countDocuments.mockResolvedValueOnce(1);

      const response = await request(app).get("/api/pickups/cancelled/count");

      expect(response.status).toBe(200);
      expect(response.body.count).toBe(1);
    });
  });
});
