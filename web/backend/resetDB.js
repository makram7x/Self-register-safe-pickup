// safe-index-update.js
const mongoose = require("mongoose");
require("dotenv").config();

async function updateIndexes() {
  try {
    // Connect to your database
    await mongoose.connect(process.env.DB_URI);

    const collection = mongoose.connection.collection("parentstudentlinks");

    // List current indexes
    console.log("Current indexes:");
    const currentIndexes = await collection.indexes();
    console.log(currentIndexes);

    // Drop all problematic indexes
    console.log("\nDropping problematic indexes...");
    const indexesToDrop = [
      "parentId_1_studentId_1", // Old problematic index
      "parentId_1_uniqueCode_1", // Another potentially conflicting index
      "parent_student_unique", // Existing index with different name
      "unique_parent_student", // Our new index name (in case it exists)
    ];

    for (const indexName of indexesToDrop) {
      try {
        await collection.dropIndex(indexName);
        console.log(`Successfully dropped index: ${indexName}`);
      } catch (error) {
        if (error.code === 27) {
          console.log(`Index ${indexName} does not exist - skipping...`);
        } else {
          console.error(`Error dropping index ${indexName}:`, error.message);
        }
      }
    }

    // Create new index with proper structure
    console.log("\nCreating new index...");
    await collection.createIndex(
      {
        parentId: 1,
        "studentInfo.uniqueCode": 1,
      },
      {
        unique: true,
        name: "unique_parent_student",
        background: true,
      }
    );
    console.log("Successfully created new index");

    // Verify final state
    console.log("\nFinal indexes:");
    const finalIndexes = await collection.indexes();
    console.log(finalIndexes);
  } catch (error) {
    console.error("Update error:", error);
  } finally {
    await mongoose.disconnect();
    console.log("\nDatabase connection closed");
  }
}

updateIndexes().catch(console.error);
