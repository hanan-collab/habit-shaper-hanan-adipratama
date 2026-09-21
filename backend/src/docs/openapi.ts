import { extendZodWithOpenApi, OpenAPIRegistry, OpenApiGeneratorV31 } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';
import {
  loginRequestSchema,
  onboardingRequestSchema,
  profileRequestSchema,
  registerRequestSchema,
} from '../features/auth/dto/request/auth.request.js';
import {
  createHabitRequestSchema,
  habitIdParamsSchema,
  updateHabitGoalsRequestSchema,
  updateHabitRequestSchema,
} from '../features/habits/dto/request/habit.request.js';
import {
  connectGoalRequestSchema,
  createGoalRequestSchema,
  createMultiGoalRequestSchema,
  goalIdParamsSchema,
  habitGoalParamsSchema,
  updateGoalRequestSchema,
} from '../features/goals/dto/request/goal.request.js';
import { statisticsParamsSchema } from '../features/statistics/dto/request/statistics.request.js';
import { trackingEventRequestSchema, trackingParamsSchema } from '../features/tracking/dto/request/tracking.request.js';

extendZodWithOpenApi(z);

const registry = new OpenAPIRegistry();

registry.registerComponent('securitySchemes', 'cookieAuth', {
  type: 'apiKey',
  in: 'cookie',
  name: 'habit_session',
  description: 'Opaque session cookie set by register or login.',
});

const id = z.string().uuid();
const calendarDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .meta({ example: '2026-09-22' });
const timestamp = z.string().datetime().meta({ example: '2026-09-22T08:00:00.000Z' });

const errorResponseSchema = registry.register(
  'ErrorResponse',
  z.strictObject({
    error: z.union([z.string(), z.strictObject({ code: z.string(), message: z.string() })]),
  }),
);

const userSchema = registry.register(
  'User',
  z.strictObject({
    id,
    email: z.string().email(),
    username: z.string(),
    timezone: z.string().meta({ example: 'Asia/Jakarta' }),
    onboardingCompleted: z.boolean(),
    createdAt: timestamp,
    updatedAt: timestamp,
  }),
);

const habitEventSchema = registry.register(
  'HabitEvent',
  z.strictObject({
    id,
    habitId: id,
    type: z.enum(['COMPLETED', 'RELAPSED']),
    date: calendarDate,
    note: z.string().nullable(),
    createdAt: timestamp,
  }),
);

const habitSchema = registry.register(
  'Habit',
  z.strictObject({
    id,
    userId: id,
    name: z.string(),
    description: z.string().nullable(),
    type: z.enum(['BUILD', 'BREAK']),
    startDate: calendarDate,
    createdAt: timestamp,
    updatedAt: timestamp,
  }),
);

const habitDetailSchema = registry.register('HabitDetail', habitSchema.extend({ events: z.array(habitEventSchema) }));

const goalProgressSchema = registry.register(
  'GoalProgress',
  z.strictObject({
    currentDays: z.number().int().nonnegative(),
    remainingDays: z.number().int().nonnegative(),
    percentage: z.number().nonnegative(),
    overdue: z.boolean(),
  }),
);

const goalHabitSchema = z.strictObject({
  id,
  name: z.string(),
  type: z.enum(['BUILD', 'BREAK']),
  connectedOn: calendarDate,
  todayStatus: z.enum(['DONE', 'NOT_DONE', 'RELAPSED', 'CLEAR']),
});

const goalSchema = registry.register(
  'Goal',
  z.strictObject({
    id,
    userId: id,
    title: z.string(),
    targetDays: z.number().int().positive(),
    deadline: calendarDate.nullable(),
    status: z.enum(['ACTIVE', 'COMPLETED', 'CANCELLED']),
    completedDate: calendarDate.nullable(),
    createdAt: timestamp,
    updatedAt: timestamp,
    todayStatus: z.enum(['COMPLETE', 'PENDING']),
    habits: z.array(goalHabitSchema),
    progress: goalProgressSchema,
  }),
);

const statisticsSchema = registry.register(
  'HabitStatistics',
  z.strictObject({
    habitId: id,
    type: z.enum(['BUILD', 'BREAK']),
    currentStreak: z.number().int().nonnegative(),
    longestStreak: z.number().int().nonnegative(),
    totalCompletions: z.number().int().nonnegative(),
    completedThisWeek: z.number().int().nonnegative(),
    missedThisWeek: z.number().int().nonnegative(),
    eligibleDaysThisWeek: z.number().int().nonnegative(),
    weeklyCompletionRate: z.number().nonnegative(),
    weekly: z.strictObject({
      period: z.literal('CURRENT_WEEK'),
      startDate: calendarDate,
      endDate: calendarDate,
      completedDays: z.number().int().nonnegative(),
      missedDays: z.number().int().nonnegative(),
      eligibleDays: z.number().int().nonnegative(),
      completionRate: z.number().nonnegative(),
    }),
    lastRelapse: calendarDate.nullable(),
    lastRelapseDate: calendarDate.nullable(),
  }),
);

