const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const reportController = require('../controllers/reportController');

const router = express.Router();

router.get('/doctors', asyncHandler(reportController.getDoctorsReport));
router.get('/busy-days', asyncHandler(reportController.getBusyDaysReport));

module.exports = router;
