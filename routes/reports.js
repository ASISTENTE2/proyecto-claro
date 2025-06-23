const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const authController = require('../controllers/authController');

router.post('/', authController.protect, authController.authorize('cliente'), reportController.createReport);
router.get('/my', authController.protect, authController.authorize('cliente'), reportController.getReportsByClient);
router.get('/all', authController.protect, authController.authorize('empleado'), reportController.getAllReportsForEmployee);
router.put('/:id/assign', authController.protect, authController.authorize('empleado'), reportController.assignReport);
router.put('/:id/resolve', authController.protect, authController.authorize('empleado'), reportController.resolveReport);

module.exports = router;