const userStatisticsSchema = registry.register(
  'UserStatistics',
  z.strictObject({
    totalBuildCompletions: z.number().int().nonnegative(),
    totalGoalsCompleted: z.number().int().nonnegative(),
    bestBuildStreak: z.number().int().nonnegative(),
    bestBreakStreak: z.number().int().nonnegative(),
    bestOverallStreak: z.number().int().nonnegative(),
  }),
);

const gamificationEventSchema = registry.register(
  'GamificationEvent',
  z.strictObject({
    type: z.enum([
      'HABIT_CREATED',
      'FIRST_CHECK_IN',
      'DAILY_COMPLETION',
      'STREAK_STARTED',
      'STREAK_MILESTONE',
      'PERSONAL_BEST',
      'GOAL_HALFWAY',
      'GOAL_NEARLY_REACHED',
      'GOAL_COMPLETED',
      'PERFECT_WEEK',
      'RELAPSE_RECORDED',
      'COMEBACK',
    ]),
    level: z.enum(['MICRO', 'PROGRESS', 'MILESTONE', 'RECOVERY']),
    habitId: id.optional(),
    habitType: z.enum(['BUILD', 'BREAK']).optional(),
    goalId: id.optional(),
    value: z.number().optional(),
    target: z.number().optional(),
    previousValue: z.number().optional(),
    daysAway: z.number().optional(),
  }),
);

const metaSchema = z.strictObject({ gamificationEvents: z.array(gamificationEventSchema) });
const authResponseSchema = z.strictObject({ user: userSchema });
const habitItemSchema = z.strictObject({ habit: z.union([habitSchema, habitDetailSchema]) });
const goalItemSchema = z.strictObject({ goal: goalSchema });

type ResponseSchema = z.ZodType;
const jsonResponse = (description: string, schema: ResponseSchema) => ({
  description,
  content: { 'application/json': { schema } },
});
const noContentResponse = { description: 'No content' };
const errorResponses = {
  400: jsonResponse('Invalid request', errorResponseSchema),
  401: jsonResponse('Authentication required', errorResponseSchema),
  404: jsonResponse('Resource not found', errorResponseSchema),
  409: jsonResponse('Request conflicts with current state', errorResponseSchema),
  429: jsonResponse('Rate limit exceeded', errorResponseSchema),
  500: jsonResponse('Unexpected server error', errorResponseSchema),
};
const body = (schema: ResponseSchema) => ({
  required: true,
  content: { 'application/json': { schema } },
});
const secured = [{ cookieAuth: [] }];

const registerPath = registry.registerPath.bind(registry);

registerPath({
  method: 'get',
  path: '/api/health',
  tags: ['Health'],
  summary: 'Check application and database readiness',
  responses: {
    200: jsonResponse('Application is ready', z.strictObject({ status: z.literal('ok'), database: z.literal('up') })),
    503: jsonResponse(
      'Database is unavailable',
      z.strictObject({ status: z.literal('unavailable'), database: z.literal('down') }),
    ),
  },
});

registerPath({
  method: 'post',
  path: '/api/auth/register',
  tags: ['Auth'],
  summary: 'Register a user',
  request: { body: body(registerRequestSchema) },
  responses: { 201: jsonResponse('User registered', authResponseSchema), ...errorResponses },
});
registerPath({
  method: 'post',
  path: '/api/auth/login',
  tags: ['Auth'],
  summary: 'Log in',
  request: { body: body(loginRequestSchema) },
  responses: { 200: jsonResponse('Authenticated user', authResponseSchema), ...errorResponses },
});
registerPath({
  method: 'post',
  path: '/api/auth/logout',
  tags: ['Auth'],
  summary: 'Log out',
  responses: { 204: noContentResponse, ...errorResponses },
});
registerPath({
  method: 'get',
  path: '/api/auth/me',
  tags: ['Auth'],
  summary: 'Get current user',
  security: secured,
  responses: { 200: jsonResponse('Current user', authResponseSchema), ...errorResponses },
});
registerPath({
  method: 'patch',
  path: '/api/auth/me',
  tags: ['Auth'],
  summary: 'Update current profile',
  security: secured,
  request: { body: body(profileRequestSchema) },
  responses: { 200: jsonResponse('Updated user', authResponseSchema), ...errorResponses },
});
registerPath({
  method: 'delete',
  path: '/api/auth/me',
  tags: ['Auth'],
  summary: 'Delete current account',
  security: secured,
  responses: { 204: noContentResponse, ...errorResponses },
});
registerPath({
  method: 'patch',
  path: '/api/auth/onboarding',
  tags: ['Auth'],
  summary: 'Complete onboarding',
  security: secured,
  request: { body: body(onboardingRequestSchema) },
  responses: { 200: jsonResponse('Updated user', authResponseSchema), ...errorResponses },
});

