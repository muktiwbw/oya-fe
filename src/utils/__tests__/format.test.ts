import { describe, expect, it } from 'vitest';
import { getTaskAgeLabel, truncateDescription } from '../format';

describe('truncateDescription', () => {
  it('returns empty string when description is empty', () => {
    expect(truncateDescription('')).toBe('');
  });

  it('returns original string when length is less than or equal to 50 characters', () => {
    const exact50 = 'a'.repeat(50);
    expect(truncateDescription('Short description')).toBe('Short description');
    expect(truncateDescription(exact50)).toBe(exact50);
  });

  it('truncates to 50 characters followed by ... when length exceeds 50 characters', () => {
    const fiftyOneChars = '12345678901234567890123456789012345678901234567890X';
    expect(truncateDescription(fiftyOneChars)).toBe(
      '12345678901234567890123456789012345678901234567890...',
    );
  });
});

describe('getTaskAgeLabel (24-hour intervals)', () => {
  const HOUR_MS = 60 * 60 * 1000;
  // Reference time: Oct 20, 2026 at 01:30 AM local time (crosses midnight when looking back > 1.5h)
  const referenceNow = new Date(2026, 9, 20, 1, 30, 0);

  it('returns "new" when created within the last 24 hours (< 24h), even across midnight', () => {
    const fiveHoursAgoYesterday = new Date(
      referenceNow.getTime() - 5 * HOUR_MS,
    ).toISOString();
    const almost24HoursAgo = new Date(
      referenceNow.getTime() - (24 * HOUR_MS - 1000),
    ).toISOString();

    expect(getTaskAgeLabel(fiveHoursAgoYesterday, referenceNow)).toBe('new');
    expect(getTaskAgeLabel(almost24HoursAgo, referenceNow)).toBe('new');
  });

  it('returns "1 day" when created between 24 hours and < 48 hours ago', () => {
    const exact24HoursAgo = new Date(
      referenceNow.getTime() - 24 * HOUR_MS,
    ).toISOString();
    const almost48HoursAgo = new Date(
      referenceNow.getTime() - (48 * HOUR_MS - 1000),
    ).toISOString();

    expect(getTaskAgeLabel(exact24HoursAgo, referenceNow)).toBe('1 day');
    expect(getTaskAgeLabel(almost48HoursAgo, referenceNow)).toBe('1 day');
  });

  it('returns "2 days" when created between 48 hours and < 72 hours ago', () => {
    const exact48HoursAgo = new Date(
      referenceNow.getTime() - 48 * HOUR_MS,
    ).toISOString();
    const almost72HoursAgo = new Date(
      referenceNow.getTime() - (72 * HOUR_MS - 1000),
    ).toISOString();

    expect(getTaskAgeLabel(exact48HoursAgo, referenceNow)).toBe('2 days');
    expect(getTaskAgeLabel(almost72HoursAgo, referenceNow)).toBe('2 days');
  });

  it('returns "3 days" when created between 72 hours and < 96 hours ago', () => {
    const exact72HoursAgo = new Date(
      referenceNow.getTime() - 72 * HOUR_MS,
    ).toISOString();
    const almost96HoursAgo = new Date(
      referenceNow.getTime() - (96 * HOUR_MS - 1000),
    ).toISOString();

    expect(getTaskAgeLabel(exact72HoursAgo, referenceNow)).toBe('3 days');
    expect(getTaskAgeLabel(almost96HoursAgo, referenceNow)).toBe('3 days');
  });

  it('returns ">3 days" when created 96 hours (4 * 24h) or more ago', () => {
    const exact96HoursAgo = new Date(
      referenceNow.getTime() - 96 * HOUR_MS,
    ).toISOString();
    const tenDaysAgo = new Date(
      referenceNow.getTime() - 240 * HOUR_MS,
    ).toISOString();

    expect(getTaskAgeLabel(exact96HoursAgo, referenceNow)).toBe('>3 days');
    expect(getTaskAgeLabel(tenDaysAgo, referenceNow)).toBe('>3 days');
  });
});
