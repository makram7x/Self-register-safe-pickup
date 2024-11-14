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
    // Add these new fields
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
    status: {
      type: String,
      enum: ["pending", "completed", "cancelled"],
      default: "pending",
    },
    pickupTime: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
pickupSchema.index({ "parent.id": 1 });
pickupSchema.index({ pickupCode: 1 });
pickupSchema.index({ "student.code": 1 });

const Pickup = mongoose.model("Pickup", pickupSchema);
module.exports = Pickup;
