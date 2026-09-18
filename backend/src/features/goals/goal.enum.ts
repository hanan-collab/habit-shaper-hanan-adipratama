export enum GoalState {
  Active = 'ACTIVE',
  Completed = 'COMPLETED',
  Cancelled = 'CANCELLED',
}

export enum GoalErrorCode {
  HabitNotFound = 'GOAL_HABIT_NOT_FOUND',
  NotFound = 'GOAL_NOT_FOUND',
  ActiveExists = 'ACTIVE_GOAL_EXISTS',
  NotActive = 'GOAL_NOT_ACTIVE',
  InvalidDeadline = 'INVALID_GOAL_DEADLINE',
}
