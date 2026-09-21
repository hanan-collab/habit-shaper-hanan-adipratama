import { z } from 'zod';

export const calendarDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected YYYY-MM-DD')
  .refine((value) => {
    const parsed = new Date(`${value}T00:00:00.000Z`);
    return !Number.isNaN(parsed.getTime()) && toCalendarDate(parsed) === value;
  }, 'Date is invalid');

export const toCalendarDate = (date: Date) => date.toISOString().slice(0, 10);
export const fromCalendarDate = (value: string) => new Date(`${value}T00:00:00.000Z`);

export function todayInTimezone(timezone: string, now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${value.year}-${value.month}-${value.day}`;
}
