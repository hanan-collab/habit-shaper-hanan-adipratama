import { api } from '../../lib/api';
import type { HabitHistory } from './statistics.domain';
import type { AllStatisticsResponse } from './dto/response/statistics.response';

export const statisticsApi = {
  async all(): Promise<HabitHistory[]> {
    return (await api<AllStatisticsResponse>('/statistics')).histories;
  },
};
