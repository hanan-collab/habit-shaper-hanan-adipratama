import { AppError } from '../../common/app-error.js';
import { toCalendarDate } from '../../common/calendar-date.js';
import { habitDetailResponse } from '../habits/habit.model.js';
import type { ExportResponse } from './dto/response/export.response.js';
import type { ExportRepository } from './export.repository.js';

export interface ExportService {
  get(userId: string): Promise<ExportResponse>;
}

export function createExportService(repository: ExportRepository, now: () => Date = () => new Date()): ExportService {
  return {
    async get(userId) {
      const source = await repository.find(userId);
      if (!source) throw new AppError(404, 'USER_NOT_FOUND', 'User not found');
      const { habits, goals, ...user } = source;
      return {
        exportedAt: now().toISOString(),
        user: { ...user, createdAt: user.createdAt.toISOString(), updatedAt: user.updatedAt.toISOString() },
        habits: habits.map(habitDetailResponse),
        goals: goals.map((goal) => ({
          id: goal.id,
          title: goal.title,
          targetDays: goal.targetDays,
          deadline: goal.deadline ? toCalendarDate(goal.deadline) : null,
          status: goal.status,
          completedDate: goal.completedDate ? toCalendarDate(goal.completedDate) : null,
          finalProgressDays: goal.finalProgressDays,
          createdAt: goal.createdAt.toISOString(),
          updatedAt: goal.updatedAt.toISOString(),
          habitLinks: goal.habitLinks.map((link) => ({
            habitId: link.habitId,
            connectedOn: toCalendarDate(link.connectedOn),
            disconnectedOn: link.disconnectedOn ? toCalendarDate(link.disconnectedOn) : null,
          })),
          progressDays: goal.progressDays.map((day) => toCalendarDate(day.date)),
        })),
      };
    },
  };
}
