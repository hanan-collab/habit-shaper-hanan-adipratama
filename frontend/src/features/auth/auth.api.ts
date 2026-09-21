import { api } from '../../lib/api';
import type {
  CompleteOnboardingRequest,
  LoginRequest,
  RegisterRequest,
  UpdateProfileRequest,
} from './dto/request/auth.request';
import type { AuthUserResponse } from './dto/response/auth.response';
export type CompleteOnboardingInput = CompleteOnboardingRequest;
export const authApi = {
  me: () => api<AuthUserResponse>('/auth/me'),
  login: (input: LoginRequest) => api<AuthUserResponse>('/auth/login', { method: 'POST', body: JSON.stringify(input) }),
  register: (input: RegisterRequest) =>
    api<AuthUserResponse>('/auth/register', { method: 'POST', body: JSON.stringify(input) }),
  logout: () => api<void>('/auth/logout', { method: 'POST' }),
  completeOnboarding: (input: CompleteOnboardingRequest) =>
    api<AuthUserResponse>('/auth/onboarding', { method: 'PATCH', body: JSON.stringify(input) }),
  updateProfile: (input: UpdateProfileRequest) =>
    api<AuthUserResponse>('/auth/me', { method: 'PATCH', body: JSON.stringify(input) }),
  deleteAccount: () => api<void>('/auth/me', { method: 'DELETE' }),
};
