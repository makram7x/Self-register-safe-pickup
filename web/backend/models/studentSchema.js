const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  studentName: {
    type: String,
    required: true
  },
  parentName: {
    type: String,
    required: true
  },
  grade: {
    type: String,
    required: true
  },
  parentPhone: {
    type: String,
    required: true
  },
  parentEmail: {
    type: String,
    required: true
  },
  uniqueCode: {
    type: String,
    required: true,
    unique: true
  }
});

const Student = mongoose.model('Student', studentSchema);

module.exports = Student;
