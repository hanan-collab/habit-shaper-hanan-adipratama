import { z } from 'zod';
import { HabitKind } from './habit.enum.js';

const dateOnly = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected YYYY-MM-DD').refine((value) => {
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}, 'Date is invalid');

export const habitIdParamsDto = z.strictObject({ habitId: z.string().uuid() });
export const createHabitDto = z.strictObject({
  name: z.string().trim().min(1).max(191),
  description: z.string().trim().max(5000).nullable().optional(),
  type: z.enum(HabitKind),
  startDate: dateOnly.optional(),
  goalIds: z.array(z.string().uuid()).max(100).optional(),
  newGoals: z.array(z.strictObject({
    title: z.string().trim().min(1).max(191),
    targetDays: z.number().int().min(1).max(100000),
    deadline: dateOnly.nullable().optional(),
  })).max(100).optional(),
});
export const updateHabitDto = z.strictObject({
  name: z.string().trim().min(1).max(191).optional(),
  description: z.string().trim().max(5000).nullable().optional(),
  type: z.enum(HabitKind).optional(),
  startDate: dateOnly.optional(),
}).refine((value) => Object.keys(value).length > 0, 'At least one field is required');

export type CreateHabitDto = z.infer<typeof createHabitDto>;
export type UpdateHabitDto = z.infer<typeof updateHabitDto>;

export const updateHabitGoalsDto = z.strictObject({
  goalIds: z.array(z.string().uuid()).max(100),
  newGoals: createHabitDto.shape.newGoals.default([]),
});
export type UpdateHabitGoalsDto = z.infer<typeof updateHabitGoalsDto>;

export function toDateOnly(value: string) { return new Date(`${value}T00:00:00.000Z`); }
