# User statistics feature

`UserStatisticsService` derives user-level totals and best streaks from already calculated habit statistics and goal state. It has no repository or database model because these values are never persisted. Dashboard orchestration batch-loads the source records and calls it once per request.
