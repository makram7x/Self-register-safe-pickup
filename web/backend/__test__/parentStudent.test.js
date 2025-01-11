const request = require("supertest");
const express = require("express");
const mongoose = require("mongoose");
const ParentStudentLink = require("../models/parentStudentLink");
const Student = require("../models/studentSchema");

// Mock the models
jest.mock("../models/parentStudentLink", () => {
  const mockModel = jest.fn().mockImplementation((data) => ({
    ...data,
    save: jest.fn().mockResolvedValue(data),
    toObject: jest.fn().mockReturnValue(data),
  }));

  // Add static methods
  mockModel.find = jest.fn();
  mockModel.findOne = jest.fn();
  mockModel.findById = jest.fn();
  mockModel.deleteOne = jest.fn();
  mockModel.deleteMany = jest.fn();
  mockModel.countDocuments = jest.fn();
  mockModel.collection = {
    stats: jest.fn().mockResolvedValue({}),
    indexes: jest.fn().mockResolvedValue([]),
  };

  return mockModel;
});

jest.mock("../models/studentSchema", () => {
  const mockModel = jest.fn().mockImplementation((data) => ({
    ...data,
    save: jest.fn().mockResolvedValue(data),
    toObject: jest.fn().mockReturnValue(data),
  }));

  // Add static methods
  mockModel.find = jest.fn();
  mockModel.findOne = jest.fn();
  mockModel.findById = jest.fn();

  return mockModel;
});

jest.mock("mongoose", () => ({
  ...jest.requireActual("mongoose"),
  startSession: jest.fn(),
  Types: {
    ObjectId: {
      isValid: jest.fn().mockReturnValue(true),
    },
  },
}));

// Setup express app
const app = express();
app.use(express.json());
const parentStudentRoutes = require("../routes/parentStudentRoutes");
app.use("/api/parent-student", parentStudentRoutes);

// Mock data
const mockStudent = {
  _id: "student123",
  uniqueCode: "STU123",
  studentName: "Test Student",
  grade: "5th",
  toObject: () => ({
    _id: "student123",
    uniqueCode: "STU123",
    studentName: "Test Student",
    grade: "5th",
  }),
};

const mockLink = {
  _id: "link123",
  parentId: "parent123",
  studentInfo: {
    uniqueCode: "STU123",
    name: "Test Student",
  },
  toString: () => "link123",
};

// Mock mongoose session
const mockSession = {
  startTransaction: jest.fn(),
  commitTransaction: jest.fn(),
  abortTransaction: jest.fn(),
  endSession: jest.fn(),
};

describe("Parent Student Controller", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mongoose.startSession.mockResolvedValue(mockSession);
  });

  describe("Get Parent Links", () => {
    it("should get links for a parent successfully", async () => {
      const mockLinks = [
        {
          _id: { toString: () => "link123" },
          studentInfo: {
            uniqueCode: "STU123",
            name: "Test Student",
          },
        },
      ];

      ParentStudentLink.find.mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockLinks),
      });
      ParentStudentLink.countDocuments.mockResolvedValue(1);

      const response = await request(app).get("/api/parent-student/parent123");

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data[0]).toHaveProperty("code", "STU123");
    });

    it("should handle no links found", async () => {
      ParentStudentLink.find.mockReturnValue({
        lean: jest.fn().mockResolvedValue([]),
      });
      ParentStudentLink.countDocuments.mockResolvedValue(0);

      const response = await request(app).get(
        "/api/parent-student/nonexistent"
      );

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(0);
    });
  });

  describe("Create Link", () => {
    // it("should create a new parent-student link successfully", async () => {
    //   // Mock student find with session
    //   const mockStudentWithSession = {
    //     ...mockStudent,
    //     uniqueCode: "STU123",
    //     studentName: "Test Student",
    //   };

    //   Student.findOne.mockReturnValue({
    //     session: jest.fn().mockReturnValue(mockStudentWithSession),
    //   });

    //   // Mock ParentStudentLink constructor and save
    //   const mockSavedLink = {
    //     _id: { toString: () => "link123" },
    //     parentId: "parent123",
    //     studentInfo: {
    //       uniqueCode: "STU123",
    //       name: "Test Student",
    //     },
    //   };

    //   ParentStudentLink.prototype.save = jest
    //     .fn()
    //     .mockImplementation(function () {
    //       return Promise.resolve(mockSavedLink);
    //     });

    //   const response = await request(app).post("/api/parent-student").send({
    //     parentId: "parent123",
    //     uniqueCode: "STU123",
    //   });

    //   expect(response.status).toBe(201);
    //   expect(response.body.success).toBe(true);
    //   expect(response.body.data).toHaveProperty("code", "STU123");
    // });

    it("should handle student not found", async () => {
      Student.findOne.mockReturnValue({
        session: jest.fn().mockReturnValue(null),
      });

      const response = await request(app).post("/api/parent-student").send({
        parentId: "parent123",
        uniqueCode: "NONEXISTENT",
      });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe("Delete Link", () => {
    it("should delete a link successfully", async () => {
      ParentStudentLink.deleteOne.mockResolvedValue({ deletedCount: 1 });
      ParentStudentLink.findById.mockResolvedValue(null);

      const response = await request(app).delete("/api/parent-student/link123");

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Link permanently deleted");
    });

    it("should handle link not found", async () => {
      ParentStudentLink.deleteOne.mockResolvedValue({ deletedCount: 0 });

      const response = await request(app).delete(
        "/api/parent-student/nonexistent"
      );

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe("Verify Link", () => {
    it("should verify a student code successfully", async () => {
      Student.findOne.mockResolvedValue(mockStudent);

      const response = await request(app).get(
        "/api/parent-student/verify/STU123"
      );

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty("studentName", "Test Student");
    });

    it("should handle invalid student code", async () => {
      Student.findOne.mockResolvedValue(null);

      const response = await request(app).get(
        "/api/parent-student/verify/INVALID"
      );

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe("Delete All Links", () => {
    it("should delete all links successfully", async () => {
      ParentStudentLink.deleteMany.mockResolvedValue({ deletedCount: 5 });

      const response = await request(app).delete(
        "/api/parent-student/delete-all"
      );

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.deletedCount).toBe(5);
    });
  });

  describe("Get Links By Student Code", () => {
    it("should get links by student code successfully", async () => {
      const mockLinks = [mockLink];
      ParentStudentLink.find.mockResolvedValue(mockLinks);

      const response = await request(app).get(
        "/api/parent-student/by-code/STU123"
      );

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.links).toHaveLength(1);
      expect(response.body.count).toBe(1);
    });

    it("should handle no links found for student code", async () => {
      ParentStudentLink.find.mockResolvedValue([]);

      const response = await request(app).get(
        "/api/parent-student/by-code/NONEXISTENT"
      );

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.links).toHaveLength(0);
      expect(response.body.count).toBe(0);
    });
  });
});
