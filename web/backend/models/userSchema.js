const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const userSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: function () {
        return this.authType === "email";
      },
    },
    googleId: {
      type: String,
      default: undefined, // Changed from null to undefined
      sparse: true,
    },
    authType: {
      type: String,
      required: true,
      enum: ["email", "google"],
      default: "email",
    },
    profilePicture: {
      type: String,
      default: null,
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Modified pre-save middleware
userSchema.pre("save", async function (next) {
  try {
    if (this.isNew) {
      // Only run on new document creation
      if (this.authType === "email") {
        this.googleId = undefined; // Use undefined instead of null
      } else if (this.authType === "google" && !this.googleId) {
        throw new Error("Google ID is required for Google authentication");
      }
    }
    next();
  } catch (error) {
    next(error);
  }
});

// Removed the separate index declarations and combined them
userSchema.index({ email: 1 }, { unique: true });
userSchema.index(
  { googleId: 1 },
  {
    sparse: true,
    unique: true,
    partialFilterExpression: { googleId: { $exists: true } }, // Added partial filter
  }
);

// Method to safely return user data
userSchema.methods.toJSON = function () {
  const user = this.toObject();
  delete user.password;
  return user;
};

const User = mongoose.model("User", userSchema);

module.exports = User;
