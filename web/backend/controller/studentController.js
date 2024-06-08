const Student = require('../models/studentSchema');

const createStudent = async (req, res) => {
  try {
    const { studentName, parentName } = req.body;

    const newStudent = new Student({
      studentName,
      parentName
    });

    await newStudent.save();

    res.status(201).json({ message: 'Student created successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const getAllStudents = async (req, res) => {
  try {
      const students = await Student.find();
      res.json(students);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const deleteStudent = async (req, res) => {
  try {
    const { id } = req.params;
    await Student.findByIdAndDelete(id);
    res.status(200).json({ message: 'Student deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const updateStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const { studentName, parentName } = req.body;
      const updatedStudent = await Student.findByIdAndUpdate(id, { studentName, parentName }, { new: true });
      console.log(updatedStudent);
    res.status(200).json(updatedStudent);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {createStudent, getAllStudents, deleteStudent, updateStudent};