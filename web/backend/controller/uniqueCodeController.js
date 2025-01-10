const Student = require("../models/studentSchema");

const generateUniqueCode = async () => {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let uniqueCode;
  let isUnique = false;
  let attempts = 0;
  const maxAttempts = 100; // Prevent infinite loops

  while (!isUnique && attempts < maxAttempts) {
    // Generate a new code
    uniqueCode = "";
    for (let i = 0; i < 6; i++) {
      const randomIndex = Math.floor(Math.random() * characters.length);
      uniqueCode += characters[randomIndex];
    }

    // Check if this code already exists in the database
    const existingStudent = await Student.findOne({ uniqueCode });
    if (!existingStudent) {
      isUnique = true;
    }
    attempts++;
  }

  if (!isUnique) {
    throw new Error("Unable to generate unique code after maximum attempts");
  }

  return uniqueCode;
};

const generateUniqueCodes = async (req, res) => {
  try {
    const students = await Student.find();

    if (!students || students.length === 0) {
      return res.status(404).json({ message: "No students found" });
    }

    const updatedStudents = [];
    const errors = [];

    // Generate new codes for each student
    for (const student of students) {
      try {
        const newCode = await generateUniqueCode();

        const updatedStudent = await Student.findByIdAndUpdate(
          student._id,
          { uniqueCode: newCode },
          { new: true }
        );

        if (updatedStudent) {
          updatedStudents.push(updatedStudent);
        } else {
          errors.push(`Failed to update student: ${student.studentName}`);
        }
      } catch (error) {
        errors.push(
          `Error for student ${student.studentName}: ${error.message}`
        );
      }
    }

    // Log results
    console.log(`Generated codes for ${updatedStudents.length} students`);
    if (errors.length > 0) {
      console.error("Errors during code generation:", errors);
    }

    // Send response with both successes and errors
    return res.status(200).json({
      success: true,
      updatedStudents,
      errors: errors.length > 0 ? errors : null,
      message:
        errors.length > 0
          ? `Generated ${updatedStudents.length} codes with ${errors.length} errors`
          : `Successfully generated ${updatedStudents.length} unique codes`,
    });
  } catch (error) {
    console.error("Error generating unique codes:", error);
    return res.status(500).json({
      success: false,
      error: "An error occurred while generating unique codes",
      details: error.message,
    });
  }
};

module.exports = { generateUniqueCodes };
