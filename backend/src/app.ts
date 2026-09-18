import express from 'express';
import path from 'node:path';
import { healthRouter } from './features/health/health.routes.js';

export function createApp(options: { checkDatabase: () => Promise<unknown>; frontendDirectory?: string }) {
  const app = express();
  app.disable('x-powered-by');
  app.use('/api/health', healthRouter(options.checkDatabase));
  app.use('/api', (_request, response) => { response.status(404).json({ error: 'Not found' }); });
  if (options.frontendDirectory) {
    const directory = path.resolve(options.frontendDirectory);
    app.use(express.static(directory));
    app.get('/{*path}', (request, response, next) => {
      if (path.extname(request.path) || !request.accepts('html')) return next();
      response.sendFile(path.join(directory, 'index.html'));
    });
  }
  return app;
}
