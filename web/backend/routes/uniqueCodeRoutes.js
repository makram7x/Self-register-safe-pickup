const express = require('express');
const router = express.Router();
const uniqueCodeController = require('../controller/uniqueCodeController');

router.put('/', uniqueCodeController.generateUniqueCodes);

module.exports = router;