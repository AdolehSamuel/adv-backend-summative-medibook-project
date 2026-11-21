const { calculateRefund } = require('../src/utils/refund');

const APPOINTMENT = new Date(2026, 11, 10, 10, 0, 0);
const AMOUNT_PAID = 150;

function hoursBefore(date, hours) {
  return new Date(date.getTime() - hours * 60 * 60 * 1000);
}

describe('calculateRefund', () => {
  test('gives 100% when cancelled more than 48 hours before', () => {
    const cancelDate = hoursBefore(APPOINTMENT, 72);
    const refund = calculateRefund(AMOUNT_PAID, APPOINTMENT, cancelDate);

    expect(refund.refundPercent).toBe(100);
    expect(refund.refundAmount).toBe(150);
  });

  test('gives 50% at exactly 48 hours, because 100% needs MORE than 48 hours', () => {
    const cancelDate = hoursBefore(APPOINTMENT, 48);
    const refund = calculateRefund(AMOUNT_PAID, APPOINTMENT, cancelDate);

    expect(refund.refundPercent).toBe(50);
    expect(refund.refundAmount).toBe(75);
  });

  test('gives 50% between 24 and 48 hours', () => {
    const cancelDate = hoursBefore(APPOINTMENT, 30);
    const refund = calculateRefund(AMOUNT_PAID, APPOINTMENT, cancelDate);

    expect(refund.refundPercent).toBe(50);
    expect(refund.refundAmount).toBe(75);
  });

  test('gives 50% at exactly 24 hours, because the 50% tier includes 24 hours', () => {
    const cancelDate = hoursBefore(APPOINTMENT, 24);
    const refund = calculateRefund(AMOUNT_PAID, APPOINTMENT, cancelDate);

    expect(refund.refundPercent).toBe(50);
    expect(refund.refundAmount).toBe(75);
  });

  test('gives 0% when cancelled less than 24 hours before', () => {
    const oneMinuteUnder24Hours = 24 - 1 / 60;
    const cancelDate = hoursBefore(APPOINTMENT, oneMinuteUnder24Hours);
    const refund = calculateRefund(AMOUNT_PAID, APPOINTMENT, cancelDate);

    expect(refund.refundPercent).toBe(0);
    expect(refund.refundAmount).toBe(0);
  });

  test('rounds a half refund to whole cents', () => {
    const cancelDate = hoursBefore(APPOINTMENT, 30);
    const refund = calculateRefund(99.99, APPOINTMENT, cancelDate);

    expect(refund.refundAmount).toBe(50);
  });
});
