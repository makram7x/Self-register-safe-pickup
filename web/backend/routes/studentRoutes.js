const express = require("express");
const router = express.Router();
const {
  createStudent,
  getAllStudents,
  deleteStudent,
  updateStudent,
  getAllStudentsCount,
  getUniqueParentsCount,
  getStudentByUniqueCode,
} = require("../controller/studentController");

router.post("/", createStudent);
router.get("/", getAllStudents);
router.delete("/:id", deleteStudent);
router.put("/:id", updateStudent);
router.get("/count", getAllStudentsCount);
router.get("/parent-count", getUniqueParentsCount);
router.get("/unique/:uniqueCode", getStudentByUniqueCode);

module.exports = router;
