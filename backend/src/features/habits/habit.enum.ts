export enum HabitKind {
  Build = 'BUILD',
  Break = 'BREAK',
}

export enum HabitEventKind {
  Completed = 'COMPLETED',
  Relapsed = 'RELAPSED',
}

export enum HabitErrorCode {
  NotFound = 'HABIT_NOT_FOUND',
  WrongEventType = 'HABIT_EVENT_TYPE_MISMATCH',
  InvalidEventDate = 'INVALID_HABIT_EVENT_DATE',
  InvalidStartDate = 'INVALID_HABIT_START_DATE',
  TypeHasEvents = 'HABIT_TYPE_HAS_EVENTS',
}
