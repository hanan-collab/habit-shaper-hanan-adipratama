import express from 'express';
import cookieParser from 'cookie-parser';
import path from 'node:path';
import swaggerUi from 'swagger-ui-dist';
import { AppError } from './common/app-error.js';
import { createAuthRoute } from './features/auth/auth.route.js';
import type { AuthService } from './features/auth/auth.service.js';
import { createHealthRoute } from './features/health/health.route.js';
import type { HealthService } from './features/health/health.service.js';
import { createHabitRoute } from './features/habits/habit.route.js';
import type { HabitService } from './features/habits/habit.service.js';
import { createStatisticsRoute } from './features/statistics/statistics.route.js';
import type { StatisticsService } from './features/statistics/statistics.service.js';
import { createGoalRoute } from './features/goals/goal.route.js';
import type { GoalService } from './features/goals/goal.service.js';
import { createDashboardRoute } from './features/dashboard/dashboard.route.js';
import type { DashboardService } from './features/dashboard/dashboard.service.js';
import { createTrackingRoute } from './features/tracking/tracking.route.js';
import type { TrackingService } from './features/tracking/tracking.service.js';
import type { CompositionService } from './features/composition/composition.service.js';
import { createExportRoute } from './features/export/export.route.js';
import type { ExportService } from './features/export/export.service.js';
import { requestContext } from './middleware/request-context.js';
import { openApiDocument } from './docs/openapi.js';

type BaseAppOptions = {
  healthService: HealthService;
  cookieSecure?: boolean;
  frontendDirectory?: string;
};

type HealthAppOptions = BaseAppOptions & { authService?: never };
type AuthAppOptions = BaseAppOptions & { authService: AuthService; habitService?: never };
type FullAppOptions = BaseAppOptions & {
  authService: AuthService;
  habitService: HabitService;
  statisticsService: StatisticsService;
  goalService: GoalService;
  dashboardService: DashboardService;
  trackingService: TrackingService;
  compositionService: CompositionService;
  exportService: ExportService;
};
type AppOptions = HealthAppOptions | AuthAppOptions | FullAppOptions;

export function createApp(options: AppOptions) {
  const app = express();
  app.disable('x-powered-by');
  app.use(requestContext);
  app.use(express.json({ limit: '32kb' }));
  app.use(cookieParser());
  app.get('/api/openapi.json', (_request, response) => response.json(openApiDocument));
  app.get('/api/docs', (request, response) => {
    if (!request.originalUrl.endsWith('/')) {
      response.redirect(308, '/api/docs/');
      return;
    }
    response.type('html').send(`<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Habit Shaper API</title>
    <link rel="stylesheet" href="./swagger-ui.css" />
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="./swagger-ui-bundle.js"></script>
    <script>
      window.ui = SwaggerUIBundle({
        url: '/api/openapi.json',
        dom_id: '#swagger-ui',
        deepLinking: true,
        displayRequestDuration: true,
        tryItOutEnabled: true
      });
    </script>
  </body>
</html>`);
  });
  app.use('/api/docs', express.static(swaggerUi.getAbsoluteFSPath(), { index: false }));
  app.use('/api/health', createHealthRoute(options.healthService));
  if ('authService' in options && options.authService) {
    app.use('/api/auth', createAuthRoute(options.authService, { cookieSecure: options.cookieSecure ?? false }));
    if ('habitService' in options && options.habitService) {
      app.use('/api', createGoalRoute(options.authService, options.goalService, options.compositionService));
      app.use('/api/dashboard', createDashboardRoute(options.authService, options.dashboardService));
      app.use('/api', createStatisticsRoute(options.authService, options.statisticsService));
      app.use('/api/habits', createTrackingRoute(options.authService, options.trackingService));
      app.use('/api/export', createExportRoute(options.authService, options.exportService));
      app.use('/api/habits', createHabitRoute(options.authService, options.habitService, options.compositionService));
    }
  }
  app.use('/api', (_request, response) => {
    response.status(404).json({ error: 'Not found' });
  });
  if (options.frontendDirectory) {
    const directory = path.resolve(options.frontendDirectory);
    app.use(express.static(directory));
    app.get('/{*path}', (request, response, next) => {
      if (path.extname(request.path) || !request.accepts('html')) return next();
      response.sendFile(path.join(directory, 'index.html'));
    });
  }
  app.use((error: unknown, request: express.Request, response: express.Response, _next: express.NextFunction) => {
    if (error instanceof AppError) {
      response.status(error.status).json({ error: { code: error.code, message: error.message } });
      return;
    }
    if (error instanceof SyntaxError && 'body' in error) {
      response.status(400).json({ error: { code: 'INVALID_JSON', message: 'Request body contains invalid JSON' } });
      return;
    }
    console.error(
      JSON.stringify({
        level: 'error',
        requestId: request.requestId,
        method: request.method,
        path: request.path,
        error:
          error instanceof Error ? { name: error.name, message: error.message, stack: error.stack } : String(error),
      }),
    );
    response.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } });
  });
  return app;
}
