import { afterEach, expect, test, vi } from 'vitest';
import { exportApi } from './export.api';

afterEach(() => vi.restoreAllMocks());

test('downloads the complete export with one request', async () => {
  const payload = { exportedAt: '2026-09-21T00:00:00.000Z', user: {}, habits: [], goals: [] };
  const request = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
    new Response(JSON.stringify(payload), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }),
  );

  await expect(exportApi.get()).resolves.toEqual(payload);
  expect(request).toHaveBeenCalledTimes(1);
  expect(request).toHaveBeenCalledWith('/api/export', expect.objectContaining({ credentials: 'same-origin' }));
});
