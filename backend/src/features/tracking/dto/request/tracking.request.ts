import { z } from 'zod';
import type { TrackingEventRequest } from '@habit-shaper/contracts/request';
import { calendarDateSchema } from '../../../../common/calendar-date.js';

export const trackingParamsSchema = z.strictObject({ habitId: z.string().uuid(), date: calendarDateSchema });
export const trackingEventRequestSchema = z.strictObject({ note: z.string().trim().max(2000).nullable().optional() });
export type { TrackingEventRequest };