registerPath({
  method: 'get',
  path: '/api/habits',
  tags: ['Habits'],
  summary: 'List habits',
  security: secured,
  responses: { 200: jsonResponse('Habit list', z.strictObject({ habits: z.array(habitSchema) })), ...errorResponses },
});
registerPath({
  method: 'post',
  path: '/api/habits',
  tags: ['Habits'],
  summary: 'Create a habit and staged goals atomically',
  security: secured,
  request: { body: body(createHabitRequestSchema) },
  responses: {
    201: jsonResponse(
      'Created composition',
      z.strictObject({ habit: habitSchema, createdGoals: z.array(goalSchema).optional(), meta: metaSchema }),
    ),
    ...errorResponses,
  },
});
registerPath({
  method: 'get',
  path: '/api/habits/{habitId}',
  tags: ['Habits'],
  summary: 'Get a habit',
  security: secured,
  request: { params: habitIdParamsSchema },
  responses: { 200: jsonResponse('Habit detail', habitItemSchema), ...errorResponses },
});
registerPath({
  method: 'patch',
  path: '/api/habits/{habitId}',
  tags: ['Habits'],
  summary: 'Update a habit',
  security: secured,
  request: { params: habitIdParamsSchema, body: body(updateHabitRequestSchema) },
  responses: { 200: jsonResponse('Updated habit', habitItemSchema), ...errorResponses },
});
registerPath({
  method: 'patch',
  path: '/api/habits/{habitId}/goals',
  tags: ['Habits'],
  summary: 'Replace a habit goal composition atomically',
  security: secured,
  request: { params: habitIdParamsSchema, body: body(updateHabitGoalsRequestSchema) },
  responses: { 200: jsonResponse('Updated habit composition', habitItemSchema), ...errorResponses },
});
registerPath({
  method: 'delete',
  path: '/api/habits/{habitId}',
  tags: ['Habits'],
  summary: 'Delete a habit',
  security: secured,
  request: { params: habitIdParamsSchema },
  responses: { 204: noContentResponse, ...errorResponses },
});

registerPath({
  method: 'get',
  path: '/api/goals',
  tags: ['Goals'],
  summary: 'List goals',
  security: secured,
  responses: { 200: jsonResponse('Goal list', z.strictObject({ goals: z.array(goalSchema) })), ...errorResponses },
});
registerPath({
  method: 'post',
  path: '/api/goals',
  tags: ['Goals'],
  summary: 'Create a goal and staged habits atomically',
  security: secured,
  request: { body: body(createMultiGoalRequestSchema) },
  responses: {
    201: jsonResponse(
      'Created composition',
      z.strictObject({ goal: goalSchema, createdHabits: z.array(habitSchema), meta: metaSchema }),
    ),
    ...errorResponses,
  },
});
registerPath({
  method: 'post',
  path: '/api/habits/{habitId}/goals',
  tags: ['Goals'],
  summary: 'Create a goal for one habit',
  security: secured,
  request: { params: habitGoalParamsSchema, body: body(createGoalRequestSchema) },
  responses: { 201: jsonResponse('Created goal', goalItemSchema), ...errorResponses },
});
registerPath({
  method: 'post',
  path: '/api/habits/{habitId}/goal-connections',
  tags: ['Goals'],
  summary: 'Connect existing goals to a habit',
  security: secured,
  request: { params: habitGoalParamsSchema, body: body(connectGoalRequestSchema) },
  responses: {
    200: jsonResponse('Connected goals', z.strictObject({ goals: z.array(goalSchema) })),
    ...errorResponses,
  },
});
registerPath({
  method: 'patch',
  path: '/api/goals/{goalId}',
  tags: ['Goals'],
  summary: 'Update a goal composition atomically',
  security: secured,
  request: { params: goalIdParamsSchema, body: body(updateGoalRequestSchema) },
  responses: {
    200: jsonResponse(
      'Updated composition',
      z.strictObject({ goal: goalSchema, createdHabits: z.array(habitSchema), meta: metaSchema }),
    ),
    ...errorResponses,
  },
});
registerPath({
  method: 'delete',
  path: '/api/goals/{goalId}',
  tags: ['Goals'],
  summary: 'Delete a goal',
  security: secured,
  request: { params: goalIdParamsSchema },
  responses: { 204: noContentResponse, ...errorResponses },
});
registerPath({
  method: 'post',
  path: '/api/goals/{goalId}/cancel',
  tags: ['Goals'],
  summary: 'Cancel a goal',
  security: secured,
  request: { params: goalIdParamsSchema },
  responses: { 200: jsonResponse('Cancelled goal', goalItemSchema), ...errorResponses },
});

