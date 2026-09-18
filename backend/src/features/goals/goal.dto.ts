import { z } from 'zod';

const dateOnly = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected YYYY-MM-DD').refine((value) => {
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}, 'Date is invalid');

export const goalIdParamsDto = z.strictObject({ goalId: z.string().uuid() });
export const habitGoalParamsDto = z.strictObject({ habitId: z.string().uuid() });
export const createGoalDto = z.strictObject({
  title: z.string().trim().min(1).max(191),
  targetStreakDays: z.number().int().min(1).max(100000),
  deadline: dateOnly.nullable().optional(),
});
export const updateGoalDto = z.strictObject({
  title: z.string().trim().min(1).max(191).optional(),
  targetStreakDays: z.number().int().min(1).max(100000).optional(),
  deadline: dateOnly.nullable().optional(),
}).refine((value) => Object.keys(value).length > 0, 'At least one field is required');

export type CreateGoalDto = z.infer<typeof createGoalDto>;
export type UpdateGoalDto = z.infer<typeof updateGoalDto>;
export const goalDate = (value: string) => new Date(`${value}T00:00:00.000Z`);
