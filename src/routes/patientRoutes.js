const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const patientController = require('../controllers/patientController');

const router = express.Router();

router.get('/', asyncHandler(patientController.getAllPatients));
router.get('/:id', asyncHandler(patientController.getPatient));
router.post('/', asyncHandler(patientController.createPatient));
router.put('/:id', asyncHandler(patientController.updatePatient));
router.delete('/:id', asyncHandler(patientController.deletePatient));

module.exports = router;
