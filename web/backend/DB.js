const mongoose = require("mongoose");
require("dotenv").config();

const connectDB = async () => {
  try {
    // Force mongoose to use global Promise
    mongoose.Promise = global.Promise;

    // Set strict query and other options
    mongoose.set("strictQuery", true);

    // Connect with retry logic
    const connectWithRetry = async () => {
      try {
        mongoose.connect(process.env.DB_URI, {
          useNewUrlParser: true,
          useUnifiedTopology: true,
          serverSelectionTimeoutMS: 5000,
          family: 4, // Force IPv4
        });
        console.log("MongoDB Connected Successfully!");
      } catch (err) {
        console.error(
          "Failed to connect to MongoDB, retrying in 5 seconds...",
          err
        );
        setTimeout(connectWithRetry, 5000);
      }
    };

    await connectWithRetry();
  } catch (err) {
    console.error("MongoDB connection error:", err.message);
    process.exit(1);
  }
};

module.exports = connectDB;
