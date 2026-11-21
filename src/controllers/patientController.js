const patientModel = require('../models/patientModel');
const HttpError = require('../utils/HttpError');
const { isPositiveInteger, validatePatient } = require('../utils/validation');

function readPatientId(req) {
  const id = req.params.id;
  if (!isPositiveInteger(id)) {
    throw new HttpError(400, 'Patient id must be a positive whole number');
  }
  return Number(id);
}

function checkPatientBody(body) {
  const errors = validatePatient(body);
  if (errors.length > 0) {
    throw new HttpError(400, errors.join('; '));
  }

  return {
    full_name: body.full_name.trim(),
    email: body.email.trim().toLowerCase(),
    phone: body.phone.trim(),
  };
}

function throwIfDuplicateEmail(error) {
  if (error.code === 'ER_DUP_ENTRY') {
    throw new HttpError(409, 'A patient with this email already exists');
  }
  throw error;
}

async function getAllPatients(req, res) {
  const patients = await patientModel.findAll();
  res.json(patients);
}

async function getPatient(req, res) {
  const id = readPatientId(req);
  const patient = await patientModel.findById(id);

  if (!patient) {
    throw new HttpError(404, `Patient ${id} not found`);
  }
  res.json(patient);
}

async function createPatient(req, res) {
  const patient = checkPatientBody(req.body);

  let newId;
  try {
    newId = await patientModel.create(patient);
  } catch (error) {
    throwIfDuplicateEmail(error);
  }

  const createdPatient = await patientModel.findById(newId);
  res.status(201).json(createdPatient);
}

async function updatePatient(req, res) {
  const id = readPatientId(req);
  const patient = checkPatientBody(req.body);

  let changedRows;
  try {
    changedRows = await patientModel.update(id, patient);
  } catch (error) {
    throwIfDuplicateEmail(error);
  }

  if (changedRows === 0) {
    throw new HttpError(404, `Patient ${id} not found`);
  }

  const updatedPatient = await patientModel.findById(id);
  res.json(updatedPatient);
}

async function deletePatient(req, res) {
  const id = readPatientId(req);

  let deletedRows;
  try {
    deletedRows = await patientModel.remove(id);
  } catch (error) {
    if (error.code === 'ER_ROW_IS_REFERENCED_2') {
      throw new HttpError(409, 'Cannot delete a patient who has appointments');
    }
    throw error;
  }

  if (deletedRows === 0) {
    throw new HttpError(404, `Patient ${id} not found`);
  }
  res.status(204).send();
}

module.exports = {
  getAllPatients,
  getPatient,
  createPatient,
  updatePatient,
  deletePatient,
};
