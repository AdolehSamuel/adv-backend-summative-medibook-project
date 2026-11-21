const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const appointmentController = require('../controllers/appointmentController');

const router = express.Router();

router.post('/', asyncHandler(appointmentController.bookAppointment));
router.get('/:id', asyncHandler(appointmentController.getAppointment));
router.patch('/:id/cancel', asyncHandler(appointmentController.cancelAppointment));

module.exports = router;
