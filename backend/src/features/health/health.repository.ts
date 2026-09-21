export interface HealthRepository {
  checkDatabase(): Promise<void>;
}

export function createHealthRepository(check: () => Promise<unknown>): HealthRepository {
  return {
    async checkDatabase() {
      await check();
    },
  };
}
