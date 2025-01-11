// __tests__/uploadController.test.js
const request = require("supertest");
const express = require("express");
const Student = require("../models/studentSchema");
const uploadRoutes = require("../routes/uploadRoutes");

// Create Express app for testing
const app = express();
app.use(express.json());
app.use("/api/upload", uploadRoutes);

// Mock the Student model
jest.mock("../models/studentSchema");

describe("Upload Controller", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const validHeaders = [
    "Student Name",
    "Parent Name",
    "Grade",
    "Parent Phone",
    "Parent Email",
  ];

  const validStudentData = [
    "John Doe",
    "Jane Doe",
    "3",
    "123-456-7890",
    "jane@example.com",
  ];

  describe("POST /api/upload", () => {
    it("should successfully process valid CSV data", async () => {
      // Mock Student.create to return a successful response
      Student.create.mockImplementation((data) => ({
        ...data,
        uniqueCode: "ABC123",
        _id: "mock-id",
      }));

      const csvData = [validHeaders, validStudentData];

      const response = await request(app)
        .post("/api/upload")
        .send(csvData)
        .expect("Content-Type", /json/)
        .expect(200);

      expect(response.body).toMatchObject({
        message: "File processing completed",
        successCount: 1,
        errorCount: 0,
        successfulStudents: expect.arrayContaining([
          expect.objectContaining({
            studentName: "John Doe",
            uniqueCode: expect.any(String),
          }),
        ]),
      });

      expect(Student.create).toHaveBeenCalledWith(
        expect.objectContaining({
          studentName: "John Doe",
          parentName: "Jane Doe",
          grade: 3,
          parentPhone: "123-456-7890",
          parentEmail: "jane@example.com",
          uniqueCode: expect.any(String),
        })
      );
    });

    it("should reject invalid file structure", async () => {
      const invalidData = [validHeaders]; // No data rows

      const response = await request(app)
        .post("/api/upload")
        .send(invalidData)
        .expect("Content-Type", /json/)
        .expect(400);

      expect(response.body).toMatchObject({
        error: "Invalid file structure",
        errors: expect.arrayContaining([
          expect.stringContaining(
            "File must contain headers and at least one data row"
          ),
        ]),
      });
    });

    it("should reject invalid headers", async () => {
      const invalidHeaders = [
        [
          "Wrong Header",
          "Parent Name",
          "Grade",
          "Parent Phone",
          "Parent Email",
        ],
        validStudentData,
      ];

      const response = await request(app)
        .post("/api/upload")
        .send(invalidHeaders)
        .expect("Content-Type", /json/)
        .expect(400);

      expect(response.body).toMatchObject({
        error: "Invalid headers",
        errors: expect.arrayContaining([
          expect.stringContaining("Missing or incorrect headers"),
        ]),
      });
    });

    it("should handle validation errors in student data", async () => {
      const invalidStudentData = [
        validHeaders,
        ["", "", "7", "invalid-phone", "invalid-email"], // All fields invalid
      ];

      const response = await request(app)
        .post("/api/upload")
        .send(invalidStudentData)
        .expect("Content-Type", /json/)
        .expect(200); // Note: Returns 200 even with validation errors

      expect(response.body).toMatchObject({
        successCount: 0,
        errorCount: 1,
        errors: expect.arrayContaining([
          expect.objectContaining({
            error: expect.stringContaining("Student Name is required"),
          }),
        ]),
      });
    });

    it("should handle database errors", async () => {
      Student.create.mockRejectedValue(new Error("Database error"));

      const csvData = [validHeaders, validStudentData];

      const response = await request(app)
        .post("/api/upload")
        .send(csvData)
        .expect("Content-Type", /json/)
        .expect(200); // Note: Returns 200 even with database errors

      expect(response.body).toMatchObject({
        successCount: 0,
        errorCount: 1,
        errors: expect.arrayContaining([
          expect.objectContaining({
            studentName: "John Doe",
            error: expect.stringContaining("Database error"),
          }),
        ]),
      });
    });

    it("should validate phone number format", async () => {
      const dataWithInvalidPhone = [
        validHeaders,
        ["John Doe", "Jane Doe", "3", "invalid-phone", "jane@example.com"],
      ];

      const response = await request(app)
        .post("/api/upload")
        .send(dataWithInvalidPhone)
        .expect("Content-Type", /json/)
        .expect(200);

      expect(response.body.errors[0].error).toContain(
        "Invalid phone number format"
      );
    });

    it("should validate email format", async () => {
      const dataWithInvalidEmail = [
        validHeaders,
        ["John Doe", "Jane Doe", "3", "123-456-7890", "invalid-email"],
      ];

      const response = await request(app)
        .post("/api/upload")
        .send(dataWithInvalidEmail)
        .expect("Content-Type", /json/)
        .expect(200);

      expect(response.body.errors[0].error).toContain("Invalid email format");
    });

    it("should validate grade range", async () => {
      const dataWithInvalidGrade = [
        validHeaders,
        [
          "John Doe",
          "Jane Doe",
          "7", // Invalid grade
          "123-456-7890",
          "jane@example.com",
        ],
      ];

      const response = await request(app)
        .post("/api/upload")
        .send(dataWithInvalidGrade)
        .expect("Content-Type", /json/)
        .expect(200);

      expect(response.body.errors[0].error).toContain(
        "Grade must be a number between 1 and 6"
      );
    });
  });
});
