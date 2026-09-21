import { z } from 'zod';
import type {
  CreateHabitRequest as ContractCreateHabitRequest,
  UpdateHabitGoalsRequest as ContractUpdateHabitGoalsRequest,
  UpdateHabitRequest as ContractUpdateHabitRequest,
} from '@habit-shaper/contracts/request';
import { calendarDateSchema } from '../../../../common/calendar-date.js';
import { HabitKind } from '../../habit.enum.js';

export const habitIdParamsSchema = z.strictObject({ habitId: z.string().uuid() });

const newGoalSchema = z.strictObject({
  title: z.string().trim().min(1).max(191),
  targetDays: z.number().int().min(1).max(100000),
  deadline: calendarDateSchema.nullable().optional(),
});

export const createHabitRequestSchema = z.strictObject({
  name: z.string().trim().min(1).max(191),
  description: z.string().trim().max(5000).nullable().optional(),
  type: z.enum(HabitKind),
  startDate: calendarDateSchema.optional(),
  goalIds: z.array(z.string().uuid()).max(100).optional(),
  newGoals: z.array(newGoalSchema).max(100).optional(),
});

export const updateHabitRequestSchema = z
  .strictObject({
    name: z.string().trim().min(1).max(191).optional(),
    description: z.string().trim().max(5000).nullable().optional(),
    type: z.enum(HabitKind).optional(),
    startDate: calendarDateSchema.optional(),
  })
  .refine((value) => Object.keys(value).length > 0, 'At least one field is required');

export const updateHabitGoalsRequestSchema = z.strictObject({
  goalIds: z.array(z.string().uuid()).max(100),
  newGoals: z.array(newGoalSchema).max(100).default([]),
});

export type CreateHabitRequest = ContractCreateHabitRequest;
export type UpdateHabitRequest = ContractUpdateHabitRequest;
export type UpdateHabitGoalsRequest = ContractUpdateHabitGoalsRequest;