const trackingResponseSchema = z.strictObject({
  data: z.strictObject({
    event: habitEventSchema,
    stats: statisticsSchema,
    goal: z
      .strictObject({
        id,
        status: z.enum(['ACTIVE', 'COMPLETED', 'CANCELLED']),
        currentProgress: z.number().int().nonnegative(),
        targetDays: z.number().int().positive(),
        percentage: z.number().nonnegative(),
        remainingDays: z.number().int().nonnegative(),
      })
      .nullable(),
  }),
  meta: metaSchema,
});

for (const eventType of ['completions', 'relapses'] as const) {
  registerPath({
    method: 'put',
    path: `/api/habits/{habitId}/${eventType}/{date}`,
    tags: ['Tracking'],
    summary: eventType === 'completions' ? 'Record a completion' : 'Record a relapse',
    security: secured,
    request: { params: trackingParamsSchema, body: body(trackingEventRequestSchema) },
    responses: { 200: jsonResponse('Tracking result', trackingResponseSchema), ...errorResponses },
  });
  registerPath({
    method: 'delete',
    path: `/api/habits/{habitId}/${eventType}/{date}`,
    tags: ['Tracking'],
    summary: eventType === 'completions' ? 'Remove a completion' : 'Remove a relapse',
    security: secured,
    request: { params: trackingParamsSchema },
    responses: { 204: noContentResponse, ...errorResponses },
  });
}

registerPath({
  method: 'get',
  path: '/api/statistics',
  tags: ['Statistics'],
  summary: 'Get statistics for all habits',
  security: secured,
  responses: {
    200: jsonResponse(
      'All habit statistics',
      z.strictObject({
        histories: z.array(z.strictObject({ habit: habitDetailSchema, statistics: statisticsSchema })),
      }),
    ),
    ...errorResponses,
  },
});
registerPath({
  method: 'get',
  path: '/api/habits/{habitId}/statistics',
  tags: ['Statistics'],
  summary: 'Get statistics for one habit',
  security: secured,
  request: { params: statisticsParamsSchema },
  responses: {
    200: jsonResponse('Habit statistics', z.strictObject({ statistics: statisticsSchema })),
    ...errorResponses,
  },
});

const dashboardHabitSchema = z.strictObject({
  id,
  name: z.string(),
  description: z.string().nullable(),
  type: z.enum(['BUILD', 'BREAK']),
  startDate: calendarDate,
  todayStatus: z.enum(['PENDING', 'COMPLETED', 'CLEAN', 'RELAPSED']),
  statistics: statisticsSchema,
  activeGoalId: id.nullable(),
});
registerPath({
  method: 'get',
  path: '/api/dashboard',
  tags: ['Dashboard'],
  summary: 'Get the Today dashboard',
  security: secured,
  responses: {
    200: jsonResponse(
      'Dashboard',
      z.strictObject({
        dashboard: z.strictObject({
          date: calendarDate,
          summary: z.strictObject({
            activeHabits: z.number().int().nonnegative(),
            activeGoals: z.number().int().nonnegative(),
          }),
          habits: z.array(dashboardHabitSchema),
          goals: z.array(goalSchema),
          userStatistics: userStatisticsSchema,
        }),
      }),
    ),
    ...errorResponses,
  },
});

registerPath({
  method: 'get',
  path: '/api/export',
  tags: ['Export'],
  summary: 'Export all user data',
  security: secured,
  responses: {
    200: jsonResponse(
      'User data export',
      z.object({
        exportedAt: timestamp,
        user: userSchema,
        habits: z.array(habitDetailSchema),
        goals: z.array(z.unknown()),
      }),
    ),
    ...errorResponses,
  },
});

export const openApiDocument = new OpenApiGeneratorV31(registry.definitions).generateDocument({
  openapi: '3.1.0',
  info: {
    title: 'Habit Shaper API',
    version: '0.1.0',
    description: 'HTTP API for habits, goals, daily tracking, statistics, and account management.',
  },
  servers: [{ url: '/', description: 'Current origin' }],
  tags: [
    { name: 'Health' },
    { name: 'Auth' },
    { name: 'Habits' },
    { name: 'Goals' },
    { name: 'Tracking' },
    { name: 'Statistics' },
    { name: 'Dashboard' },
    { name: 'Export' },
  ],
});
