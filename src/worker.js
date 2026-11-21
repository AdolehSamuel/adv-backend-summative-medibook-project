require('dotenv').config();
const { createRedisClient } = require('./config/redis');
const queue = require('./services/queue');
const appointmentModel = require('./models/appointmentModel');
const { writeAuditLog } = require('./utils/auditLogger');
const {
  DAILY_APPOINTMENT_CAP,
  SLOT_FREED_QUEUE,
  NOTIFICATION_QUEUE,
  WORKER_RETRY_DELAY_MS,
} = require('./config/constants');

const listeningClient = createRedisClient();

function wait(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function promoteFromWaitlist(job) {
  const day = job.appointment_datetime.slice(0, 10);
  const waitingPatient = await queue.peekFirstInWaitlist(job.doctor_id, day);

  if (!waitingPatient) {
    console.log(`Nobody is waiting for doctor ${job.doctor_id} on ${day}`);
    return;
  }

  const result = await appointmentModel.bookAppointment({
    patientId: waitingPatient.patient_id,
    doctorId: job.doctor_id,
    appointmentDatetime: job.appointment_datetime,
    day,
    dailyCap: DAILY_APPOINTMENT_CAP,
  });

  if (result.status === 'booked') {
    await queue.removeFirstFromWaitlist(job.doctor_id, day);

    await writeAuditLog({
      event: 'appointment_booked',
      source: 'waitlist',
      appointment_id: result.appointmentId,
      patient_id: waitingPatient.patient_id,
      doctor_id: job.doctor_id,
      appointment_datetime: job.appointment_datetime,
      amount_paid: result.amountPaid,
    });

    await queue.addConfirmationJob({
      appointment_id: result.appointmentId,
      patient_id: waitingPatient.patient_id,
      doctor_id: job.doctor_id,
      appointment_datetime: job.appointment_datetime,
    });

    console.log(`Promoted patient ${waitingPatient.patient_id} into appointment ${result.appointmentId}`);
    return;
  }

  if (result.status === 'patient_not_found') {
    await queue.removeFirstFromWaitlist(job.doctor_id, day);
    console.log(`Removed patient ${waitingPatient.patient_id} from the waitlist because they no longer exist`);
    return;
  }

  console.log(
    `Could not promote patient ${waitingPatient.patient_id} (${result.status}). They stay first in the waitlist.`
  );
}

async function sendConfirmation(job) {
  const message =
    `Hello patient ${job.patient_id}, your appointment #${job.appointment_id} ` +
    `with doctor ${job.doctor_id} on ${job.appointment_datetime} is confirmed.`;

  await writeAuditLog({
    event: 'confirmation_sent',
    channel: 'sms/email',
    appointment_id: job.appointment_id,
    patient_id: job.patient_id,
    message,
  });

  console.log(`Confirmation written for appointment ${job.appointment_id}`);
}

async function handleJob(queueName, job) {
  if (queueName === SLOT_FREED_QUEUE) {
    await promoteFromWaitlist(job);
  } else if (queueName === NOTIFICATION_QUEUE) {
    await sendConfirmation(job);
  }
}

async function processNextJob() {
  const item = await listeningClient.blPop([SLOT_FREED_QUEUE, NOTIFICATION_QUEUE], 0);
  const job = JSON.parse(item.element);

  try {
    await handleJob(item.key, job);
  } catch (error) {
    console.error(`Job from ${item.key} failed, putting it back to retry:`, error.message);
    await wait(WORKER_RETRY_DELAY_MS);
    await queue.addJob(item.key, job);
  }
}

async function startWorker() {
  await queue.connectQueue();
  await listeningClient.connect();
  console.log('Worker connected to Redis and waiting for jobs');

  while (true) {
    try {
      await processNextJob();
    } catch (error) {
      console.error('Worker error:', error.message);
      await wait(WORKER_RETRY_DELAY_MS);
    }
  }
}

startWorker();
