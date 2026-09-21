import type { Habit, User } from '../../../../types/domain';

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
  user: User;
  habits: Habit[];
  goals: ExportGoalResponse[];
};
