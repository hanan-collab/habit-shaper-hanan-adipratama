import { z } from 'zod';

export const env = z
  .object({
    PORT: z.coerce.number().int().min(1).max(65535).default(3000),
    DATABASE_URL: z.string().min(1),
    BCRYPT_ROUNDS: z.coerce.number().int().min(10).max(15).default(12),
    SESSION_TTL_DAYS: z.coerce.number().int().min(1).max(90).default(7),
    COOKIE_SECURE: z
      .enum(['true', 'false'])
      .default('false')
      .transform((value) => value === 'true'),
  })
  .parse(process.env);
