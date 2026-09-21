import { z } from 'zod';

const email = z.string().trim().email().max(191).transform((value) => value.toLowerCase());
const password = z.string()
  .min(8, 'Password must contain at least 8 characters')
  .refine((value) => Buffer.byteLength(value, 'utf8') <= 72, 'Password must not exceed 72 UTF-8 bytes');
const timezone = z.string().trim().min(1).max(100).refine((value) => {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: value });
    return true;
  } catch {
    return false;
  }
}, 'Timezone must be a valid IANA timezone');

export const registerDto = z.strictObject({ email, password, timezone: timezone.optional().default('UTC') });
export const loginDto = z.strictObject({ email, password });
export const onboardingDto = z.strictObject({ completed: z.literal(true), timezone });
export const profileDto = z.strictObject({
  username: z.string().trim().min(1, 'Username is required').max(191),
  timezone,
});

export type RegisterDto = z.infer<typeof registerDto>;
export type LoginDto = z.infer<typeof loginDto>;
export type OnboardingDto = z.infer<typeof onboardingDto>;
export type ProfileDto = z.infer<typeof profileDto>;
