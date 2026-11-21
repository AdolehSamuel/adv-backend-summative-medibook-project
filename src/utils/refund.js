const {
  FULL_REFUND_ABOVE_HOURS,
  HALF_REFUND_FROM_HOURS,
  HALF_REFUND_PERCENT,
} = require('../config/constants');

const MILLISECONDS_PER_HOUR = 60 * 60 * 1000;

function pickRefundPercent(hoursOfNotice) {
  if (hoursOfNotice > FULL_REFUND_ABOVE_HOURS) {
    return 100;
  }
  if (hoursOfNotice >= HALF_REFUND_FROM_HOURS) {
    return HALF_REFUND_PERCENT;
  }
  return 0;
}

function calculateRefund(amountPaid, appointmentDate, cancelDate) {
  const millisecondsOfNotice = appointmentDate.getTime() - cancelDate.getTime();
  const hoursOfNotice = millisecondsOfNotice / MILLISECONDS_PER_HOUR;

  const refundPercent = pickRefundPercent(hoursOfNotice);

  const paidInCents = Math.round(amountPaid * 100);
  const refundInCents = Math.round((paidInCents * refundPercent) / 100);
  const refundAmount = refundInCents / 100;

  return { hoursOfNotice, refundPercent, refundAmount };
}

module.exports = { calculateRefund, pickRefundPercent };
