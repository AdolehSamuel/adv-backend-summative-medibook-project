# MediBook: Clinic Appointment System

Backend for a community clinic's appointment booking system, built with Node.js, Express, MySQL and Redis.

**Video walkthrough:** PASTE_YOUR_VIDEO_LINK_HERE

**Schema diagram:** [schema-diagram.png](schema-diagram.png)

## Requirements

- Node.js 18 or newer
- MySQL 8.0.16 or newer (CHECK constraints need 8.0.16+)
- Redis 6 or newer

## Setup

1. Clone the repository and install packages:

   ```
   git clone https://github.com/AdolehSamuel/adv-backend-summative-medibook-project.git
   cd adv-backend-summative-medibook-project
   npm install
   ```

2. Create your environment file and fill in your MySQL password:

   ```
   cp .env.example .env
   ```

3. Create the database and load the sample data:

   ```
   mysql -u root -p < database/schema.sql
   mysql -u root -p < database/seed.sql
   ```

4. Start Redis (in its own terminal):

   ```
   redis-server
   ```

5. Start the API (in its own terminal):

   ```
   npm start
   ```

6. Start the worker (in its own terminal):

   ```
   npm run worker
   ```

7. Run the unit tests (no MySQL or Redis needed):

   ```
   npm test
   ```

The API runs on http://localhost:3000 by default.

## Project structure

```
database/      schema.sql and seed.sql
locales/       en.json and fr.json for the feedback page
src/
  config/      database, Redis and business constants
  models/      all SQL lives here
  controllers/ business logic, calls models
  routes/      URLs and HTTP methods
  middleware/  404 handler and central error handler
  services/    Redis queue helpers
  utils/       time rules, refund calculator, validation, audit logger
  views/       feedback page HTML
  worker.js    separate worker process
tests/         Jest unit tests
logs/          audit.log (created automatically, not committed)
```

## API endpoints

### Patients

| Method | URL | Description |
|---|---|---|
| GET | /patients | List all patients |
| GET | /patients/:id | Get one patient |
| POST | /patients | Create a patient |
| PUT | /patients/:id | Replace a patient's details |
| DELETE | /patients/:id | Delete a patient (409 if they have appointments) |

Body for POST and PUT:

```json
{ "full_name": "Ama Mensah", "email": "ama@mail.com", "phone": "0244-111-222" }
```

### Doctors

| Method | URL | Description |
|---|---|---|
| GET | /doctors | List all doctors |
| GET | /doctors/:id | Get one doctor |
| POST | /doctors | Create a doctor |
| PUT | /doctors/:id | Replace a doctor's details |
| DELETE | /doctors/:id | Delete a doctor (409 if they have appointments) |
| GET | /doctors/:id/stats | Revenue, upcoming count, next 7 days and utilization |

Body for POST and PUT:

```json
{ "full_name": "Dr. Boateng", "specialty": "Dermatology", "consultation_fee": 150.00, "room": "R-12" }
```

### Appointments

| Method | URL | Description |
|---|---|---|
| POST | /appointments | Book an appointment |
| GET | /appointments/:id | Get one appointment |
| PATCH | /appointments/:id/cancel | Cancel an appointment and get the refund |

Body for booking:

```json
{ "patient_id": 1, "doctor_id": 1, "appointment_datetime": "2026-12-02 15:30" }
```

If the slot or the doctor's day is full, the API returns 409 with a waitlist offer. Send the same body with `"join_waitlist": true` to join the waitlist (202).

### Reports

| Method | URL | Description |
|---|---|---|
| GET | /reports/doctors | Every doctor's total appointments and revenue, including doctors with none |
| GET | /reports/busy-days | Every doctor and date with more than 80% of the 12 daily slots booked |

### Feedback page

| Method | URL | Description |
|---|---|---|
| GET | /feedback | Course feedback form in English |
| GET | /feedback?lang=fr | The same form in French (unsupported languages fall back to English) |

### Status codes

| Code | Meaning |
|---|---|
| 200 | Success |
| 201 | Created |
| 202 | Added to the waitlist |
| 204 | Deleted |
| 400 | Invalid input (for example a malformed date or missing field) |
| 404 | Patient, doctor, appointment or route not found |
| 409 | Conflict (slot taken, day full, duplicate email, already cancelled, delete blocked) |
| 422 | Valid input that breaks a business rule (past time, outside working hours, off the 30-minute boundary) |
| 503 | Waitlist unavailable because Redis is down |

## Refund policy

| Notice before the appointment | Refund |
|---|---|
| More than 48 hours | 100% |
| From 24 hours up to and including 48 hours | 50% |
| Less than 24 hours | 0% |

Boundaries: exactly 48 hours gives 50%, and exactly 24 hours gives 50%. The refund is always computed on the server.

## Design justifications

> WRITE THESE IN YOUR OWN WORDS before submitting. Delete this note when done.

### Part C: Booking and cancellation

<!-- Explain: how you stop two patients getting the same slot at the same instant
(doctor row lock plus the UNIQUE index on doctor_id and active_slot), how the
12-per-day cap is kept safe, why the refund is computed on the server, how the
cancellation and refund are saved together, and how a cancelled slot becomes
bookable again while the record is kept. -->

### Part D: Audit log

<!-- Explain: why you used fs/promises (async, non-blocking), how the logs folder
is created, and why a logging failure never breaks the user's request. -->

### Part E: Queues and Redis

<!-- Explain: how the waitlist works (one Redis list per doctor per day), why the
worker is a separate process, what happens if the promoted booking fails (the
patient is only removed after a successful booking), and how confirmation jobs
are processed. -->
