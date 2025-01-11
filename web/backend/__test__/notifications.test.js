// notificationsRoutes.test.js
const request = require("supertest");
const express = require("express");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server-core");
const Notifications = require("../models/notificationsSchema");
const createNotificationRoutes = require("../routes/notificationsRoutes");

describe("Notification Routes", () => {
  let app;
  let mongoServer;
  let io;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();

    await mongoose.connect(mongoUri);

    io = {
      emit: jest.fn(),
    };

    app = express();
    app.use(express.json());
    app.use("/notifications", createNotificationRoutes(io));
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    await Notifications.deleteMany({});
    io.emit.mockClear();
  });

  describe("GET /", () => {
    it("should return empty array when no notifications exist", async () => {
      const response = await request(app).get("/notifications");

      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });

    it("should return all notifications sorted by createdAt in descending order", async () => {
      const olderDate = new Date("2024-01-01");
      const newerDate = new Date("2024-01-02");

      const notifications = [
        {
          title: "Test 1",
          description: "Description 1",
          icon: "icon1",
          createdAt: olderDate,
        },
        {
          title: "Test 2",
          description: "Description 2",
          icon: "icon2",
          createdAt: newerDate,
        },
      ];

      await Notifications.insertMany(notifications);

      const response = await request(app).get("/notifications");

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
      expect(Date.parse(response.body[0].createdAt)).toBeGreaterThan(
        Date.parse(response.body[1].createdAt)
      );
    });

    it("should handle database errors", async () => {
      jest.spyOn(Notifications, "find").mockImplementationOnce(() => {
        throw new Error("Database error");
      });

      const response = await request(app).get("/notifications");

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: "An error occurred" });
    });
  });

  describe("POST /", () => {
    // it("should create a new notification and emit socket event", async () => {
    //   const newNotification = {
    //     title: "New Notification",
    //     description: "Test Description",
    //     icon: "test-icon",
    //   };

    //   const response = await request(app)
    //     .post("/notifications")
    //     .send(newNotification);

    //   expect(response.status).toBe(201);
    //   expect(response.body).toMatchObject({
    //     ...newNotification,
    //     _id: expect.any(String),
    //     createdAt: expect.any(String),
    //     __v: expect.any(Number),
    //   });

    //   // Verify Socket.IO emission
    //   expect(io.emit).toHaveBeenCalledWith(
    //     "newNotification",
    //     expect.objectContaining({
    //       ...newNotification,
    //       _id: expect.any(String),
    //       createdAt: expect.any(String),
    //       __v: expect.any(Number),
    //     })
    //   );

    //   // Verify database entry
    //   const savedNotification = await Notifications.findById(response.body._id);
    //   expect(savedNotification).toBeTruthy();
    //   expect(savedNotification.title).toBe(newNotification.title);
    // });

    it("should handle invalid notification data", async () => {
      jest.spyOn(Notifications.prototype, "save").mockImplementationOnce(() => {
        throw new mongoose.Error.ValidationError();
      });

      const invalidNotification = {
        title: "",
        description: "",
        icon: "",
      };

      const response = await request(app)
        .post("/notifications")
        .send(invalidNotification);

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: "An error occurred" });
    });
  });

  describe("DELETE /bulk", () => {
    it("should delete multiple notifications and emit socket event", async () => {
      const notifications = await Notifications.insertMany([
        { title: "Test 1", description: "Description 1", icon: "icon1" },
        { title: "Test 2", description: "Description 2", icon: "icon2" },
      ]);

      const idsToDelete = notifications.map((n) => n._id.toString());

      const response = await request(app)
        .delete("/notifications/bulk")
        .send({ ids: idsToDelete });

      expect(response.status).toBe(200);
      expect(response.body.deletedCount).toBe(2);

      // Verify Socket.IO emission
      expect(io.emit).toHaveBeenCalledWith("notificationsDeleted", idsToDelete);

      // Verify notifications were deleted from database
      const remainingNotifications = await Notifications.find({
        _id: { $in: idsToDelete },
      });
      expect(remainingNotifications).toHaveLength(0);
    });

    it("should handle non-existent notification ids", async () => {
      const nonExistentIds = [
        new mongoose.Types.ObjectId().toString(),
        new mongoose.Types.ObjectId().toString(),
      ];

      const response = await request(app)
        .delete("/notifications/bulk")
        .send({ ids: nonExistentIds });

      expect(response.status).toBe(200);
      expect(response.body.deletedCount).toBe(0);
      expect(io.emit).toHaveBeenCalledWith(
        "notificationsDeleted",
        nonExistentIds
      );
    });

    it("should handle invalid ids", async () => {
      const response = await request(app)
        .delete("/notifications/bulk")
        .send({ ids: ["invalid-id"] });

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: "An error occurred" });
    });
  });
});
