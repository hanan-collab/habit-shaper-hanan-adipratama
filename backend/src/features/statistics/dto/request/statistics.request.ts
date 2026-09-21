import { z } from 'zod';

export const statisticsParamsSchema = z.strictObject({ habitId: z.string().uuid() });
