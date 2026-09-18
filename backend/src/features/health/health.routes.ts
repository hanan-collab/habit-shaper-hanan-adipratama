import { Router } from 'express';

export function healthRouter(checkDatabase: () => Promise<unknown>) {
  const router = Router();
  router.get('/', async (_request, response) => {
    try {
      await checkDatabase();
      response.json({ status: 'ok', database: 'up' });
    } catch {
      response.status(503).json({ status: 'unavailable', database: 'down' });
    }
  });
  return router;
}
