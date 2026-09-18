export enum TrackingEventKind {
  Completed = 'COMPLETED',
  Relapsed = 'RELAPSED',
}

export enum TrackingErrorCode {
  HabitNotFound = 'TRACKING_HABIT_NOT_FOUND',
  WrongEventType = 'TRACKING_EVENT_TYPE_MISMATCH',
  InvalidEventDate = 'INVALID_TRACKING_EVENT_DATE',
}
