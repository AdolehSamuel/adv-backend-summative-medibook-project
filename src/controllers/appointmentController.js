const appointmentModel = require('../models/appointmentModel');
const queue = require('../services/queue');
const HttpError = require('../utils/HttpError');
const { writeAuditLog } = require('../utils/auditLogger');
const { calculateRefund } = require('../utils/refund');
const { isPositiveInteger } = require('../utils/validation');
const {
  validateAppointmentTime,
  parseDatetimeText,
  formatSqlDatetime,
} = require('../utils/timeRules');
const { DAILY_APPOINTMENT_CAP } = require('../config/constants');

function readAppointmentId(req) {
  const id = req.params.id;
  if (!isPositiveInteger(id)) {
    throw new HttpError(400, 'Appointment id must be a positive whole number');
  }
  return Number(id);
}

function readBookingRequest(body) {
  if (!isPositiveInteger(body.patient_id)) {
    throw new HttpError(400, 'patient_id must be a positive whole number');
  }
  if (!isPositiveInteger(body.doctor_id)) {
    throw new HttpError(400, 'doctor_id must be a positive whole number');
  }

  const timeCheck = validateAppointmentTime(body.appointment_datetime, new Date());
  if (!timeCheck.ok) {
    throw new HttpError(timeCheck.statusCode, timeCheck.message);
  }

  return {
    patientId: Number(body.patient_id),
    doctorId: Number(body.doctor_id),
    appointmentDatetime: timeCheck.sqlDatetime,
    day: timeCheck.day,
    wantsWaitlist: body.join_waitlist === true,
  };
}

async function offerWaitlist(booking, reason, res) {
  const reasonText =
    reason === 'day_full'
      ? `This doctor already has ${DAILY_APPOINTMENT_CAP} appointments on ${booking.day}`
      : 'This slot is already booked';

  if (!booking.wantsWaitlist) {
    throw new HttpError(
      409,
      `${reasonText}. Send the same request with "join_waitlist": true to join the waitlist for that day.`
    );
  }

  let position;
  try {
    position = await queue.joinWaitlist({
      patient_id: booking.patientId,
      doctor_id: booking.doctorId,
      day: booking.day,
      requested_datetime: booking.appointmentDatetime,
      joined_at: new Date().toISOString(),
    });
  } catch (error) {
    throw new HttpError(503, 'The waitlist is not available right now. Please try again later.');
  }

  res.status(202).json({
    message: `${reasonText}. You have been added to the waitlist.`,
    waitlist_position: position,
    doctor_id: booking.doctorId,
    day: booking.day,
  });
}

async function sendConfirmationJob(appointment) {
  try {
    await queue.addConfirmationJob({
      appointment_id: appointment.id,
      patient_id: appointment.patient_id,
      doctor_id: appointment.doctor_id,
      appointment_datetime: appointment.appointment_datetime,
    });
  } catch (error) {
    console.error('Could not queue confirmation job:', error.message);
  }
}

async function tellWaitlistSlotIsFree(appointment) {
  try {
    await queue.addSlotFreedJob({
      doctor_id: appointment.doctor_id,
      appointment_datetime: appointment.appointment_datetime,
    });
  } catch (error) {
    console.error('Could not notify the waitlist:', error.message);
  }
}

async function getAppointment(req, res) {
  const id = readAppointmentId(req);
  const appointment = await appointmentModel.findById(id);

  if (!appointment) {
    throw new HttpError(404, `Appointment ${id} not found`);
  }
  res.json(appointment);
}

async function bookAppointment(req, res) {
  const booking = readBookingRequest(req.body);

  const result = await appointmentModel.bookAppointment({
    patientId: booking.patientId,
    doctorId: booking.doctorId,
    appointmentDatetime: booking.appointmentDatetime,
    day: booking.day,
    dailyCap: DAILY_APPOINTMENT_CAP,
  });

  if (result.status === 'doctor_not_found') {
    throw new HttpError(404, `Doctor ${booking.doctorId} not found`);
  }
  if (result.status === 'patient_not_found') {
    throw new HttpError(404, `Patient ${booking.patientId} not found`);
  }
  if (result.status === 'slot_taken' || result.status === 'day_full') {
    return offerWaitlist(booking, result.status, res);
  }

  const appointment = await appointmentModel.findById(result.appointmentId);

  await writeAuditLog({
    event: 'appointment_booked',
    source: 'api',
    appointment_id: appointment.id,
    patient_id: appointment.patient_id,
    doctor_id: appointment.doctor_id,
    appointment_datetime: appointment.appointment_datetime,
    amount_paid: appointment.amount_paid,
  });
  await sendConfirmationJob(appointment);

  res.status(201).json(appointment);
}

async function cancelAppointment(req, res) {
  const id = readAppointmentId(req);
  const appointment = await appointmentModel.findById(id);

  if (!appointment) {
    throw new HttpError(404, `Appointment ${id} not found`);
  }
  if (appointment.status === 'cancelled') {
    throw new HttpError(409, `Appointment ${id} is already cancelled`);
  }

  const now = new Date();
  const appointmentDate = parseDatetimeText(appointment.appointment_datetime);
  if (appointmentDate <= now) {
    throw new HttpError(422, 'An appointment that has already started or passed cannot be cancelled');
  }

  const amountPaid = Number(appointment.amount_paid);
  const refund = calculateRefund(amountPaid, appointmentDate, now);

  const changedRows = await appointmentModel.cancel(id, refund.refundAmount, formatSqlDatetime(now));
  if (changedRows === 0) {
    throw new HttpError(409, `Appointment ${id} is already cancelled`);
  }

  await writeAuditLog({
    event: 'appointment_cancelled',
    appointment_id: id,
    patient_id: appointment.patient_id,
    doctor_id: appointment.doctor_id,
    appointment_datetime: appointment.appointment_datetime,
    refund_percent: refund.refundPercent,
    refund_amount: refund.refundAmount,
  });
  await tellWaitlistSlotIsFree(appointment);

  res.json({
    message: `Appointment ${id} cancelled`,
    appointment_id: id,
    hours_of_notice: Math.round(refund.hoursOfNotice * 100) / 100,
    amount_paid: amountPaid,
    refund_percent: refund.refundPercent,
    refund_amount: refund.refundAmount,
  });
}

module.exports = { getAppointment, bookAppointment, cancelAppointment };
