import { afterEach, expect, test, vi } from 'vitest';
import { statisticsApi } from './statistics.api';

afterEach(() => vi.restoreAllMocks());

test('loads aggregate statistics with one request', async () => {
  const request = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
    new Response(JSON.stringify({ histories: [] }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }),
  );

  await expect(statisticsApi.all()).resolves.toEqual([]);
  expect(request).toHaveBeenCalledTimes(1);
  expect(request).toHaveBeenCalledWith('/api/statistics', expect.objectContaining({ credentials: 'same-origin' }));
});
