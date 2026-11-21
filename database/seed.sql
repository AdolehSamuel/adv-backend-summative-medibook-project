USE medibook;

INSERT INTO patients (id, full_name, email, phone) VALUES
  (1, 'Ama Mensah', 'ama@mail.com', '0244-111-222'),
  (2, 'Kojo Owusu', 'kojo@mail.com', '0555-333-444'),
  (3, 'Efua Asare', 'efua@mail.com', '0201-555-666'),
  (4, 'Yaw Darko', 'yaw@mail.com', '0277-777-888'),
  (5, 'Akosua Frimpong', 'akosua@mail.com', '0245-999-000'),
  (6, 'Kwame Appiah', 'kwame@mail.com', '0503-121-314');

INSERT INTO doctors (id, full_name, specialty, consultation_fee, room) VALUES
  (1, 'Dr. Boateng', 'Dermatology', 150.00, 'R-12'),
  (2, 'Dr. Adjei', 'Paediatrics', 100.00, 'R-03'),
  (3, 'Dr. Asante', 'General Practice', 80.00, 'R-07');

INSERT INTO appointments
  (patient_id, doctor_id, appointment_datetime, amount_paid, booked_at)
VALUES
  (1, 1, '2026-08-10 09:00:00', 150.00, '2026-07-01 10:00:00'),
  (2, 1, '2026-08-10 09:30:00', 120.00, '2026-07-02 10:00:00'),
  (1, 2, '2026-08-15 10:00:00', 100.00, '2026-07-03 10:00:00');

INSERT INTO appointments
  (patient_id, doctor_id, appointment_datetime, amount_paid, booked_at)
VALUES
  (1, 1, '2026-12-02 09:00:00', 150.00, '2026-11-10 08:00:00'),
  (2, 1, '2026-12-02 09:30:00', 150.00, '2026-11-10 08:05:00'),
  (3, 1, '2026-12-02 10:00:00', 150.00, '2026-11-10 08:10:00'),
  (4, 1, '2026-12-02 10:30:00', 150.00, '2026-11-10 08:15:00'),
  (5, 1, '2026-12-02 11:00:00', 150.00, '2026-11-10 08:20:00'),
  (6, 1, '2026-12-02 11:30:00', 150.00, '2026-11-10 08:25:00'),
  (1, 1, '2026-12-02 13:00:00', 150.00, '2026-11-10 08:30:00'),
  (2, 1, '2026-12-02 13:30:00', 150.00, '2026-11-10 08:35:00'),
  (3, 1, '2026-12-02 14:00:00', 150.00, '2026-11-10 08:40:00'),
  (4, 1, '2026-12-02 14:30:00', 150.00, '2026-11-10 08:45:00'),
  (5, 1, '2026-12-02 15:00:00', 150.00, '2026-11-10 08:50:00');

INSERT INTO appointments
  (patient_id, doctor_id, appointment_datetime, amount_paid, booked_at)
VALUES
  (3, 2, '2026-12-03 09:00:00', 100.00, '2026-11-11 09:00:00'),
  (4, 2, '2026-12-03 09:30:00', 100.00, '2026-11-11 09:05:00');

INSERT INTO appointments
  (patient_id, doctor_id, appointment_datetime, amount_paid, status, booked_at, cancelled_at, refund_amount)
VALUES
  (6, 2, '2026-12-03 10:00:00', 100.00, 'cancelled', '2026-11-11 09:10:00', '2026-11-12 12:00:00', 100.00);
