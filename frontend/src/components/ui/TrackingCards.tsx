import { motion } from 'motion/react';
import { Link } from 'react-router';
import { NumberTicker, Particles } from '../magicui';
import type { DashboardHabit, Goal, GoalHabit } from '../../types/domain';
import { HabitIcon } from './HabitIcon';
import styles from './TrackingCards.module.css';

export type CardVariant = 'today' | 'library' | 'compact';

export const isGoalHabitResolved = (habit: Pick<GoalHabit, 'todayStatus'>) =>
  habit.todayStatus === 'DONE' || habit.todayStatus === 'CLEAR';

const percentage = (value: number, total: number) => (total ? Math.round((value / total) * 100) : 0);

export function StatusChip({
  children,
  tone = 'neutral',
}: {
  children: React.ReactNode;
  tone?: 'neutral' | 'success' | 'danger';
}) {
  return <span className={`${styles.statusChip} ${styles[tone]}`}>{children}</span>;
}

export function HabitCard({
  habit,
  variant = 'today',
  burst = false,
  pending = false,
  newItem = false,
  index = 0,
  reducedMotion = false,
  to = `/app/habits/${habit.id}`,
  onAction,
  streakNumberClassName,
}: {
  habit: DashboardHabit;
  variant?: CardVariant;
  burst?: boolean;
  pending?: boolean;
  newItem?: boolean;
  index?: number;
  reducedMotion?: boolean;
  to?: string;
  onAction?: () => void;
  streakNumberClassName?: string;
}) {
  const acted = habit.type === 'BUILD' ? habit.todayStatus === 'COMPLETED' : habit.todayStatus === 'RELAPSED';
  const status =
    habit.type === 'BUILD' ? (acted ? 'Completed today' : 'Pending today') : acted ? 'Relapse reported' : 'Clear today';
  const actionLabel =
    habit.type === 'BUILD'
      ? acted
        ? 'Cancel completion'
        : 'Complete today'
      : acted
        ? 'Cancel report'
        : 'Report relapse';

  return (
    <motion.article
      layout
      initial={reducedMotion ? false : { opacity: 0, y: newItem ? 34 : 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: newItem ? 0 : index * 0.04 }}
      className={`${styles.habitCard} ${styles[variant]} ${acted ? styles.habitActed : ''}`}
    >
      {burst && <Particles burstKey={habit.id} />}
      <div className={styles.habitBody}>
        <HabitIcon seed={habit.id} />
        <div className={styles.habitIdentity}>
          <small>{habit.type} · DAILY</small>
          <h3>{habit.name}</h3>
          {habit.description && variant !== 'compact' && <p>{habit.description}</p>}
          <StatusChip tone={acted ? (habit.type === 'BUILD' ? 'success' : 'danger') : 'neutral'}>{status}</StatusChip>
        </div>
        <motion.div
          key={habit.statistics.currentStreak}
          className={styles.habitStreak}
          initial={reducedMotion ? false : { scale: 1.16 }}
          animate={{ scale: 1 }}
        >
          <div>
            <strong>
              <NumberTicker className={streakNumberClassName} value={habit.statistics.currentStreak} />
            </strong>
            {habit.statistics.currentStreak > 0 && <img src="/brand/motion/flame-active.svg" alt="" />}
          </div>
          <span>{habit.type === 'BUILD' ? 'DAY STREAK' : 'CLEAN STREAK'}</span>
        </motion.div>
      </div>
      <div className={styles.cardActions}>
        <Link className={styles.detailLink} to={to}>
          {variant === 'compact' ? 'Open' : 'See detail'}
        </Link>
        {onAction && (
          <button
            type="button"
            className={`${styles.habitAction} ${acted ? styles.passiveAction : ''}`}
            disabled={pending}
            onClick={onAction}
          >
            {pending ? 'Saving…' : actionLabel}
          </button>
        )}
      </div>
    </motion.article>
  );
}

