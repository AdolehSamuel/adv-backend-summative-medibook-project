function isTextWithin(value, maxLength) {
  if (typeof value !== 'string') {
    return false;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 && trimmed.length <= maxLength;
}

function isValidEmail(value) {
  if (!isTextWithin(value, 255)) {
    return false;
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailPattern.test(value.trim());
}

function isValidMoney(value) {
  const isNumber = typeof value === 'number' && Number.isFinite(value);
  if (!isNumber || value < 0) {
    return false;
  }

  const valueInCents = value * 100;
  const hasAtMostTwoDecimals = Math.abs(valueInCents - Math.round(valueInCents)) < 0.000001;
  return hasAtMostTwoDecimals;
}

function isPositiveInteger(value) {
  const number = Number(value);
  return Number.isInteger(number) && number > 0;
}

function validatePatient(body) {
  const errors = [];

  if (!isTextWithin(body.full_name, 100)) {
    errors.push('full_name is required and must be at most 100 characters');
  }
  if (!isValidEmail(body.email)) {
    errors.push('email must be a valid email address');
  }
  if (!isTextWithin(body.phone, 20)) {
    errors.push('phone is required and must be at most 20 characters');
  }

  return errors;
}

function validateDoctor(body) {
  const errors = [];

  if (!isTextWithin(body.full_name, 100)) {
    errors.push('full_name is required and must be at most 100 characters');
  }
  if (!isTextWithin(body.specialty, 100)) {
    errors.push('specialty is required and must be at most 100 characters');
  }
  if (!isValidMoney(body.consultation_fee)) {
    errors.push('consultation_fee must be a number of 0 or more with at most 2 decimals');
  }
  if (!isTextWithin(body.room, 10)) {
    errors.push('room is required and must be at most 10 characters');
  }

  return errors;
}

module.exports = {
  isTextWithin,
  isValidEmail,
  isValidMoney,
  isPositiveInteger,
  validatePatient,
  validateDoctor,
};
