import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import request from 'supertest';
import { expect, test } from 'vitest';
import { createApp } from '../app.js';
import { createHealthRepository } from '../features/health/health.repository.js';
import { createHealthService } from '../features/health/health.service.js';
import { openApiDocument } from '../docs/openapi.js';

const health = (checkDatabase: () => Promise<unknown>) => createHealthService(createHealthRepository(checkDatabase));

test('health reports database readiness', async () => {
  const app = createApp({ healthService: health(async () => 1) });
  const response = await request(app).get('/api/health').expect(200);
  expect(response.body).toEqual({ status: 'ok', database: 'up' });
});

test('health reports unavailability without leaking database errors', async () => {
  const app = createApp({
    healthService: health(async () => {
      throw new Error('private connection details');
    }),
  });
  const response = await request(app).get('/api/health').expect(503);
  expect(response.body).toEqual({ status: 'unavailable', database: 'down' });
});

test('publishes complete OpenAPI documentation and Swagger UI', async () => {
  const app = createApp({ healthService: health(async () => 1) });

  const specification = await request(app).get('/api/openapi.json').expect(200);
  expect(specification.body.openapi).toBe('3.1.0');
  expect(specification.body.components.securitySchemes.cookieAuth).toEqual({
    type: 'apiKey',
    in: 'cookie',
    name: 'habit_session',
    description: 'Opaque session cookie set by register or login.',
  });
  const createHabitSchema = specification.body.paths['/api/habits'].post.requestBody.content['application/json'].schema;
  expect(createHabitSchema.required).toEqual(['name', 'type']);
  expect(createHabitSchema.additionalProperties).toBe(false);
  expect(createHabitSchema.properties.name.maxLength).toBe(191);
  expect(createHabitSchema.properties.goalIds.maxItems).toBe(100);
  expect(specification.body.paths['/api/goals/{goalId}'].patch.security).toEqual([{ cookieAuth: [] }]);
  expect(specification.body.paths['/api/health'].get.security).toBeUndefined();
  expect(specification.body.paths['/api/habits/{habitId}/relapses/{date}'].put).toBeDefined();

  await request(app).get('/api/docs').expect(308).expect('Location', '/api/docs/');
  await request(app)
    .get('/api/docs/')
    .expect(200)
    .expect('Content-Type', /html/)
    .expect(/Habit Shaper API/)
    .expect(/\/api\/openapi\.json/);
  await request(app).get('/api/docs/swagger-ui.css').expect(200).expect('Content-Type', /css/);
});

test('OpenAPI route list stays aligned with the public HTTP interface', () => {
  const expectedOperations = [
    'get /api/health',
    'post /api/auth/register',
    'post /api/auth/login',
    'post /api/auth/logout',
    'get /api/auth/me',
    'patch /api/auth/me',
    'delete /api/auth/me',
    'patch /api/auth/onboarding',
    'get /api/habits',
    'post /api/habits',
    'get /api/habits/{habitId}',
    'patch /api/habits/{habitId}',
    'patch /api/habits/{habitId}/goals',
    'delete /api/habits/{habitId}',
    'get /api/goals',
    'post /api/goals',
    'post /api/habits/{habitId}/goals',
    'post /api/habits/{habitId}/goal-connections',
    'patch /api/goals/{goalId}',
    'delete /api/goals/{goalId}',
    'post /api/goals/{goalId}/cancel',
    'put /api/habits/{habitId}/completions/{date}',
    'delete /api/habits/{habitId}/completions/{date}',
    'put /api/habits/{habitId}/relapses/{date}',
    'delete /api/habits/{habitId}/relapses/{date}',
    'get /api/statistics',
    'get /api/habits/{habitId}/statistics',
    'get /api/dashboard',
    'get /api/export',
  ];
  const documentedOperations = Object.entries(openApiDocument.paths ?? {}).flatMap(([pathName, pathItem]) =>
    Object.keys(pathItem ?? {})
      .filter((method) => ['get', 'post', 'put', 'patch', 'delete'].includes(method))
      .map((method) => `${method} ${pathName}`),
  );

  expect(documentedOperations.sort()).toEqual(expectedOperations.sort());
});

test('serves pages while preserving API and missing asset 404s', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'habit-shaper-'));
  try {
    await writeFile(path.join(directory, 'index.html'), '<h1>Scaffold fixture</h1>');
    const app = createApp({ healthService: health(async () => 1), frontendDirectory: directory });
    await request(app)
      .get('/')
      .expect(200)
      .expect(/Scaffold fixture/);
    await request(app)
      .get('/app/habits')
      .set('Accept', 'text/html')
      .expect(200)
      .expect(/Scaffold fixture/);
    await request(app).get('/api/missing').expect(404).expect({ error: 'Not found' });
    await request(app).get('/assets/missing.js').expect(404);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
