// models/pickupSchema.js
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const pickupSchema = new Schema(
  {
    pickupCode: {
      type: String,
      required: true,
    },
    studentIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ParentStudentLink",
        required: true,
      },
    ],
    studentNames: {
      type: String,
      required: true,
    },
    studentCodes: {
      type: String,
      required: true,
    },
    parent: {
      id: {
        type: String,
        required: true,
      },
      name: {
        type: String,
        required: true,
      },
      email: {
        type: String,
        required: true,
      },
    },
    // Make initiatedBy optional
    initiatedBy: {
      id: mongoose.Schema.Types.ObjectId,
      name: String,
      email: String,
      type: {
        type: String,
        enum: ["parent", "driver", "staff"],
      },
    },
    completedBy: {
      id: {
        type: mongoose.Schema.Types.ObjectId,
      },
      name: String,
      email: String,
      phone: String,
      type: {
        type: String,
        enum: ["driver", "staff", "admin"], // Added "admin" to valid types
      },
      verificationCode: String,
    },
    status: {
      type: String,
      enum: ["pending", "completed", "cancelled"],
      default: "pending",
    },
    pickupTime: {
      type: Date,
      default: Date.now,
    },
    statusHistory: [
      {
        status: {
          type: String,
          enum: ["pending", "completed", "cancelled"],
          required: true,
        },
        updatedBy: {
          id: mongoose.Schema.Types.ObjectId,
          name: String,
          type: {
            type: String,
            enum: ["parent", "driver", "staff", "admin"], // Added "admin" here too
          },
        },
        updatedAt: {
          type: Date,
          default: Date.now,
        },
        notes: String,
        driverInfo: {
          id: mongoose.Schema.Types.ObjectId,
          name: String,
          email: String,
          phone: String,
          verificationCode: String,
        },
      },
    ],
    completedAt: Date,
  },
  {
    timestamps: true,
  }
);

pickupSchema.index({ "parent.id": 1 });
pickupSchema.index({ pickupCode: 1 });
pickupSchema.index({ "completedBy.id": 1 });

const Pickup = mongoose.model("Pickup", pickupSchema);
module.exports = Pickup;
