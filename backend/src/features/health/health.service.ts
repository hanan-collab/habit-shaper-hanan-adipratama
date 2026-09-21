import { DatabaseStatus, HealthStatus } from './health.enum.js';
import type { HealthModel } from './health.model.js';
import type { HealthRepository } from './health.repository.js';

export interface HealthService {
  getHealth(): Promise<HealthModel>;
}

export function createHealthService(repository: HealthRepository): HealthService {
  return {
    async getHealth() {
      try {
        await repository.checkDatabase();
        return { status: HealthStatus.Ok, database: DatabaseStatus.Up };
      } catch {
        return { status: HealthStatus.Unavailable, database: DatabaseStatus.Down };
      }
    },
  };
}
