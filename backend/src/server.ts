import { fileURLToPath } from 'node:url';
import { createApp } from './app.js';
import { env } from './config/env.js';
import { prisma } from './lib/prisma.js';

const app = createApp({
  checkDatabase: () => prisma.$queryRaw`SELECT 1`,
  frontendDirectory: fileURLToPath(new URL('../../frontend/dist/', import.meta.url)),
});
const server = app.listen(env.PORT, '0.0.0.0', () => console.log(`Habit Shaper listening on ${env.PORT}`));

for (const signal of ['SIGTERM', 'SIGINT'] as const) {
  process.once(signal, () => {
    const timeout = setTimeout(() => process.exit(1), 10000).unref();
    server.close(() => { void prisma.$disconnect().finally(() => { clearTimeout(timeout); process.exit(0); }); });
  });
}
