const express = require('express');
const router = express.Router();
const { protect } = require('../controllers/authController');
const machineController = require('../controllers/machineController');

router.get('/', protect, machineController.getEmployees);

module.exports = router;