const pool = require('../config/database');

async function findAll() {
  const [rows] = await pool.query(
    'SELECT id, full_name, specialty, consultation_fee, room, created_at FROM doctors ORDER BY id'
  );
  return rows;
}

async function findById(id) {
  const [rows] = await pool.query(
    'SELECT id, full_name, specialty, consultation_fee, room, created_at FROM doctors WHERE id = ?',
    [id]
  );
  return rows[0];
}

async function create(doctor) {
  const [result] = await pool.query(
    'INSERT INTO doctors (full_name, specialty, consultation_fee, room) VALUES (?, ?, ?, ?)',
    [doctor.full_name, doctor.specialty, doctor.consultation_fee, doctor.room]
  );
  return result.insertId;
}

async function update(id, doctor) {
  const [result] = await pool.query(
    'UPDATE doctors SET full_name = ?, specialty = ?, consultation_fee = ?, room = ? WHERE id = ?',
    [doctor.full_name, doctor.specialty, doctor.consultation_fee, doctor.room, id]
  );
  return result.affectedRows;
}

async function remove(id) {
  const [result] = await pool.query('DELETE FROM doctors WHERE id = ?', [id]);
  return result.affectedRows;
}

async function getSummaryStats(id, daysAhead, dailyCap) {
  const [rows] = await pool.query(
    `SELECT
       d.id AS doctor_id,
       d.full_name AS doctor_name,
       COALESCE(SUM(a.amount_paid - COALESCE(a.refund_amount, 0)), 0) AS revenue_collected,
       COALESCE(SUM(a.status = 'booked' AND a.appointment_datetime > NOW()), 0) AS upcoming_appointments,
       ROUND(
         COALESCE(SUM(
           a.status = 'booked'
           AND DATE(a.appointment_datetime) BETWEEN CURDATE() AND CURDATE() + INTERVAL ? DAY
         ), 0) / (? * ?) * 100,
         1
       ) AS utilization_percent_next_days
     FROM doctors d
     LEFT JOIN appointments a ON a.doctor_id = d.id
     WHERE d.id = ?
     GROUP BY d.id, d.full_name`,
    [daysAhead - 1, dailyCap, daysAhead, id]
  );
  return rows[0];
}

async function getDailyCounts(id, daysAhead, dailyCap) {
  const [rows] = await pool.query(
    `WITH RECURSIVE next_days AS (
       SELECT CURDATE() AS day, 1 AS day_number
       UNION ALL
       SELECT day + INTERVAL 1 DAY, day_number + 1
       FROM next_days
       WHERE day_number < ?
     )
     SELECT
       next_days.day,
       COUNT(a.id) AS appointments,
       ROUND(COUNT(a.id) / ? * 100, 1) AS utilization_percent
     FROM next_days
     LEFT JOIN appointments a
       ON a.doctor_id = ?
       AND a.status = 'booked'
       AND DATE(a.appointment_datetime) = next_days.day
     GROUP BY next_days.day
     ORDER BY next_days.day`,
    [daysAhead, dailyCap, id]
  );
  return rows;
}

module.exports = {
  findAll,
  findById,
  create,
  update,
  remove,
  getSummaryStats,
  getDailyCounts,
};
