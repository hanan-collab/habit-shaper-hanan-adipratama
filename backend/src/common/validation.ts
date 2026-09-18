import type { Response } from 'express';
import type { ZodType } from 'zod';

export function parseBody<T>(schema: ZodType<T>, body: unknown, response: Response): T | null {
  return parseInput(schema, body, response, 'Request body is invalid');
}

export function parseInput<T>(schema: ZodType<T>, input: unknown, response: Response, message: string): T | null {
  const result = schema.safeParse(input);
  if (result.success) return result.data;
  response.status(400).json({
    error: {
      code: 'VALIDATION_ERROR',
      message,
      fields: result.error.flatten().fieldErrors,
    },
  });
  return null;
}
