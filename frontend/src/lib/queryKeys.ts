export const queryKeys = {
  session: ['session'] as const,
  dashboard: ['dashboard'] as const,
  habits: {
    all: ['habits'] as const,
    detail: (id: string) => ['habits', 'detail', id] as const,
    statistics: (id: string) => ['habits', 'statistics', id] as const,
  },
  goals: {
    all: ['goals'] as const,
  },
  statistics: {
    all: ['statistics', 'all'] as const,
    summary: ['statistics', 'summary'] as const,
  },
};
