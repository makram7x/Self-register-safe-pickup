const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  studentName: {
    type: String,
    required: true,
  },
  parentName: {
    type: String,
    required: true,
  },
  grade: {
    type: String,
    required: true,
  },
  parentPhone: {
    type: String,
    required: true,
  },
  parentEmail: {
    type: String,
    required: true,
  },
  uniqueCode: {
    type: String,
    sparse: true, // This allows multiple documents with no uniqueCode
    unique: true, // This ensures uniqueCode is unique when it exists
  },
});

const Student = mongoose.model('Student', studentSchema);

module.exports = Student;
