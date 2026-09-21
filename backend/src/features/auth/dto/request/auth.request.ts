import { z } from 'zod';
import type {
  CompleteOnboardingRequest,
  LoginRequest,
  RegisterRequest as ContractRegisterRequest,
  UpdateProfileRequest,
} from '@habit-shaper/contracts/request';

const emailSchema = z
  .string()
  .trim()
  .email()
  .max(191)
  .transform((value) => value.toLowerCase());
const passwordSchema = z
  .string()
  .min(8, 'Password must contain at least 8 characters')
  .refine((value) => Buffer.byteLength(value, 'utf8') <= 72, 'Password must not exceed 72 UTF-8 bytes');
const timezoneSchema = z
  .string()
  .trim()
  .min(1)
  .max(100)
  .refine((value) => {
    try {
      new Intl.DateTimeFormat('en-US', { timeZone: value });
      return true;
    } catch {
      return false;
    }
  }, 'Timezone must be a valid IANA timezone');

export const registerRequestSchema = z.strictObject({
  email: emailSchema,
  password: passwordSchema,
  timezone: timezoneSchema.optional().default('UTC'),
});
export const loginRequestSchema = z.strictObject({ email: emailSchema, password: passwordSchema });
export const onboardingRequestSchema = z.strictObject({ completed: z.literal(true), timezone: timezoneSchema });
export const profileRequestSchema = z.strictObject({
  username: z.string().trim().min(1, 'Username is required').max(191),
  timezone: timezoneSchema,
});

export type { LoginRequest };
export type RegisterRequest = Omit<ContractRegisterRequest, 'timezone'> & { timezone: string };
export type OnboardingRequest = CompleteOnboardingRequest;
export type ProfileRequest = UpdateProfileRequest;
