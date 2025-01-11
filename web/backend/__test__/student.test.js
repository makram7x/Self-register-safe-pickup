// __tests__/studentController.test.js
const request = require("supertest");
const express = require("express");
const mongoose = require("mongoose");
const Student = require("../models/studentSchema");
const studentRoutes = require("../routes/studentRoutes");

// Create Express app for testing
const app = express();
app.use(express.json());
app.use("/api/students", studentRoutes);

// Mock the entire Student model
jest.mock("../models/studentSchema", () => {
  return {
    find: jest.fn(),
    findOne: jest.fn(),
    findByIdAndDelete: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    countDocuments: jest.fn(),
    aggregate: jest.fn(),
    deleteMany: jest.fn(),
    prototype: {
      save: jest.fn(),
    },
  };
});

// Mock mongoose ObjectId.isValid
jest.mock("mongoose", () => ({
  Types: {
    ObjectId: {
      isValid: jest.fn(),
    },
  },
}));

describe("Student Controller", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockStudent = {
    _id: "mockid123",
    studentName: "John Doe",
    parentName: "Jane Doe",
    grade: 5,
    parentPhone: "123-456-7890",
    parentEmail: "jane@example.com",
    uniqueCode: "ABC123",
  };

  describe("POST /", () => {
    // it("should create a new student successfully", async () => {
    //   // Mock the save functionality
    //   Student.prototype.save.mockResolvedValueOnce(mockStudent);

    //   const response = await request(app)
    //     .post("/api/students")
    //     .send(mockStudent)
    //     .expect("Content-Type", /json/)
    //     .expect(201);

    //   expect(response.body).toMatchObject({
    //     message: "Student created successfully",
    //   });
    //   expect(Student.prototype.save).toHaveBeenCalled();
    // });

    it("should handle server error during student creation", async () => {
      Student.prototype.save.mockRejectedValueOnce(new Error("Database error"));

      const response = await request(app)
        .post("/api/students")
        .send(mockStudent)
        .expect("Content-Type", /json/)
        .expect(500);

      expect(response.body).toMatchObject({
        message: "Internal server error",
      });
    });
  });

  describe("GET /", () => {
    it("should get all students successfully", async () => {
      Student.find.mockResolvedValueOnce([mockStudent]);

      const response = await request(app)
        .get("/api/students")
        .expect("Content-Type", /json/)
        .expect(200);

      expect(response.body).toEqual(
        expect.arrayContaining([expect.objectContaining(mockStudent)])
      );
    });

    it("should handle server error when getting all students", async () => {
      Student.find.mockRejectedValueOnce(new Error("Database error"));

      const response = await request(app)
        .get("/api/students")
        .expect("Content-Type", /json/)
        .expect(500);

      expect(response.body).toMatchObject({
        message: "Internal server error",
      });
    });
  });

  describe("DELETE /:id", () => {
    it("should delete student successfully", async () => {
      Student.findByIdAndDelete.mockResolvedValueOnce(mockStudent);

      const response = await request(app)
        .delete(`/api/students/${mockStudent._id}`)
        .expect("Content-Type", /json/)
        .expect(200);

      expect(response.body).toMatchObject({
        message: "Student deleted successfully",
      });
    });

    it("should handle server error during deletion", async () => {
      Student.findByIdAndDelete.mockRejectedValueOnce(
        new Error("Database error")
      );

      const response = await request(app)
        .delete(`/api/students/${mockStudent._id}`)
        .expect("Content-Type", /json/)
        .expect(500);

      expect(response.body).toMatchObject({
        message: "Internal server error",
      });
    });
  });

  describe("PUT /:id", () => {
    it("should update student successfully", async () => {
      mongoose.Types.ObjectId.isValid.mockReturnValueOnce(true);
      Student.findByIdAndUpdate.mockResolvedValueOnce(mockStudent);

      const response = await request(app)
        .put(`/api/students/${mockStudent._id}`)
        .send(mockStudent)
        .expect("Content-Type", /json/)
        .expect(200);

      expect(response.body).toMatchObject(mockStudent);
    });

    it("should handle invalid ObjectId", async () => {
      mongoose.Types.ObjectId.isValid.mockReturnValueOnce(false);

      const response = await request(app)
        .put("/api/students/invalid-id")
        .send(mockStudent)
        .expect("Content-Type", /json/)
        .expect(400);

      expect(response.body).toMatchObject({
        message: "Invalid student id",
      });
    });

    it("should handle student not found", async () => {
      mongoose.Types.ObjectId.isValid.mockReturnValueOnce(true);
      Student.findByIdAndUpdate.mockResolvedValueOnce(null);

      const response = await request(app)
        .put(`/api/students/${mockStudent._id}`)
        .send(mockStudent)
        .expect("Content-Type", /json/)
        .expect(404);

      expect(response.body).toMatchObject({
        message: "Student not found",
      });
    });
  });

  describe("GET /count", () => {
    it("should get student count successfully", async () => {
      Student.countDocuments.mockResolvedValueOnce(5);

      const response = await request(app)
        .get("/api/students/count")
        .expect("Content-Type", /json/)
        .expect(200);

      expect(response.body).toMatchObject({
        count: 5,
      });
    });

    it("should handle error when getting count", async () => {
      Student.countDocuments.mockRejectedValueOnce(new Error("Database error"));

      const response = await request(app)
        .get("/api/students/count")
        .expect("Content-Type", /json/)
        .expect(500);

      expect(response.body).toMatchObject({
        message: "Internal server error",
      });
    });
  });

  describe("GET /parent-count", () => {
    it("should get unique parents count successfully", async () => {
      Student.aggregate.mockResolvedValueOnce([{ _id: null, count: 3 }]);

      const response = await request(app)
        .get("/api/students/parent-count")
        .expect("Content-Type", /json/)
        .expect(200);

      expect(response.body).toMatchObject({
        count: 3,
      });
    });

    it("should handle empty result for parent count", async () => {
      Student.aggregate.mockResolvedValueOnce([]);

      const response = await request(app)
        .get("/api/students/parent-count")
        .expect("Content-Type", /json/)
        .expect(200);

      expect(response.body).toMatchObject({
        count: 0,
      });
    });
  });

  describe("GET /unique/:uniqueCode", () => {
    it("should get student by unique code successfully", async () => {
      Student.findOne.mockResolvedValueOnce(mockStudent);

      const response = await request(app)
        .get(`/api/students/unique/${mockStudent.uniqueCode}`)
        .expect("Content-Type", /json/)
        .expect(200);

      expect(response.body).toMatchObject({
        studentName: mockStudent.studentName,
        uniqueCode: mockStudent.uniqueCode,
      });
    });

    it("should handle student not found by unique code", async () => {
      Student.findOne.mockResolvedValueOnce(null);

      const response = await request(app)
        .get("/api/students/unique/NOTFOUND")
        .expect("Content-Type", /json/)
        .expect(404);

      expect(response.body).toMatchObject({
        message: "Student not found",
      });
    });
  });

  describe("DELETE /delete-all", () => {
    it("should delete all students successfully", async () => {
      Student.deleteMany.mockResolvedValueOnce({ deletedCount: 5 });

      const response = await request(app)
        .delete("/api/students/delete-all")
        .expect("Content-Type", /json/)
        .expect(200);

      expect(response.body).toMatchObject({
        message: "All students deleted successfully",
        deletedCount: 5,
      });
    });

    it("should handle error when deleting all students", async () => {
      Student.deleteMany.mockRejectedValueOnce(new Error("Database error"));

      const response = await request(app)
        .delete("/api/students/delete-all")
        .expect("Content-Type", /json/)
        .expect(500);

      expect(response.body).toMatchObject({
        message: "Internal server error",
      });
    });
  });
});
