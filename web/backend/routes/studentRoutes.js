const express = require('express');
const router = express.Router();
const { createStudent, getAllStudents, deleteStudent, updateStudent } = require('../controller/studentController');

router.post('/', createStudent);
router.get('/', getAllStudents);
router.delete('/:id', deleteStudent);
router.put('/:id', updateStudent);

module.exports = router;
