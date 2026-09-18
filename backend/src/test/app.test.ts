import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import request from 'supertest';
import { expect, test } from 'vitest';
import { createApp } from '../app.js';
import { createHealthRepository } from '../features/health/health.repository.js';
import { createHealthService } from '../features/health/health.service.js';

const health = (checkDatabase: () => Promise<unknown>) =>
  createHealthService(createHealthRepository(checkDatabase));

test('health reports database readiness', async () => {
  const app = createApp({ healthService: health(async () => 1) });
  const response = await request(app).get('/api/health').expect(200);
  expect(response.body).toEqual({ status: 'ok', database: 'up' });
});

test('health reports unavailability without leaking database errors', async () => {
  const app = createApp({ healthService: health(async () => { throw new Error('private connection details'); }) });
  const response = await request(app).get('/api/health').expect(503);
  expect(response.body).toEqual({ status: 'unavailable', database: 'down' });
});

test('serves pages while preserving API and missing asset 404s', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'habit-shaper-'));
  try {
    await writeFile(path.join(directory, 'index.html'), '<h1>Scaffold fixture</h1>');
    const app = createApp({ healthService: health(async () => 1), frontendDirectory: directory });
    await request(app).get('/').expect(200).expect(/Scaffold fixture/);
    await request(app).get('/app/habits').set('Accept', 'text/html').expect(200).expect(/Scaffold fixture/);
    await request(app).get('/api/missing').expect(404).expect({ error: 'Not found' });
    await request(app).get('/assets/missing.js').expect(404);
  } finally { await rm(directory, { recursive: true, force: true }); }
});
