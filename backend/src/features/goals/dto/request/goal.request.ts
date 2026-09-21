import { z } from 'zod';
import type {
  CreateGoalRequest as ContractCreateGoalRequest,
  CreateMultiGoalRequest as ContractCreateMultiGoalRequest,
  UpdateGoalRequest as ContractUpdateGoalRequest,
} from '@habit-shaper/contracts/request';
import { calendarDateSchema } from '../../../../common/calendar-date.js';

export const goalIdParamsSchema = z.strictObject({ goalId: z.string().uuid() });
export const habitGoalParamsSchema = z.strictObject({ habitId: z.string().uuid() });

const newHabitSchema = z.strictObject({
  name: z.string().trim().min(1).max(191),
  type: z.enum(['BUILD', 'BREAK']),
});

export const createGoalRequestSchema = z.strictObject({
  title: z.string().trim().min(1).max(191),
  targetDays: z.number().int().min(1).max(100000),
  deadline: calendarDateSchema.nullable().optional(),
});

export const createMultiGoalRequestSchema = createGoalRequestSchema.extend({
  habitIds: z.array(z.string().uuid()).max(100).default([]),
  newHabits: z.array(newHabitSchema).max(100).optional(),
});

export const updateGoalRequestSchema = z
  .strictObject({
    title: z.string().trim().min(1).max(191).optional(),
    targetDays: z.number().int().min(1).max(100000).optional(),
    deadline: calendarDateSchema.nullable().optional(),
    habitIds: z.array(z.string().uuid()).min(1).max(100).optional(),
    newHabits: z.array(newHabitSchema).max(100).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, 'At least one field is required');

export const connectGoalRequestSchema = z.strictObject({ goalIds: z.array(z.string().uuid()).max(100) });

export type CreateGoalRequest = ContractCreateGoalRequest;
export type CreateMultiGoalRequest = ContractCreateMultiGoalRequest;
export type UpdateGoalRequest = ContractUpdateGoalRequest;
