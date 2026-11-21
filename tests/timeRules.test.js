const { validateAppointmentTime } = require('../src/utils/timeRules');

const NOW = new Date(2026, 10, 21, 12, 0, 0);

describe('validateAppointmentTime', () => {
  test('accepts a future slot on the hour inside working hours', () => {
    const result = validateAppointmentTime('2026-12-02 09:00', NOW);

    expect(result.ok).toBe(true);
    expect(result.sqlDatetime).toBe('2026-12-02 09:00:00');
    expect(result.day).toBe('2026-12-02');
  });

  test('accepts 16:30 because it is the last slot that ends by 17:00', () => {
    const result = validateAppointmentTime('2026-12-02 16:30', NOW);

    expect(result.ok).toBe(true);
  });

  test('rejects 17:00 exactly because the appointment would end after closing', () => {
    const result = validateAppointmentTime('2026-12-02 17:00', NOW);

    expect(result.ok).toBe(false);
    expect(result.statusCode).toBe(422);
  });

  test('rejects 08:30 because the clinic opens at 09:00', () => {
    const result = validateAppointmentTime('2026-12-02 08:30', NOW);

    expect(result.ok).toBe(false);
    expect(result.statusCode).toBe(422);
  });

  test('rejects 09:15 because it is not on a 30-minute boundary', () => {
    const result = validateAppointmentTime('2026-12-02 09:15', NOW);

    expect(result.ok).toBe(false);
    expect(result.statusCode).toBe(422);
  });

  test('rejects a time in the past', () => {
    const result = validateAppointmentTime('2026-11-20 10:00', NOW);

    expect(result.ok).toBe(false);
    expect(result.statusCode).toBe(422);
  });

  test('rejects a date that does not exist, like 30 February', () => {
    const result = validateAppointmentTime('2026-02-30 10:00', NOW);

    expect(result.ok).toBe(false);
    expect(result.statusCode).toBe(400);
  });

  test('rejects text that is not a date at all', () => {
    const result = validateAppointmentTime('tomorrow morning', NOW);

    expect(result.ok).toBe(false);
    expect(result.statusCode).toBe(400);
  });
});
