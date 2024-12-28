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
      sparse: true, // This allows multiple null values
      unique: true, // But ensures unique googleIds when present
      default: null,
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

// Remove any existing indexes to prevent conflicts
userSchema.pre("save", async function (next) {
  try {
    if (this.authType === "email") {
      this.googleId = null; // Ensure googleId is null for email users
    }
    next();
  } catch (error) {
    next(error);
  }
});

// Compound index to ensure unique combinations
userSchema.index({ email: 1 });
userSchema.index(
  {
    googleId: 1,
  },
  {
    sparse: true, // This is crucial for allowing multiple null values
    unique: true, // While maintaining uniqueness for non-null values
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
