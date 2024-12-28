const mongoose = require("mongoose");

const driverSchema = new mongoose.Schema(
  {
    parentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: {
      type: String,
      required: [true, "Driver name is required"],
      trim: true,
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: false, // Not required initially, only after registration
    },
    active: {
      type: Boolean,
      default: true,
    },
    isRegistered: {
      type: Boolean,
      default: false,
    },
    verificationCode: {
      type: String,
      required: true,
      unique: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
driverSchema.index({ parentId: 1, email: 1 }, { unique: true });
driverSchema.index({ verificationCode: 1 }, { unique: true });

// Don't return password in JSON
driverSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

const Driver = mongoose.model("Driver", driverSchema);

module.exports = Driver;
