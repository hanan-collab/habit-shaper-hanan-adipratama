export type HabitType = 'BUILD' | 'BREAK';
export type GoalStatus = 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
export type GamificationLevel = 'MICRO' | 'PROGRESS' | 'MILESTONE' | 'RECOVERY';
export type User = {
  id: string;
  email: string;
  username: string;
  timezone: string;
  onboardingCompleted: boolean;
  createdAt: string;
  updatedAt: string;
};
export type HabitEvent = {
  id: string;
  habitId: string;
  type: 'COMPLETED' | 'RELAPSED';
  date: string;
  note: string | null;
  createdAt: string;
};
export type Habit = {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  type: HabitType;
  startDate: string;
  createdAt: string;
  updatedAt: string;
  events?: HabitEvent[];
};
export type WeeklyStatistics = {
  period: string;
  startDate: string;
  endDate: string;
  completedDays: number;
  missedDays: number;
  eligibleDays: number;
  completionRate: number;
};
export type HabitStatistics = {
  habitId: string;
  type: HabitType;
  currentStreak: number;
  longestStreak: number;
  totalCompletions: number;
  completedThisWeek: number;
  missedThisWeek: number;
  eligibleDaysThisWeek: number;
  weeklyCompletionRate: number;
  weekly: WeeklyStatistics;
  lastRelapse: string | null;
  lastRelapseDate: string | null;
};
export type GoalProgress = { currentDays: number; remainingDays: number; percentage: number; overdue: boolean };
export type GoalHabit = {
  id: string;
  name: string;
  type: HabitType;
  connectedOn: string;
  todayStatus: 'DONE' | 'NOT_DONE' | 'CLEAR' | 'RELAPSED';
};
export type Goal = {
  id: string;
  userId: string;
  title: string;
  targetDays: number;
  deadline: string | null;
  status: GoalStatus;
  completedDate: string | null;
  createdAt: string;
  updatedAt: string;
  todayStatus: 'PENDING' | 'COMPLETE';
  habits: GoalHabit[];
  progress: GoalProgress;
};
export type GamificationEvent = {
  type: string;
  level: GamificationLevel;
  habitId?: string;
  habitType?: HabitType;
  goalId?: string;
  value?: number;
  target?: number;
  previousValue?: number;
  daysAway?: number;
};
export type DashboardHabit = Pick<Habit, 'id' | 'name' | 'description' | 'type' | 'startDate'> & {
  todayStatus: 'COMPLETED' | 'PENDING' | 'RELAPSED' | 'CLEAN';
  statistics: HabitStatistics;
  activeGoalId: string | null;
};
export type UserStatistics = {
  totalBuildCompletions: number;
  totalGoalsCompleted: number;
  bestBuildStreak: number;
  bestBreakStreak: number;
  bestOverallStreak: number;
};
export type Dashboard = {
  date: string;
  summary: { activeHabits: number; activeGoals: number };
  habits: DashboardHabit[];
  goals: Goal[];
  userStatistics: UserStatistics;
};
