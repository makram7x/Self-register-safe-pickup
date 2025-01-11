// __tests__/uniqueCodeController.test.js
const request = require("supertest");
const express = require("express");
const Student = require("../models/studentSchema");
const uniqueCodeRoutes = require("../routes/uniqueCodeRoutes");

// Create Express app for testing
const app = express();
app.use(express.json());
app.use("/api/unique-codes", uniqueCodeRoutes);

// Mock the Student model
jest.mock("../models/studentSchema");

describe("Unique Code Controller", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("PUT /api/unique-codes", () => {
    it("should successfully generate and update unique codes for all students", async () => {
      // Mock existing students
      const mockStudents = [
        { _id: "1", studentName: "John Doe", uniqueCode: "OLD001" },
        { _id: "2", studentName: "Jane Smith", uniqueCode: "OLD002" },
      ];

      // Mock Student.find to return students
      Student.find.mockResolvedValue(mockStudents);

      // Mock Student.findOne to always return null (simulating unique codes)
      Student.findOne.mockResolvedValue(null);

      // Mock Student.findByIdAndUpdate to return updated students
      Student.findByIdAndUpdate.mockImplementation((id, update, options) => {
        const student = mockStudents.find((s) => s._id === id);
        return Promise.resolve({
          ...student,
          uniqueCode: update.uniqueCode,
        });
      });

      const response = await request(app)
        .put("/api/unique-codes")
        .expect("Content-Type", /json/)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        updatedStudents: expect.arrayContaining([
          expect.objectContaining({
            _id: expect.any(String),
            studentName: expect.any(String),
            uniqueCode: expect.stringMatching(/^[A-Z0-9]{6}$/),
          }),
        ]),
        message: expect.stringContaining("Successfully generated"),
      });

      expect(Student.find).toHaveBeenCalled();
      expect(Student.findByIdAndUpdate).toHaveBeenCalledTimes(2);
    });

    it("should handle when no students are found", async () => {
      // Mock Student.find to return empty array
      Student.find.mockResolvedValue([]);

      const response = await request(app)
        .put("/api/unique-codes")
        .expect("Content-Type", /json/)
        .expect(404);

      expect(response.body).toMatchObject({
        message: "No students found",
      });
    });

    it("should handle database errors during find operation", async () => {
      // Mock Student.find to throw error
      Student.find.mockRejectedValue(new Error("Database connection error"));

      const response = await request(app)
        .put("/api/unique-codes")
        .expect("Content-Type", /json/)
        .expect(500);

      expect(response.body).toMatchObject({
        success: false,
        error: "An error occurred while generating unique codes",
        details: expect.any(String),
      });
    });

    it("should handle errors during code generation for individual students", async () => {
      // Mock existing students
      const mockStudents = [
        { _id: "1", studentName: "John Doe", uniqueCode: "OLD001" },
        { _id: "2", studentName: "Jane Smith", uniqueCode: "OLD002" },
      ];

      // Mock Student.find to return students
      Student.find.mockResolvedValue(mockStudents);

      // Mock Student.findOne to always return a student (simulating non-unique codes)
      Student.findOne.mockResolvedValue({ uniqueCode: "EXISTS" });

      const response = await request(app)
        .put("/api/unique-codes")
        .expect("Content-Type", /json/)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        errors: expect.arrayContaining([
          expect.stringContaining("Error for student"),
        ]),
      });
    });

    it("should handle update failures for individual students", async () => {
      // Mock existing students
      const mockStudents = [
        { _id: "1", studentName: "John Doe", uniqueCode: "OLD001" },
      ];

      // Mock Student.find to return students
      Student.find.mockResolvedValue(mockStudents);

      // Mock Student.findOne to return null (unique code)
      Student.findOne.mockResolvedValue(null);

      // Mock findByIdAndUpdate to return null (update failure)
      Student.findByIdAndUpdate.mockResolvedValue(null);

      const response = await request(app)
        .put("/api/unique-codes")
        .expect("Content-Type", /json/)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        errors: expect.arrayContaining([
          expect.stringContaining("Failed to update student"),
        ]),
      });
    });

    it("should validate generated code format", async () => {
      // Mock a single student
      Student.find.mockResolvedValue([
        { _id: "1", studentName: "John Doe", uniqueCode: "OLD001" },
      ]);

      // Mock findOne to return null (unique code)
      Student.findOne.mockResolvedValue(null);

      // Mock successful update
      Student.findByIdAndUpdate.mockImplementation((id, update) => {
        return Promise.resolve({
          _id: id,
          studentName: "John Doe",
          uniqueCode: update.uniqueCode,
        });
      });

      const response = await request(app).put("/api/unique-codes").expect(200);

      // Verify the format of generated code
      const updatedStudent = response.body.updatedStudents[0];
      expect(updatedStudent.uniqueCode).toMatch(/^[A-Z0-9]{6}$/);
    });

    // it("should handle maximum attempts exceeded for unique code generation", async () => {
    //   // Mock a single student
    //   Student.find.mockResolvedValue([
    //     { _id: "1", studentName: "John Doe", uniqueCode: "OLD001" },
    //   ]);

    //   // Mock findOne to always return existing student (forcing max attempts)
    //   Student.findOne.mockResolvedValue({ uniqueCode: "EXISTS" });

    //   const response = await request(app).put("/api/unique-codes").expect(200);

    //   expect(response.body.errors).toContain(
    //     expect.stringContaining(
    //       "Unable to generate unique code after maximum attempts"
    //     )
    //   );
    // });
  });
});
