const pool = require('../config/database');

async function getDoctorsReport() {
  const [rows] = await pool.query(
    `SELECT
       d.id AS doctor_id,
       d.full_name AS doctor_name,
       d.specialty,
       COUNT(a.id) AS total_appointments,
       COALESCE(SUM(a.status = 'booked'), 0) AS booked_appointments,
       COALESCE(SUM(a.status = 'cancelled'), 0) AS cancelled_appointments,
       COALESCE(SUM(a.amount_paid - COALESCE(a.refund_amount, 0)), 0) AS revenue_collected
     FROM doctors d
     LEFT JOIN appointments a ON a.doctor_id = d.id
     GROUP BY d.id, d.full_name, d.specialty
     ORDER BY revenue_collected DESC, d.id`
  );
  return rows;
}

async function getBusyDaysReport(dailyCap, thresholdPercent) {
  const [rows] = await pool.query(
    `SELECT
       d.id AS doctor_id,
       d.full_name AS doctor_name,
       DATE(a.appointment_datetime) AS day,
       COUNT(*) AS booked_appointments,
       ROUND(COUNT(*) / ? * 100, 1) AS utilization_percent
     FROM appointments a
     JOIN doctors d ON d.id = a.doctor_id
     WHERE a.status = 'booked'
     GROUP BY d.id, d.full_name, DATE(a.appointment_datetime)
     HAVING COUNT(*) > ? * ? / 100
     ORDER BY day, d.id`,
    [dailyCap, dailyCap, thresholdPercent]
  );
  return rows;
}

module.exports = { getDoctorsReport, getBusyDaysReport };
