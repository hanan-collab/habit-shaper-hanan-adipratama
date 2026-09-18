import type { Response } from 'express';
import type { ZodType } from 'zod';

export function parseBody<T>(schema: ZodType<T>, body: unknown, response: Response): T | null {
  const result = schema.safeParse(body);
  if (result.success) return result.data;
  response.status(400).json({
    error: {
      code: 'VALIDATION_ERROR',
      message: 'Request body is invalid',
      fields: result.error.flatten().fieldErrors,
    },
  });
  return null;
}
