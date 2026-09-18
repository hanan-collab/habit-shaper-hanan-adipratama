import type { CookieOptions, RequestHandler } from 'express';
import { parseBody } from '../../common/validation.js';
import { SESSION_COOKIE_NAME } from './auth.enum.js';
import { loginDto, onboardingDto, registerDto } from './auth.dto.js';
import type { AuthService } from './auth.service.js';

type ControllerConfig = { cookieSecure: boolean };

function cookieOptions(config: ControllerConfig, expires?: Date): CookieOptions {
  return {
    httpOnly: true, sameSite: 'lax', secure: config.cookieSecure, path: '/', ...(expires ? { expires } : {}),
  };
}

export type AuthController = {
  register: RequestHandler;
  login: RequestHandler;
  logout: RequestHandler;
  me: RequestHandler;
  completeOnboarding: RequestHandler;
};

export function createAuthController(service: AuthService, config: ControllerConfig): AuthController {
  return {
    register: async (request, response) => {
      const input = parseBody(registerDto, request.body, response);
      if (!input) return;
      const result = await service.register(input);
      response.cookie(SESSION_COOKIE_NAME, result.token, cookieOptions(config, result.expiresAt));
      response.status(201).json({ user: result.user });
    },
    login: async (request, response) => {
      const input = parseBody(loginDto, request.body, response);
      if (!input) return;
      const result = await service.login(input);
      response.cookie(SESSION_COOKIE_NAME, result.token, cookieOptions(config, result.expiresAt));
      response.json({ user: result.user });
    },
    logout: async (request, response) => {
      await service.logout(request.cookies?.[SESSION_COOKIE_NAME] ?? '');
      response.clearCookie(SESSION_COOKIE_NAME, cookieOptions(config));
      response.status(204).send();
    },
    me: (request, response) => {
      response.json({ user: request.authUser });
    },
    completeOnboarding: async (request, response) => {
      const input = parseBody(onboardingDto, request.body, response);
      if (!input) return;
      const user = await service.completeOnboarding(request.authUser!.id);
      response.json({ user });
    },
  };
}
