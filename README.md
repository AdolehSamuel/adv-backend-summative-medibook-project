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

### Part C: Booking and cancellation

**Two patients, one slot.** Every booking runs inside a MySQL transaction that starts by locking the doctor's row with `SELECT ... FOR UPDATE`. If two requests for the same doctor arrive at the same time, the second one waits until the first has finished. As a second safety net, the `uq_doctor_active_slot` UNIQUE index on `(doctor_id, active_slot)` means MySQL itself refuses a duplicate booking, and the API turns that error into a 409.

**The 12-per-day cap.** Inside the same locked transaction, the code counts the doctor's booked appointments for that date. If there are already 12, the booking stops and the patient is offered the waitlist. Because the doctor row is locked, two requests cannot both see 11 and both insert, so the cap holds even under simultaneous requests.

**Refunds are computed on the server.** The client never sends a refund amount. The server takes the real appointment time, the real amount paid and the current time, and works out the notice period itself, so the refund cannot be faked.

**Refund boundaries.** More than 48 hours of notice gives 100%. From 24 hours up to and including 48 hours gives 50%, so exactly 48 hours and exactly 24 hours both give 50%. Less than 24 hours gives 0%. These values are defined once in `src/config/constants.js` and covered by unit tests.

**Cancellation and refund succeed or fail together.** The status, refund amount and cancel time are written in a single UPDATE on one row, so MySQL saves all of them or none of them. A CHECK constraint also makes it impossible to have a cancelled row without a refund amount. The UPDATE only matches rows that are still booked, so cancelling twice returns a 409.

**Cancelled slots become bookable again.** `active_slot` is a generated column that equals the appointment time while the status is `booked` and becomes NULL when it is `cancelled`. A UNIQUE index allows many NULLs, so the cancelled row stops blocking the slot but stays in the table as refund history.

### Part D: Audit log

The logger uses `fs/promises` (`mkdir` and `appendFile`), which are non-blocking. A `*Sync` call would freeze the whole server while it writes, making every other user's request wait. `mkdir` with `recursive: true` creates the `logs/` folder on the first run and does nothing if it already exists. Each event is written as one JSON line. The write is wrapped in try/catch, and a failure is only printed to the console, so a logging problem never fails the user's booking or cancellation. The log is a record of what happened, not part of the booking itself.

### Part E: Queues and Redis

**Waitlist.** When a slot or a doctor's whole day is full, the API returns 409 with an offer. If the patient sends the same request with `"join_waitlist": true`, they are pushed onto a Redis list for that doctor and day (`waitlist:doctor:<id>:<date>`) and the API returns 202. New patients join the end of the list, so it is first come, first served.

**Separate worker.** A cancellation pushes a "slot freed" job to Redis. The worker runs as its own process (`npm run worker`), separate from the web server, so slow or failing background jobs never slow down the API, and either process can restart without the other.

**If the promoted booking fails.** The worker first looks at the first waitlisted patient without removing them, then tries to book them using the same locked booking function as the API. The patient is removed from the waitlist only after the booking succeeds. If the booking fails, they stay first in line. If the database is unavailable, the job is put back on the queue and retried after a short delay. This way a patient can never disappear from both the queue and the appointments table.

**Confirmation jobs.** Every confirmed appointment, whether booked through the API or promoted from the waitlist, queues a confirmation job. The worker processes it by writing a `confirmation_sent` line with the message to `logs/audit.log`, which stands in for sending a real SMS or email.