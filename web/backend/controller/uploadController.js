const Student = require('../models/studentSchema');

uploadCSV = (req, res) => {
  console.log('Request body:', req.body);

  const csvData = req.body;
  console.log('CSV data:', csvData);

  // Validate and map the CSV data to the student schema
  const students = csvData.map((row) => ({
    studentName: row[0],
    parentName: row[1],
    grade: row[2],
    parentPhone: row[3],
    parentEmail: row[4],
    uniqueCode: row[5] || '', // If uniqueCode is empty, set it to an empty string
  }));
  console.log('Mapped students:', students);

  // Insert the students into the database
  Student.insertMany(students)
    .then(() => {
      console.log('CSV data uploaded successfully');
      res.json({ message: 'CSV data uploaded successfully' });
    })
    .catch((error) => {
      console.error('Database error:', error);
      res.status(500).json({ error: 'An error occurred while uploading the CSV data' });
    });
};

module.exports = { uploadCSV };