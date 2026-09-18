export enum GamificationAction {
  HabitCreated = 'HABIT_CREATED',
  BuildCompleted = 'BUILD_COMPLETED',
  BreakRelapsed = 'BREAK_RELAPSED',
}

export enum GamificationLevel {
  Micro = 'MICRO',
  Progress = 'PROGRESS',
  Milestone = 'MILESTONE',
  Recovery = 'RECOVERY',
}

export enum GamificationEventType {
  HabitCreated = 'HABIT_CREATED',
  FirstCheckIn = 'FIRST_CHECK_IN',
  DailyCompletion = 'DAILY_COMPLETION',
  StreakStarted = 'STREAK_STARTED',
  StreakMilestone = 'STREAK_MILESTONE',
  PersonalBest = 'PERSONAL_BEST',
  GoalHalfway = 'GOAL_HALFWAY',
  GoalNearlyReached = 'GOAL_NEARLY_REACHED',
  GoalCompleted = 'GOAL_COMPLETED',
  PerfectWeek = 'PERFECT_WEEK',
  RelapseRecorded = 'RELAPSE_RECORDED',
  Comeback = 'COMEBACK',
}
