import express from 'express';
import cookieParser from 'cookie-parser';
import path from 'node:path';
import { AppError } from './common/app-error.js';
import { createAuthRoute } from './features/auth/auth.route.js';
import type { AuthService } from './features/auth/auth.service.js';
import { healthRouter } from './features/health/health.routes.js';

type AppOptions = {
  checkDatabase: () => Promise<unknown>;
  authService?: AuthService;
  cookieSecure?: boolean;
  frontendDirectory?: string;
};

export function createApp(options: AppOptions) {
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json({ limit: '32kb' }));
  app.use(cookieParser());
  app.use('/api/health', healthRouter(options.checkDatabase));
  if (options.authService) {
    app.use('/api/auth', createAuthRoute(options.authService, { cookieSecure: options.cookieSecure ?? false }));
  }
  app.use('/api', (_request, response) => { response.status(404).json({ error: 'Not found' }); });
  if (options.frontendDirectory) {
    const directory = path.resolve(options.frontendDirectory);
    app.use(express.static(directory));
    app.get('/{*path}', (request, response, next) => {
      if (path.extname(request.path) || !request.accepts('html')) return next();
      response.sendFile(path.join(directory, 'index.html'));
    });
  }
  app.use((error: unknown, _request: express.Request, response: express.Response, _next: express.NextFunction) => {
    if (error instanceof AppError) {
      response.status(error.status).json({ error: { code: error.code, message: error.message } });
      return;
    }
    if (error instanceof SyntaxError && 'body' in error) {
      response.status(400).json({ error: { code: 'INVALID_JSON', message: 'Request body contains invalid JSON' } });
      return;
    }
    console.error(error);
    response.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } });
  });
  return app;
}
