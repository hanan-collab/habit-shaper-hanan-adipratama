import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { createAuthController } from './auth.controller.js';
import { requireAuth } from './auth.middleware.js';
import type { AuthService } from './auth.service.js';

export function createAuthRoute(service: AuthService, config: { cookieSecure: boolean }) {
  const router = Router();
  const controller = createAuthController(service, config);
  const authenticated = requireAuth(service);
  const registerLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, limit: 10, standardHeaders: 'draft-8', legacyHeaders: false,
    message: { error: { code: 'RATE_LIMITED', message: 'Too many registration attempts; try again later' } },
  });
  const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, limit: 10, standardHeaders: 'draft-8', legacyHeaders: false,
    skipSuccessfulRequests: true,
    message: { error: { code: 'RATE_LIMITED', message: 'Too many login attempts; try again later' } },
  });

  router.post('/register', registerLimiter, controller.register);
  router.post('/login', loginLimiter, controller.login);
  router.post('/logout', controller.logout);
  router.get('/me', authenticated, controller.me);
  router.patch('/onboarding', authenticated, controller.completeOnboarding);
  return router;
}
