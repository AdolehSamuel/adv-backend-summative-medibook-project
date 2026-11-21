const { createRedisClient } = require('../config/redis');
const {
  SLOT_FREED_QUEUE,
  NOTIFICATION_QUEUE,
  WAITLIST_KEY_PREFIX,
} = require('../config/constants');

const client = createRedisClient();

async function connectQueue() {
  await client.connect();
}

function waitlistKey(doctorId, day) {
  return `${WAITLIST_KEY_PREFIX}:doctor:${doctorId}:${day}`;
}

async function joinWaitlist(entry) {
  const key = waitlistKey(entry.doctor_id, entry.day);
  const position = await client.rPush(key, JSON.stringify(entry));
  return position;
}

async function peekFirstInWaitlist(doctorId, day) {
  const key = waitlistKey(doctorId, day);
  const entryText = await client.lIndex(key, 0);

  if (!entryText) {
    return null;
  }
  return JSON.parse(entryText);
}

async function removeFirstFromWaitlist(doctorId, day) {
  const key = waitlistKey(doctorId, day);
  await client.lPop(key);
}

async function addJob(queueName, job) {
  await client.rPush(queueName, JSON.stringify(job));
}

async function addSlotFreedJob(job) {
  await addJob(SLOT_FREED_QUEUE, job);
}

async function addConfirmationJob(job) {
  await addJob(NOTIFICATION_QUEUE, job);
}

module.exports = {
  connectQueue,
  joinWaitlist,
  peekFirstInWaitlist,
  removeFirstFromWaitlist,
  addJob,
  addSlotFreedJob,
  addConfirmationJob,
};
