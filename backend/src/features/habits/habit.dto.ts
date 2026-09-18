import { z } from 'zod';
import { HabitKind } from './habit.enum.js';

const dateOnly = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected YYYY-MM-DD').refine((value) => {
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}, 'Date is invalid');

export const habitIdParamsDto = z.strictObject({ habitId: z.string().uuid() });
export const habitEventParamsDto = habitIdParamsDto.extend({ date: dateOnly });
export const createHabitDto = z.strictObject({
  name: z.string().trim().min(1).max(191),
  description: z.string().trim().max(5000).nullable().optional(),
  type: z.enum(HabitKind),
  startDate: dateOnly,
});
export const updateHabitDto = z.strictObject({
  name: z.string().trim().min(1).max(191).optional(),
  description: z.string().trim().max(5000).nullable().optional(),
  type: z.enum(HabitKind).optional(),
  startDate: dateOnly.optional(),
}).refine((value) => Object.keys(value).length > 0, 'At least one field is required');
export const habitEventDto = z.strictObject({ note: z.string().trim().max(2000).nullable().optional() });

export type CreateHabitDto = z.infer<typeof createHabitDto>;
export type UpdateHabitDto = z.infer<typeof updateHabitDto>;
export type HabitEventDto = z.infer<typeof habitEventDto>;
export type HabitEventParamsDto = z.infer<typeof habitEventParamsDto>;

export function toDateOnly(value: string) { return new Date(`${value}T00:00:00.000Z`); }
