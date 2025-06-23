const express = require('express');
const router = express.Router();
const machineController = require('../controllers/machineController');

router.get('/', machineController.getMachines);
router.put('/:id/assign', machineController.assignMachine);
router.put('/:id/release', machineController.releaseMachine);
router.get('/employees', machineController.getEmployees);
router.post('/initialize', machineController.initializeData);

module.exports = router;