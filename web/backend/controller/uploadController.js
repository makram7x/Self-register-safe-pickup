const Student = require("../models/studentSchema");

const generateUniqueCode = () => {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    code += characters[randomIndex];
  }
  return code;
};

const validateRow = (row) => {
  const errors = [];

  if (!row[0]) errors.push("Student Name is required");
  if (!row[1]) errors.push("Parent Name is required");
  if (!row[2] || isNaN(row[2]) || row[2] < 1 || row[2] > 6) {
    errors.push("Grade must be a number between 1 and 6");
  }
  if (!row[3] || !/^[\d\s-+()]*$/.test(row[3])) {
    errors.push("Invalid phone number format");
  }
  if (!row[4] || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row[4])) {
    errors.push("Invalid email format");
  }

  return errors;
};

uploadCSV = async (req, res) => {
  try {
    const csvData = req.body;

    // Validate file structure
    if (!Array.isArray(csvData) || csvData.length < 2) {
      return res.status(400).json({
        error: "Invalid file structure",
        errors: ["File must contain headers and at least one data row"],
      });
    }

    // Validate headers
    const expectedHeaders = [
      "Student Name",
      "Parent Name",
      "Grade",
      "Parent Phone",
      "Parent Email",
    ];
    const headers = csvData[0].map((header) => header.trim());

    const missingHeaders = expectedHeaders.filter(
      (header, index) =>
        !headers[index] ||
        !headers[index].toLowerCase().includes(header.toLowerCase())
    );

    if (missingHeaders.length > 0) {
      return res.status(400).json({
        error: "Invalid headers",
        errors: [`Missing or incorrect headers: ${missingHeaders.join(", ")}`],
      });
    }

    const results = {
      success: [],
      errors: [],
    };

    // Process each row
    for (let i = 1; i < csvData.length; i++) {
      const row = csvData[i];

      // Skip empty rows
      if (!row.some((cell) => cell)) continue;

      // Validate row data
      const rowErrors = validateRow(row);

      if (rowErrors.length > 0) {
        results.errors.push({
          studentName: row[0] || `Row ${i + 1}`,
          error: rowErrors.join("; "),
        });
        continue;
      }

      try {
        const studentData = {
          studentName: row[0].trim(),
          parentName: row[1].trim(),
          grade: parseInt(row[2]),
          parentPhone: row[3].trim(),
          parentEmail: row[4].trim(),
          uniqueCode: row[5]?.trim() || generateUniqueCode(),
        };

        const newStudent = await Student.create(studentData);
        results.success.push({
          studentName: studentData.studentName,
          uniqueCode: newStudent.uniqueCode,
        });
      } catch (error) {
        results.errors.push({
          studentName: row[0] || `Row ${i + 1}`,
          error: error.message,
        });
      }
    }

    res.json({
      message: "File processing completed",
      successCount: results.success.length,
      errorCount: results.errors.length,
      successfulStudents: results.success,
      errors: results.errors,
    });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({
      error: "An error occurred while processing the file",
      errors: [error.message],
    });
  }
};

module.exports = { uploadCSV };
