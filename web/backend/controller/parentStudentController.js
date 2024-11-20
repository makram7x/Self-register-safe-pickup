const ParentStudentLink = require("../models/parentStudentLink");
const Student = require("../models/studentSchema");
const mongoose = require("mongoose");

const getParentLinks = async (req, res) => {
  try {
    const { parentId } = req.params;
    console.log("Fetching links for parentId:", parentId);

    const links = await ParentStudentLink.find({
      parentId,
      active: true,
    });

    console.log("Found links:", links); // Debug log

    // Transform data with proper structure
    const formattedLinks = links.map((link) => ({
      code: link.studentInfo.uniqueCode,
      name: link.studentInfo.name,
      linkId: link._id.toString(),
    }));

    console.log("Formatted links:", formattedLinks); // Debug log

    res.status(200).json({
      success: true,
      data: formattedLinks,
    });
  } catch (error) {
    console.error("Error fetching parent links:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching linked students",
      error: error.message,
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

const deleteLink = async (req, res) => {
  try {
    const { linkId } = req.params;
    console.log("Attempting to delete link:", linkId);

    // First check if the link exists and is active
    const link = await ParentStudentLink.findOne({
      _id: linkId,
      active: true,
    });

    if (!link) {
      return res.status(404).json({
        success: false,
        message: "Active link not found",
      });
    }

    // Soft delete by marking as inactive
    link.active = false;
    await link.save();

    console.log("Link marked as inactive:", link);

    res.status(200).json({
      success: true,
      message: "Link removed successfully",
    });
  } catch (error) {
    console.error("Error deleting parent-student link:", error);
    res.status(500).json({
      success: false,
      message: "Error removing student link",
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
    // Use updateMany to soft delete all active links
    const result = await ParentStudentLink.updateMany(
      { active: true },
      { $set: { active: false } }
    );

    console.log("Deleted all parent-student links:", result);

    res.status(200).json({
      success: true,
      message: `Deactivated ${result.modifiedCount} parent-student links`,
      deletedCount: result.modifiedCount,
    });
  } catch (error) {
    console.error("Error deleting all parent-student links:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting parent-student links",
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
