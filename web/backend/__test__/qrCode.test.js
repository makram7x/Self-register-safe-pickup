const request = require("supertest");
const express = require("express");
const { Server } = require("socket.io");
const QRCode = require("../models/QRcode");
const Driver = require("../models/driverSchema");

// Mock the models
jest.mock("../models/QRcode");
jest.mock("../models/driverSchema");

// Setup express app and socket.io for testing
const app = express();
const server = require("http").createServer(app);
const io = new Server(server);
const qrCodeRoutes = require("../routes/qrCodeRoutes")(io);
app.use(express.json());
app.use("/api/qrcodes", qrCodeRoutes);

// Mock data
const mockQRCode = {
  _id: "mockid123",
  schoolId: "school123",
  code: "testcode123",
  createdAt: new Date(),
  expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
  isActive: true,
  scans: [],
  save: jest.fn(),
  toObject: jest.fn().mockReturnValue({
    schoolId: "school123",
    code: "testcode123",
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    isActive: true,
    scans: [],
  }),
};

describe("QR Code Controller", () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe("Generate QR Code", () => {
    it("should generate a new QR code", async () => {
      // Mock QRCode constructor and save method
      QRCode.mockImplementation(() => ({
        ...mockQRCode,
        save: jest.fn().mockResolvedValueOnce(),
      }));

      const response = await request(app)
        .post("/api/qrcodes/generate")
        .send({
          schoolId: "school123",
          timestamp: new Date(),
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.qrCode).toBeDefined();
    }, 10000); // Increased timeout
  });

  describe("Verify QR Code", () => {
    it("should verify parent QR code scan", async () => {
      // Mock findOne to return a valid QR code
      QRCode.findOne.mockResolvedValueOnce({
        ...mockQRCode,
        save: jest.fn().mockResolvedValueOnce(),
      });

      const response = await request(app).post("/api/qrcodes/verify").send({
        code: "testcode123",
        parentId: "parent123",
        studentId: "student123",
      });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.schoolId).toBe("school123");
    }, 10000);

    it("should handle invalid QR code", async () => {
      // Mock findOne to return null (invalid code)
      QRCode.findOne.mockResolvedValueOnce(null);

      const response = await request(app).post("/api/qrcodes/verify").send({
        code: "invalidcode",
        parentId: "parent123",
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    }, 10000);
  });

  describe("Active QR Codes", () => {
    it("should get active QR codes", async () => {
      // Mock find().lean() chain
      const mockFind = jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue([
          {
            ...mockQRCode,
            _id: { toString: () => "mockid123" },
          },
        ]),
      });
      QRCode.find = mockFind;

      const response = await request(app).get("/api/qrcodes/active");

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.activeQRCodes)).toBe(true);
    }, 10000);
  });

  describe("Deactivate QR Code", () => {
    it("should deactivate a QR code", async () => {
      // Mock findOne to properly match the code parameter
      QRCode.findOne = jest.fn().mockImplementation((query) => {
        if (query.code === "testcode123") {
          return Promise.resolve({
            ...mockQRCode,
            code: "testcode123",
            isActive: true,
            save: jest.fn().mockResolvedValueOnce(),
            toObject: jest.fn().mockReturnValue({
              ...mockQRCode,
              code: "testcode123",
            }),
          });
        }
        return Promise.resolve(null);
      });

      const response = await request(app).patch(
        "/api/qrcodes/testcode123/deactivate"
      );

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("QR code deactivated successfully");
    }, 10000);
  });

  describe("Delete QR Code", () => {
    it("should delete a QR code", async () => {
      // Mock findOneAndDelete
      QRCode.findOneAndDelete.mockResolvedValueOnce(mockQRCode);

      const response = await request(app).delete("/api/qrcodes/testcode123");

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("QR code deleted successfully");
    }, 10000);
  });
});