export function CompactHabitCard({ habit, to = `/app/habits/${habit.id}` }: { habit: GoalHabit; to?: string }) {
  const resolved = isGoalHabitResolved(habit);
  const status =
    habit.type === 'BUILD'
      ? resolved
        ? 'Completed today'
        : 'Pending today'
      : resolved
        ? 'Clear today'
        : 'Relapse reported';
  return (
    <article className={`${styles.compactRelation} ${resolved ? styles.relationResolved : ''}`}>
      <img src={`/brand/icons/${habit.type.toLowerCase()}.svg`} alt="" />
      <div>
        <small>{habit.type} · DAILY</small>
        <h3>{habit.name}</h3>
        <StatusChip tone={resolved ? 'success' : habit.type === 'BREAK' ? 'danger' : 'neutral'}>{status}</StatusChip>
      </div>
      <Link to={to}>Open</Link>
    </article>
  );
}

export function GoalCard({
  goal,
  variant = 'today',
  reducedMotion = false,
  to = `/app/goals/${goal.id}`,
}: {
  goal: Goal;
  variant?: CardVariant;
  reducedMotion?: boolean;
  to?: string;
}) {
  const resolved = goal.habits.filter(isGoalHabitResolved).length;
  const dailyProgress = percentage(resolved, goal.habits.length);
  return (
    <article className={`${styles.goalCard} ${styles[variant]} ${styles[`goal${goal.status}`]}`}>
      <div className={styles.goalBrand}>
        <span>
          <img src="/brand/icons/goal.svg" alt="" />
        </span>
        <strong>
          {goal.progress.currentDays}/{goal.targetDays}
        </strong>
        <small>progress days</small>
      </div>
      <div className={styles.goalCopy}>
        <div className={styles.goalMeta}>
          <StatusChip tone={goal.status === 'COMPLETED' ? 'success' : 'neutral'}>
            {goal.status === 'ACTIVE'
              ? goal.todayStatus === 'COMPLETE'
                ? 'Complete today'
                : 'Active today'
              : goal.status}
          </StatusChip>
          <small>{goal.deadline ? `Due ${goal.deadline}` : 'No deadline'}</small>
        </div>
        <h3>{goal.title}</h3>
        {variant !== 'compact' && (
          <ul>
            {goal.habits.map((habit) => (
              <li key={habit.id}>
                <b>{habit.name}</b>
                <span className={isGoalHabitResolved(habit) ? styles.resolvedHabit : ''}>
                  {habit.type === 'BUILD'
                    ? habit.todayStatus === 'DONE'
                      ? 'Build · Done'
                      : 'Build · Pending'
                    : habit.todayStatus === 'CLEAR'
                      ? 'Break · Clean'
                      : 'Break · Relapsed'}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div
        className={styles.goalHabitProgress}
        role="img"
        aria-label={`${resolved} of ${goal.habits.length} habits resolved today`}
      >
        <svg viewBox="0 0 100 100" aria-hidden="true">
          <circle cx="50" cy="50" r="42" />
          <motion.circle
            className={styles.goalHabitProgressValue}
            cx="50"
            cy="50"
            r="42"
            pathLength="1"
            initial={reducedMotion ? false : { pathLength: 0 }}
            animate={{ pathLength: dailyProgress / 100 }}
          />
        </svg>
        <strong>
          {resolved}/{goal.habits.length}
        </strong>
      </div>
      <Link className={styles.goalDetail} to={to}>
        {variant === 'compact' ? 'Open' : 'Go'}
      </Link>
    </article>
  );
}

export function CompletionIllustration({ title = 'Target reached.', copy }: { title?: string; copy?: string }) {
  return (
    <section className={styles.completion} role="status">
      <img src="/brand/motion/completion-success.svg" alt="" />
      <div>
        <StatusChip tone="success">Complete</StatusChip>
        <h2>{title}</h2>
        {copy && <p>{copy}</p>}
      </div>
    </section>
  );
}
