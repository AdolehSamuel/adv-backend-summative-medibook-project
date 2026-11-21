const pool = require('../config/database');

async function findAll() {
  const [rows] = await pool.query(
    'SELECT id, full_name, email, phone, created_at FROM patients ORDER BY id'
  );
  return rows;
}

async function findById(id) {
  const [rows] = await pool.query(
    'SELECT id, full_name, email, phone, created_at FROM patients WHERE id = ?',
    [id]
  );
  return rows[0];
}

async function create(patient) {
  const [result] = await pool.query(
    'INSERT INTO patients (full_name, email, phone) VALUES (?, ?, ?)',
    [patient.full_name, patient.email, patient.phone]
  );
  return result.insertId;
}

async function update(id, patient) {
  const [result] = await pool.query(
    'UPDATE patients SET full_name = ?, email = ?, phone = ? WHERE id = ?',
    [patient.full_name, patient.email, patient.phone, id]
  );
  return result.affectedRows;
}

async function remove(id) {
  const [result] = await pool.query('DELETE FROM patients WHERE id = ?', [id]);
  return result.affectedRows;
}

module.exports = { findAll, findById, create, update, remove };
