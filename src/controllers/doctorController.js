const doctorModel = require('../models/doctorModel');
const HttpError = require('../utils/HttpError');
const { isPositiveInteger, validateDoctor } = require('../utils/validation');
const { DAILY_APPOINTMENT_CAP, STATS_DAYS_AHEAD } = require('../config/constants');

function readDoctorId(req) {
  const id = req.params.id;
  if (!isPositiveInteger(id)) {
    throw new HttpError(400, 'Doctor id must be a positive whole number');
  }
  return Number(id);
}

function checkDoctorBody(body) {
  const errors = validateDoctor(body);
  if (errors.length > 0) {
    throw new HttpError(400, errors.join('; '));
  }

  return {
    full_name: body.full_name.trim(),
    specialty: body.specialty.trim(),
    consultation_fee: body.consultation_fee,
    room: body.room.trim(),
  };
}

async function getAllDoctors(req, res) {
  const doctors = await doctorModel.findAll();
  res.json(doctors);
}

async function getDoctor(req, res) {
  const id = readDoctorId(req);
  const doctor = await doctorModel.findById(id);

  if (!doctor) {
    throw new HttpError(404, `Doctor ${id} not found`);
  }
  res.json(doctor);
}

async function createDoctor(req, res) {
  const doctor = checkDoctorBody(req.body);
  const newId = await doctorModel.create(doctor);

  const createdDoctor = await doctorModel.findById(newId);
  res.status(201).json(createdDoctor);
}

async function updateDoctor(req, res) {
  const id = readDoctorId(req);
  const doctor = checkDoctorBody(req.body);
  const changedRows = await doctorModel.update(id, doctor);

  if (changedRows === 0) {
    throw new HttpError(404, `Doctor ${id} not found`);
  }

  const updatedDoctor = await doctorModel.findById(id);
  res.json(updatedDoctor);
}

async function deleteDoctor(req, res) {
  const id = readDoctorId(req);

  let deletedRows;
  try {
    deletedRows = await doctorModel.remove(id);
  } catch (error) {
    if (error.code === 'ER_ROW_IS_REFERENCED_2') {
      throw new HttpError(409, 'Cannot delete a doctor who has appointments');
    }
    throw error;
  }

  if (deletedRows === 0) {
    throw new HttpError(404, `Doctor ${id} not found`);
  }
  res.status(204).send();
}

async function getDoctorStats(req, res) {
  const id = readDoctorId(req);
  const summary = await doctorModel.getSummaryStats(id, STATS_DAYS_AHEAD, DAILY_APPOINTMENT_CAP);

  if (!summary) {
    throw new HttpError(404, `Doctor ${id} not found`);
  }

  const dailyCounts = await doctorModel.getDailyCounts(id, STATS_DAYS_AHEAD, DAILY_APPOINTMENT_CAP);

  res.json({
    doctor_id: summary.doctor_id,
    doctor_name: summary.doctor_name,
    revenue_collected: summary.revenue_collected,
    upcoming_appointments: summary.upcoming_appointments,
    daily_cap: DAILY_APPOINTMENT_CAP,
    utilization_percent_next_7_days: summary.utilization_percent_next_days,
    next_7_days: dailyCounts,
  });
}

module.exports = {
  getAllDoctors,
  getDoctor,
  createDoctor,
  updateDoctor,
  deleteDoctor,
  getDoctorStats,
};
