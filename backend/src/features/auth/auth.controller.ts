import type { CookieOptions, RequestHandler } from 'express';
import { parseBody } from '../../common/validation.js';
import { SESSION_COOKIE_NAME } from './auth.enum.js';
import {
  loginRequestSchema,
  onboardingRequestSchema,
  profileRequestSchema,
  registerRequestSchema,
} from './dto/request/auth.request.js';
import type { AuthService } from './auth.service.js';
import { publicUserResponse } from './auth.model.js';

type ControllerConfig = { cookieSecure: boolean };

function cookieOptions(config: ControllerConfig, expires?: Date): CookieOptions {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: config.cookieSecure,
    path: '/',
    ...(expires ? { expires } : {}),
  };
}

export type AuthController = {
  register: RequestHandler;
  login: RequestHandler;
  logout: RequestHandler;
  me: RequestHandler;
  completeOnboarding: RequestHandler;
  updateProfile: RequestHandler;
  deleteAccount: RequestHandler;
};

export function createAuthController(service: AuthService, config: ControllerConfig): AuthController {
  return {
    register: async (request, response) => {
      const input = parseBody(registerRequestSchema, request.body, response);
      if (!input) return;
      const result = await service.register(input);
      response.cookie(SESSION_COOKIE_NAME, result.token, cookieOptions(config, result.expiresAt));
      response.status(201).json({ user: publicUserResponse(result.user) });
    },
    login: async (request, response) => {
      const input = parseBody(loginRequestSchema, request.body, response);
      if (!input) return;
      const result = await service.login(input);
      response.cookie(SESSION_COOKIE_NAME, result.token, cookieOptions(config, result.expiresAt));
      response.json({ user: publicUserResponse(result.user) });
    },
    logout: async (request, response) => {
      await service.logout(request.cookies?.[SESSION_COOKIE_NAME] ?? '');
      response.clearCookie(SESSION_COOKIE_NAME, cookieOptions(config));
      response.status(204).send();
    },
    me: (request, response) => {
      response.json({ user: publicUserResponse(request.authUser!) });
    },
    completeOnboarding: async (request, response) => {
      const input = parseBody(onboardingRequestSchema, request.body, response);
      if (!input) return;
      const user = await service.completeOnboarding(request.authUser!.id, input);
      response.json({ user: publicUserResponse(user) });
    },
    updateProfile: async (request, response) => {
      const input = parseBody(profileRequestSchema, request.body, response);
      if (!input) return;
      const user = await service.updateProfile(request.authUser!.id, input);
      response.json({ user: publicUserResponse(user) });
    },
    deleteAccount: async (request, response) => {
      await service.deleteAccount(request.authUser!.id);
      response.clearCookie(SESSION_COOKIE_NAME, cookieOptions(config));
      response.status(204).send();
    },
  };
}
