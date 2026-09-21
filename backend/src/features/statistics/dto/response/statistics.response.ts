import type { HabitStatisticsModel } from '../../statistics.model.js';
import type { HabitDetailResponse } from '../../../habits/dto/response/habit.response.js';

export type StatisticsResponse = { statistics: HabitStatisticsModel };
export type AllStatisticsResponse = {
  histories: Array<{ habit: HabitDetailResponse; statistics: HabitStatisticsModel }>;
};
