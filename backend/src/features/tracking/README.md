# Tracking feature

Tracking owns BUILD completion and BREAK relapse mutations. It loads an owned habit once, reuses before/after statistics for goal synchronization and gamification, and suppresses events when an idempotent PUT finds an existing record.
