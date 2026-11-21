const reportModel = require('../models/reportModel');
const { DAILY_APPOINTMENT_CAP, BUSY_DAY_THRESHOLD_PERCENT } = require('../config/constants');

async function getDoctorsReport(req, res) {
  const doctors = await reportModel.getDoctorsReport();
  res.json(doctors);
}

async function getBusyDaysReport(req, res) {
  const busyDays = await reportModel.getBusyDaysReport(DAILY_APPOINTMENT_CAP, BUSY_DAY_THRESHOLD_PERCENT);

  res.json({
    daily_cap: DAILY_APPOINTMENT_CAP,
    threshold_percent: BUSY_DAY_THRESHOLD_PERCENT,
    busy_days: busyDays,
  });
}

module.exports = { getDoctorsReport, getBusyDaysReport };
