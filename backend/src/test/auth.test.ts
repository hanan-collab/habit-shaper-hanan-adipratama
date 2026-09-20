import request from 'supertest';
import { describe, expect, test, vi } from 'vitest';
import { AppError } from '../common/app-error.js';
import { createApp } from '../app.js';
import type { PublicUser } from '../features/auth/auth.model.js';
import type { AuthService } from '../features/auth/auth.service.js';
import { HealthStatus, DatabaseStatus } from '../features/health/health.enum.js';
import type { HealthService } from '../features/health/health.service.js';

const now = new Date('2026-09-19T00:00:00.000Z');
const user: PublicUser = {
  id: 'user-1',
  email: 'person@example.com',
  username: 'person',
  timezone: 'Asia/Jakarta',
  onboardingCompleted: false,
  createdAt: now,
  updatedAt: now,
};
const healthService: HealthService = { getHealth: async () => ({ status: HealthStatus.Ok, database: DatabaseStatus.Up }) };

function service(overrides: Partial<AuthService> = {}): AuthService {
  return {
    register: vi.fn(async () => ({ user, token: 'register-token', expiresAt: new Date('2026-09-26T00:00:00.000Z') })),
    login: vi.fn(async () => ({ user, token: 'login-token', expiresAt: new Date('2026-09-26T00:00:00.000Z') })),
    getUserForToken: vi.fn(async (token) => token ? user : null),
    logout: vi.fn(async () => undefined),
    completeOnboarding: vi.fn(async () => ({ ...user, onboardingCompleted: true })),
    ...overrides,
  };
}

describe('auth HTTP API', () => {
  test('register normalizes input, returns a safe user, and sets an HTTP-only cookie', async () => {
    const auth = service();
    const app = createApp({ healthService, authService: auth });
    const response = await request(app).post('/api/auth/register').send({
      email: ' Person@Example.COM ',
      password: 'correct horse battery staple',
      timezone: 'Asia/Jakarta',
    }).expect(201);

    expect(auth.register).toHaveBeenCalledWith({
      email: 'person@example.com',
      password: 'correct horse battery staple',
      timezone: 'Asia/Jakarta',
    });
    expect(response.body).toEqual({ user: { ...user, createdAt: now.toISOString(), updatedAt: now.toISOString() } });
    expect(response.headers['set-cookie'][0]).toMatch(/^habit_session=register-token;/);
    expect(response.headers['set-cookie'][0]).toContain('HttpOnly');
    expect(response.headers['set-cookie'][0]).toContain('SameSite=Lax');
    expect(response.body.user).not.toHaveProperty('passwordHash');
  });

  test('rejects invalid registration data before calling the service', async () => {
    const auth = service();
    const app = createApp({ healthService, authService: auth });
    const response = await request(app).post('/api/auth/register').send({
      email: 'invalid', password: 'short', timezone: 'not/a-timezone', extra: true,
    }).expect(400);

    expect(response.body.error.code).toBe('VALIDATION_ERROR');
    expect(auth.register).not.toHaveBeenCalled();
  });

  test('defaults registration timezone to UTC when the client has not asked for browser detection', async () => {
    const auth = service();
    const app = createApp({ healthService, authService: auth });
    await request(app).post('/api/auth/register').send({
      email: 'person@example.com', password: 'correct horse battery staple',
    }).expect(201);
    expect(auth.register).toHaveBeenCalledWith({
      email: 'person@example.com', password: 'correct horse battery staple', timezone: 'UTC',
    });
  });

  test('supports authenticated me, onboarding, and logout requests', async () => {
    const auth = service();
    const app = createApp({ healthService, authService: auth });
    const agent = request.agent(app);
    await agent.post('/api/auth/login').send({ email: user.email, password: 'valid-password' }).expect(200);
    await agent.get('/api/auth/me').expect(200).expect((response) => {
      expect(response.body.user.email).toBe(user.email);
    });
    await agent.patch('/api/auth/onboarding').send({ completed: true, timezone: 'Asia/Jakarta' }).expect(200).expect((response) => {
      expect(response.body.user.onboardingCompleted).toBe(true);
    });
    expect(auth.completeOnboarding).toHaveBeenCalledWith(user.id, { completed: true, timezone: 'Asia/Jakarta' });
    const logout = await agent.post('/api/auth/logout').expect(204);
    expect(logout.headers['set-cookie'][0]).toMatch(/^habit_session=;/);
    expect(auth.logout).toHaveBeenCalledWith('login-token');
  });

  test('returns generic credential and authentication errors', async () => {
    const auth = service({
      login: vi.fn(async () => { throw new AppError(401, 'INVALID_CREDENTIALS', 'Email or password is incorrect'); }),
      getUserForToken: vi.fn(async () => null),
    });
    const app = createApp({ healthService, authService: auth });
    await request(app).post('/api/auth/login').send({ email: user.email, password: 'wrong-password' })
      .expect(401, { error: { code: 'INVALID_CREDENTIALS', message: 'Email or password is incorrect' } });
    await request(app).get('/api/auth/me')
      .expect(401, { error: { code: 'UNAUTHENTICATED', message: 'Authentication required' } });
  });
});
