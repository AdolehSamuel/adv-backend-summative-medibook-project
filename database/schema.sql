DROP DATABASE IF EXISTS medibook;
CREATE DATABASE medibook;
USE medibook;

CREATE TABLE patients (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  phone VARCHAR(20) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE doctors (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(100) NOT NULL,
  specialty VARCHAR(100) NOT NULL,
  consultation_fee DECIMAL(10, 2) NOT NULL,
  room VARCHAR(10) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT chk_doctor_fee_not_negative CHECK (consultation_fee >= 0)
);

CREATE TABLE appointments (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  patient_id INT UNSIGNED NOT NULL,
  doctor_id INT UNSIGNED NOT NULL,
  appointment_datetime DATETIME NOT NULL,
  amount_paid DECIMAL(10, 2) NOT NULL,
  status ENUM('booked', 'cancelled') NOT NULL DEFAULT 'booked',
  booked_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  cancelled_at DATETIME NULL,
  refund_amount DECIMAL(10, 2) NULL,
  active_slot DATETIME GENERATED ALWAYS AS (
    IF(status = 'booked', appointment_datetime, NULL)
  ) STORED,

  CONSTRAINT fk_appointment_patient
    FOREIGN KEY (patient_id) REFERENCES patients (id)
    ON DELETE RESTRICT,

  CONSTRAINT fk_appointment_doctor
    FOREIGN KEY (doctor_id) REFERENCES doctors (id)
    ON DELETE RESTRICT,

  CONSTRAINT uq_doctor_active_slot UNIQUE (doctor_id, active_slot),

  CONSTRAINT chk_slot_on_half_hour CHECK (
    MINUTE(appointment_datetime) IN (0, 30)
    AND SECOND(appointment_datetime) = 0
  ),

  CONSTRAINT chk_slot_in_working_hours CHECK (
    TIME(appointment_datetime) BETWEEN '09:00:00' AND '16:30:00'
  ),

  CONSTRAINT chk_amount_paid_not_negative CHECK (amount_paid >= 0),

  CONSTRAINT chk_refund_in_range CHECK (
    refund_amount IS NULL
    OR (refund_amount >= 0 AND refund_amount <= amount_paid)
  ),

  CONSTRAINT chk_cancel_fields_match_status CHECK (
    (status = 'booked' AND cancelled_at IS NULL AND refund_amount IS NULL)
    OR (status = 'cancelled' AND cancelled_at IS NOT NULL AND refund_amount IS NOT NULL)
  ),

  INDEX idx_doctor_datetime (doctor_id, appointment_datetime)
);
