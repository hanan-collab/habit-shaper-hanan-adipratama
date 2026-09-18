import type { DatabaseStatus, HealthStatus } from './health.enum.js';

export type HealthModel = { status: HealthStatus; database: DatabaseStatus };
