import type { NextFunction, Request, Response } from 'express';
import { AuthErrorCode, SESSION_COOKIE_NAME } from './auth.enum.js';
import type { AuthService } from './auth.service.js';

export function requireAuth(service: AuthService) {
  return async (request: Request, response: Response, next: NextFunction) => {
    const user = await service.getUserForToken(request.cookies?.[SESSION_COOKIE_NAME]);
    if (!user) {
      response.status(401).json({ error: { code: AuthErrorCode.Unauthenticated, message: 'Authentication required' } });
      return;
    }
    request.authUser = user;
    next();
  };
}
