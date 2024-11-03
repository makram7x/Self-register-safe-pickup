const Student = require("../models/studentSchema");
const mongoose = require("mongoose");

const createStudent = async (req, res) => {
  try {
    const {
      studentName,
      parentName,
      grade,
      parentPhone,
      parentEmail,
      uniqueCode,
    } = req.body;

    const newStudent = new Student({
      studentName,
      parentName,
      grade,
      parentPhone,
      parentEmail,
      uniqueCode,
    });

    await newStudent.save();

    res.status(201).json({ message: "Student created successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const getAllStudents = async (req, res) => {
  try {
    const students = await Student.find();
    res.json(students);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const deleteStudent = async (req, res) => {
  try {
    const { id } = req.params;
    await Student.findByIdAndDelete(id);
    res.status(200).json({ message: "Student deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const updateStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      studentName,
      parentName,
      grade,
      parentPhone,
      parentEmail,
      uniqueCode,
    } = req.body;

    // Check if the provided id is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid student id" });
    }

    const updatedStudent = await Student.findByIdAndUpdate(
      id,
      { studentName, parentName, grade, parentPhone, parentEmail, uniqueCode },
      { new: true }
    );

    if (!updatedStudent) {
      return res.status(404).json({ message: "Student not found" });
    }

    console.log(updatedStudent);
    res.status(200).json(updatedStudent);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const getAllStudentsCount = async (req, res) => {
  try {
    const count = await Student.countDocuments();
    res.json({ count });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const getUniqueParentsCount = async (req, res) => {
  try {
    const uniqueParents = await Student.aggregate([
      {
        $group: {
          _id: "$parentName",
        },
      },
      {
        $group: {
          _id: null,
          count: { $sum: 1 },
        },
      },
    ]);

    const count = uniqueParents.length > 0 ? uniqueParents[0].count : 0;
    console.log(count);
    res.json({ count });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const getStudentByUniqueCode = async (req, res) => {
  try {
    const { uniqueCode } = req.params;
    const student = await Student.findOne({ uniqueCode });

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    res.status(200).json({
      studentName: student.studentName,
      uniqueCode: student.uniqueCode,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
  createStudent,
  getAllStudents,
  deleteStudent,
  updateStudent,
  getAllStudentsCount,
  getUniqueParentsCount,
  getStudentByUniqueCode,
};
