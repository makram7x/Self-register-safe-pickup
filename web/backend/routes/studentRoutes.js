const express = require("express");
const router = express.Router();
const {
  createStudent,
  getAllStudents,
  deleteStudent,
  updateStudent,
  getAllStudentsCount,
  getUniqueParentsCount,
} = require("../controller/studentController");

router.post("/", createStudent);
router.get("/", getAllStudents);
router.delete("/:id", deleteStudent);
router.put("/:id", updateStudent);
router.get("/count", getAllStudentsCount);
router.get("/parent-count", getUniqueParentsCount);

module.exports = router;
