const pool = require('../config/database');

async function findById(id) {
  const [rows] = await pool.query(
    `SELECT
       a.id,
       a.patient_id,
       p.full_name AS patient_name,
       a.doctor_id,
       d.full_name AS doctor_name,
       a.appointment_datetime,
       a.amount_paid,
       a.status,
       a.booked_at,
       a.cancelled_at,
       a.refund_amount
     FROM appointments a
     JOIN patients p ON p.id = a.patient_id
     JOIN doctors d ON d.id = a.doctor_id
     WHERE a.id = ?`,
    [id]
  );
  return rows[0];
}

async function bookAppointment({ patientId, doctorId, appointmentDatetime, day, dailyCap }) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [doctorRows] = await connection.query(
      'SELECT id, consultation_fee FROM doctors WHERE id = ? FOR UPDATE',
      [doctorId]
    );
    const doctor = doctorRows[0];
    if (!doctor) {
      await connection.rollback();
      return { status: 'doctor_not_found' };
    }

    const [patientRows] = await connection.query('SELECT id FROM patients WHERE id = ?', [patientId]);
    if (patientRows.length === 0) {
      await connection.rollback();
      return { status: 'patient_not_found' };
    }

    const [countRows] = await connection.query(
      `SELECT COUNT(*) AS booked_count
       FROM appointments
       WHERE doctor_id = ? AND status = 'booked' AND DATE(appointment_datetime) = ?`,
      [doctorId, day]
    );
    const bookedThatDay = countRows[0].booked_count;
    if (bookedThatDay >= dailyCap) {
      await connection.rollback();
      return { status: 'day_full' };
    }

    let insertResult;
    try {
      [insertResult] = await connection.query(
        `INSERT INTO appointments (patient_id, doctor_id, appointment_datetime, amount_paid)
         VALUES (?, ?, ?, ?)`,
        [patientId, doctorId, appointmentDatetime, doctor.consultation_fee]
      );
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        await connection.rollback();
        return { status: 'slot_taken' };
      }
      throw error;
    }

    await connection.commit();
    return {
      status: 'booked',
      appointmentId: insertResult.insertId,
      amountPaid: doctor.consultation_fee,
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function cancel(id, refundAmount, cancelledAt) {
  const [result] = await pool.query(
    `UPDATE appointments
     SET status = 'cancelled', refund_amount = ?, cancelled_at = ?
     WHERE id = ? AND status = 'booked'`,
    [refundAmount, cancelledAt, id]
  );
  return result.affectedRows;
}

module.exports = { findById, bookAppointment, cancel };
