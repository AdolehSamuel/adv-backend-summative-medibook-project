const { OPENING_HOUR, CLOSING_HOUR, SLOT_MINUTES } = require('../config/constants');

function padTwoDigits(number) {
  return String(number).padStart(2, '0');
}

function minutesToClock(totalMinutes) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${padTwoDigits(hours)}:${padTwoDigits(minutes)}`;
}

function formatSqlDatetime(date) {
  const year = date.getFullYear();
  const month = padTwoDigits(date.getMonth() + 1);
  const day = padTwoDigits(date.getDate());
  const hours = padTwoDigits(date.getHours());
  const minutes = padTwoDigits(date.getMinutes());
  const seconds = padTwoDigits(date.getSeconds());
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

function parseDatetimeText(text) {
  if (typeof text !== 'string') {
    return null;
  }

  const pattern = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?$/;
  const match = text.trim().match(pattern);
  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hours = Number(match[4]);
  const minutes = Number(match[5]);
  const seconds = Number(match[6] || 0);

  const date = new Date(year, month - 1, day, hours, minutes, seconds);

  const isRealDate =
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day &&
    date.getHours() === hours &&
    date.getMinutes() === minutes;

  if (!isRealDate) {
    return null;
  }
  return date;
}

function validateAppointmentTime(text, now) {
  const slotDate = parseDatetimeText(text);
  if (!slotDate) {
    return {
      ok: false,
      statusCode: 400,
      message: 'appointment_datetime must look like YYYY-MM-DD HH:MM, for example 2026-12-02 15:30',
    };
  }

  if (slotDate <= now) {
    return { ok: false, statusCode: 422, message: 'Appointments can only be booked in the future' };
  }

  const isOnSlotBoundary = slotDate.getMinutes() % SLOT_MINUTES === 0 && slotDate.getSeconds() === 0;
  if (!isOnSlotBoundary) {
    return {
      ok: false,
      statusCode: 422,
      message: `Appointments must start on a ${SLOT_MINUTES}-minute boundary, for example 10:00 or 10:30`,
    };
  }

  const minuteOfDay = slotDate.getHours() * 60 + slotDate.getMinutes();
  const openingMinute = OPENING_HOUR * 60;
  const lastSlotStartMinute = CLOSING_HOUR * 60 - SLOT_MINUTES;
  const isInWorkingHours = minuteOfDay >= openingMinute && minuteOfDay <= lastSlotStartMinute;

  if (!isInWorkingHours) {
    const firstSlot = minutesToClock(openingMinute);
    const lastSlot = minutesToClock(lastSlotStartMinute);
    const closingTime = minutesToClock(CLOSING_HOUR * 60);
    return {
      ok: false,
      statusCode: 422,
      message: `Appointments must start between ${firstSlot} and ${lastSlot} so they finish by ${closingTime}`,
    };
  }

  const sqlDatetime = formatSqlDatetime(slotDate);
  const day = sqlDatetime.slice(0, 10);
  return { ok: true, sqlDatetime, day };
}

module.exports = {
  formatSqlDatetime,
  parseDatetimeText,
  validateAppointmentTime,
};
