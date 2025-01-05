const ParentStudentLink = require("../models/parentStudentLink");
const Student = require("../models/studentSchema");
const mongoose = require("mongoose");

const getParentLinks = async (req, res) => {
  try {
    const { parentId } = req.params;
    console.log("Fetching links for parentId:", parentId);

    // Add debugging to check collection
    const totalDocs = await ParentStudentLink.countDocuments();
    console.log("Total documents in collection:", totalDocs);

    // Use more flexible query
    const links = await ParentStudentLink.find({
      parentId: { $regex: new RegExp(parentId, "i") },
    }).lean();

    console.log("Raw links found:", links);

    if (!links || links.length === 0) {
      // Try alternative query with toString()
      const altLinks = await ParentStudentLink.find({
        parentId: parentId.toString(),
      }).lean();

      console.log("Alternative query links:", altLinks);

      if (altLinks.length > 0) {
        links = altLinks;
      }
    }

    const formattedLinks = links.map((link) => ({
      code: link.studentInfo.uniqueCode,
      name: link.studentInfo.name,
      linkId: link._id.toString(),
    }));

    console.log("Formatted links:", formattedLinks);

    res.status(200).json({
      success: true,
      data: formattedLinks,
      debug: {
        totalDocuments: totalDocs,
        rawLinks: links,
        searchedParentId: parentId,
      },
    });
  } catch (error) {
    console.error("Error fetching parent links:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching linked students",
      error: error.message,
      stack: error.stack,
    });
  }
};

// Updated createLink to ensure proper data structure
const createLink = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { parentId, uniqueCode } = req.body;
    console.log("Creating link:", { parentId, uniqueCode }); // Debug log

    // Find student
    const student = await Student.findOne({ uniqueCode }).session(session);
    console.log("Found student:", student); // Debug log

    if (!student) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    // Create new link
    const newLink = new ParentStudentLink({
      parentId,
      studentInfo: {
        uniqueCode: student.uniqueCode,
        name: student.studentName,
      },
    });

    console.log("Creating new link:", newLink); // Debug log

    await newLink.save({ session });
    await session.commitTransaction();

    // Return formatted response
    const responseData = {
      code: student.uniqueCode,
      name: student.studentName,
      linkId: newLink._id.toString(),
    };

    console.log("Sending response:", responseData); // Debug log

    res.status(201).json({
      success: true,
      data: responseData,
      message: "Student linked successfully",
    });
  } catch (error) {
    await session.abortTransaction();
    console.error("Link creation error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create link",
      error: error.message,
    });
  } finally {
    session.endSession();
  }
};

// Utility function to help with debugging
const debugLinks = async (req, res) => {
  try {
    const { parentId } = req.params;

    // Get all links for this parent
    const links = await ParentStudentLink.find({ parentId });

    // Get collection stats
    const stats = await ParentStudentLink.collection.stats();

    // Get all indexes
    const indexes = await ParentStudentLink.collection.indexes();

    res.status(200).json({
      success: true,
      data: {
        links,
        collectionStats: stats,
        indexes,
      },
    });
  } catch (error) {
    console.error("Debug endpoint error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// In parentStudentController.js
const deleteLink = async (req, res) => {
  try {
    const { linkId } = req.params;
    console.log("Starting force delete for linkId:", linkId);

    // Force delete using deleteOne to bypass any potential middleware
    const result = await ParentStudentLink.deleteOne({ _id: linkId });
    console.log("Delete operation result:", result);

    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Link not found",
      });
    }

    // Verify the deletion
    const verifyDeletion = await ParentStudentLink.findById(linkId);
    if (verifyDeletion) {
      console.error("Link still exists after deletion attempt");
      throw new Error("Failed to delete link - document still exists");
    }

    console.log("Link successfully deleted");

    res.status(200).json({
      success: true,
      message: "Link permanently deleted",
      deletionResult: result,
    });
  } catch (error) {
    console.error("Error in force delete:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting student link",
      error: error.message,
    });
  }
};

const verifyLink = async (req, res) => {
  try {
    const { uniqueCode } = req.params;
    console.log("Checking unique code:", uniqueCode);

    const student = await Student.findOne({ uniqueCode });
    console.log("Found student in verify:", student);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found with this code",
      });
    }

    res.status(200).json({
      success: true,
      data: {
        studentName: student.studentName,
        uniqueCode: student.uniqueCode,
        grade: student.grade,
      },
    });
  } catch (error) {
    console.error("Error in verify:", error);
    res.status(500).json({
      success: false,
      message: "Error verifying student code",
    });
  }
};

const deleteAllLinks = async (req, res) => {
  try {
    console.log("Starting complete deletion of all parent-student links");

    // Use deleteMany to remove all documents from the collection
    const result = await ParentStudentLink.deleteMany({});

    console.log("Deletion result:", result);

    res.status(200).json({
      success: true,
      message: `Deleted ${result.deletedCount} parent-student links`,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error("Error in deleteAllLinks:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting all parent-student links",
      error: error.message,
    });
  }
};

module.exports = {
  getParentLinks,
  createLink,
  deleteLink,
  verifyLink,
  debugLinks,
  deleteAllLinks,
};
