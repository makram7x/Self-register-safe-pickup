// safe-index-update.js
// const mongoose = require("mongoose");
require("dotenv").config();

// async function updateIndexes() {
//   try {
//     // Connect to your database
//     await mongoose.connect(process.env.DB_URI);

//     const collection = mongoose.connection.collection("parentstudentlinks");

//     // List current indexes
//     console.log("Current indexes:");
//     const currentIndexes = await collection.indexes();
//     console.log(currentIndexes);

//     // Drop all problematic indexes
//     console.log("\nDropping problematic indexes...");
//     const indexesToDrop = [
//       "parentId_1_studentId_1", // Old problematic index
//       "parentId_1_uniqueCode_1", // Another potentially conflicting index
//       "parent_student_unique", // Existing index with different name
//       "unique_parent_student", // Our new index name (in case it exists)
//     ];

//     for (const indexName of indexesToDrop) {
//       try {
//         await collection.dropIndex(indexName);
//         console.log(`Successfully dropped index: ${indexName}`);
//       } catch (error) {
//         if (error.code === 27) {
//           console.log(`Index ${indexName} does not exist - skipping...`);
//         } else {
//           console.error(`Error dropping index ${indexName}:`, error.message);
//         }
//       }
//     }

//     // Create new index with proper structure
//     console.log("\nCreating new index...");
//     await collection.createIndex(
//       {
//         parentId: 1,
//         "studentInfo.uniqueCode": 1,
//       },
//       {
//         unique: true,
//         name: "unique_parent_student",
//         background: true,
//       }
//     );
//     console.log("Successfully created new index");

//     // Verify final state
//     console.log("\nFinal indexes:");
//     const finalIndexes = await collection.indexes();
//     console.log(finalIndexes);
//   } catch (error) {
//     console.error("Update error:", error);
//   } finally {
//     await mongoose.disconnect();
//     console.log("\nDatabase connection closed");
//   }
// }

// updateIndexes().catch(console.error);

// Create a file called fixIndex.js in your backend folder

const mongoose = require("mongoose");
require("dotenv").config(); // Load environment variables

// Log MongoDB URI (without sensitive data)
console.log("MongoDB URI loaded:", process.env.DB_URI ? "Yes" : "No");

// MongoDB connection URI - use environment variable or fallback
// const process.env.DB_URI =
//   process.env.process.env.DB_URI || "mongodb://localhost:27017/your_database_name";

async function fixUserIndex() {
  try {
    // Connect to MongoDB with options
    await mongoose.connect(process.env.DB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Connected to MongoDB");

    // List all collections
    const collections = await mongoose.connection.db
      .listCollections()
      .toArray();
    console.log(
      "Available collections:",
      collections.map((c) => c.name)
    );

    // Get the users collection
    const usersCollection = mongoose.connection.collection("users");

    // List current indexes
    const currentIndexes = await usersCollection.indexes();
    console.log("Current indexes:", currentIndexes);

    try {
      // Drop the specific index if it exists
      await usersCollection.dropIndex("googleId_1");
      console.log("Successfully dropped googleId index");
    } catch (error) {
      if (error.code === 27) {
        console.log("Index googleId_1 does not exist, skipping drop");
      } else {
        throw error;
      }
    }

    // Recreate indices from schema
    const User = require("./models/userSchema");
    await User.init();
    console.log("Successfully recreated indices");

    // Verify new indexes
    const newIndexes = await usersCollection.indexes();
    console.log("New indexes:", newIndexes);
  } catch (error) {
    console.error("Error occurred:", error);
  } finally {
    await mongoose.connection.close();
    console.log("Disconnected from MongoDB");
    process.exit(0);
  }
}

// Run the function
fixUserIndex();