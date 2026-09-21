import type { HabitDetailResponse } from '../../../habits/dto/response/habit.response.js';

export type ExportGoalResponse = {
  id: string;
  title: string;
  targetDays: number;
  deadline: string | null;
  status: string;
  completedDate: string | null;
  finalProgressDays: number | null;
  createdAt: string;
  updatedAt: string;
  habitLinks: Array<{ habitId: string; connectedOn: string; disconnectedOn: string | null }>;
  progressDays: string[];
};

export type ExportResponse = {
  exportedAt: string;
  user: {
    id: string;
    email: string;
    username: string;
    timezone: string;
    onboardingCompleted: boolean;
    createdAt: string;
    updatedAt: string;
  };
  habits: HabitDetailResponse[];
  goals: ExportGoalResponse[];
};
