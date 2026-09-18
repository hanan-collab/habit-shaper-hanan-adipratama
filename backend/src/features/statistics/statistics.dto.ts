import { z } from 'zod';
import type { HabitStatisticsModel } from './statistics.model.js';

export const statisticsParamsDto = z.strictObject({ habitId: z.string().uuid() });
export type StatisticsResponseDto = { statistics: HabitStatisticsModel };
