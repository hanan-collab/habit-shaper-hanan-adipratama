import { z } from 'zod';

const dateOnly = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected YYYY-MM-DD').refine((value) => {
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}, 'Date is invalid');

export const trackingParamsDto = z.strictObject({ habitId: z.string().uuid(), date: dateOnly });
export const trackingEventDto = z.strictObject({ note: z.string().trim().max(2000).nullable().optional() });

export type TrackingEventDto = z.infer<typeof trackingEventDto>;
export const trackingDate = (value: string) => new Date(`${value}T00:00:00.000Z`);
