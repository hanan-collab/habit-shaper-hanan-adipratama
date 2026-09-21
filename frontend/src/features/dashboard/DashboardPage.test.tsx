import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, test, vi } from 'vitest';
import type { DashboardHabit, Goal } from '../../types/domain';
import { AllGoalsCompleteState, GoalTodayCard, HabitTodayCard, isGoalHabitResolved, isHabitResolved, quickGoalInput, QuickAddDialog } from './DashboardPage';
import styles from './DashboardPage.module.css';

const statistics = { habitId: 'habit', type: 'BUILD' as const, currentStreak: 0, longestStreak: 0, totalCompletions: 0, completedThisWeek: 0, missedThisWeek: 0, eligibleDaysThisWeek: 1, weeklyCompletionRate: 0, weekly: { period: 'week', startDate: '2026-09-14', endDate: '2026-09-20', completedDays: 0, missedDays: 0, eligibleDays: 1, completionRate: 0 }, lastRelapse: null, lastRelapseDate: null };
const habit = (type: DashboardHabit['type'], todayStatus: DashboardHabit['todayStatus']): DashboardHabit => ({ id: `${type}-${todayStatus}`, name: 'Daily action', description: null, type, startDate: '2026-09-20', todayStatus, statistics: { ...statistics, type }, activeGoalId: null });
const goal: Goal = { id: 'goal-1', userId: 'user', title: 'Focused week', targetDays: 7, deadline: null, status: 'ACTIVE', completedDate: null, createdAt: '2026-09-20', updatedAt: '2026-09-20', todayStatus: 'PENDING', progress: { currentDays: 3, remainingDays: 4, percentage: 42.86, overdue: false }, habits: [{ id: 'build', name: 'Read', type: 'BUILD', connectedOn: '2026-09-20', todayStatus: 'DONE' }, { id: 'break', name: 'No soda', type: 'BREAK', connectedOn: '2026-09-20', todayStatus: 'CLEAR' }] };

describe('Today cards', () => {
  test('shows an accessible animated illustration when every goal is clear', () => {
    render(<AllGoalsCompleteState reducedMotion />);
    const status = screen.getByRole('status');
    expect(status).toHaveTextContent('All clear');
    expect(status).toHaveTextContent('You kept every promise to yourself today.');
    expect(status).toHaveTextContent('Take the win. You showed up for every goal.');
    expect(status.querySelector('img')).toHaveAttribute('src', '/brand/motion/completion-success.svg');
  });

  test('resolves build completion and clean break days', () => {
    expect(isHabitResolved(habit('BUILD', 'COMPLETED'))).toBe(true);
    expect(isHabitResolved(habit('BREAK', 'CLEAN'))).toBe(true);
    expect(isHabitResolved(habit('BREAK', 'RELAPSED'))).toBe(false);
    expect(goal.habits.every(isGoalHabitResolved)).toBe(true);
  });

  test('shows connected-habit circular progress and daily statuses', () => {
    render(<MemoryRouter><GoalTodayCard goal={goal} reducedMotion /></MemoryRouter>);
    expect(screen.getByLabelText('2 of 2 habits resolved today')).toHaveTextContent('2/2');
    expect(screen.getByText('Build · Done')).toBeInTheDocument();
    expect(screen.getByText('Break · Clean')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Go' })).toHaveAttribute('href', '/app/goals/goal-1');
  });

  test('uses active and passive actions consistently for Build and Break', () => {
    const onAction = vi.fn();
    const props = { burst: false, pending: false, newItem: false, index: 0, reducedMotion: true, onAction };
    const { rerender } = render(<MemoryRouter><HabitTodayCard habit={habit('BUILD', 'PENDING')} {...props} /></MemoryRouter>);
    expect(screen.getByText('0')).toHaveClass(styles.habitStreakNumber);
    expect(screen.getByText('0').parentElement?.tagName).toBe('STRONG');
    fireEvent.click(screen.getByRole('button', { name: 'Complete today' }));
    expect(onAction).toHaveBeenCalledOnce();
    rerender(<MemoryRouter><HabitTodayCard habit={habit('BUILD', 'COMPLETED')} {...props} /></MemoryRouter>);
    expect(screen.getByRole('button', { name: 'Cancel completion' })).toBeInTheDocument();
    rerender(<MemoryRouter><HabitTodayCard habit={habit('BREAK', 'CLEAN')} {...props} /></MemoryRouter>);
    expect(screen.getByRole('button', { name: 'Report relapse' })).toBeInTheDocument();
    expect(document.querySelector('img[src="/brand/motion/flame-active.svg"]')).not.toBeInTheDocument();
    rerender(<MemoryRouter><HabitTodayCard habit={habit('BREAK', 'RELAPSED')} {...props} /></MemoryRouter>);
    expect(screen.getByRole('button', { name: 'Cancel report' })).toBeInTheDocument();
  });
});

test('Quick Add exposes type choices and stages existing goals in a preview', () => {
  const onType = vi.fn();
  const onSelectedGoalIds = vi.fn();
  render(<QuickAddDialog type="BUILD" typeLocked={false} value="Read" pending={false} onType={onType} onChange={vi.fn()} onClose={vi.fn()} onSubmit={vi.fn()} goals={[goal, { ...goal, id: 'goal-2', title: 'Second goal' }]} goalMode="existing" onGoalMode={vi.fn()} selectedGoalIds={['goal-1']} onSelectedGoalIds={onSelectedGoalIds} newGoalTitle="" onNewGoalTitle={vi.fn()} newGoalTarget={7} onNewGoalTarget={vi.fn()} newGoalDeadline="" onNewGoalDeadline={vi.fn()} minimumDeadline="2026-09-20" />);
  expect(screen.getByText('Existing')).toBeInTheDocument();
  expect(screen.getByRole('radio', { name: /Build/ })).toBeChecked();
  fireEvent.click(screen.getByRole('radio', { name: /Break/ }));
  expect(onType).toHaveBeenCalledWith('BREAK');
  fireEvent.change(screen.getByLabelText('Search connected goals'), { target: { value: 'Second' } });
  fireEvent.click(screen.getByRole('option', { name: /Second goal/ }));
  expect(onSelectedGoalIds).toHaveBeenCalledWith(['goal-1', 'goal-2']);
});

test('Quick Add stages new goals through the shared composer', () => {
  const onDraftGoals = vi.fn();
  render(<QuickAddDialog type="BREAK" typeLocked={false} value="No soda" pending={false} onType={vi.fn()} onChange={vi.fn()} onClose={vi.fn()} onSubmit={vi.fn()} goals={[]} goalMode="new" onGoalMode={vi.fn()} selectedGoalIds={[]} onSelectedGoalIds={vi.fn()} newGoalTitle="" onNewGoalTitle={vi.fn()} newGoalTarget={7} onNewGoalTarget={vi.fn()} newGoalDeadline="" onNewGoalDeadline={vi.fn()} minimumDeadline="2026-09-20" draftGoals={[]} onDraftGoals={onDraftGoals} />);
  fireEvent.change(screen.getByLabelText('New goal title'), { target: { value: 'Clear month' } });
  fireEvent.change(screen.getByLabelText('Target days'), { target: { value: '30' } });
  fireEvent.change(screen.getByLabelText('Goal deadline'), { target: { value: '2026-10-20' } });
  fireEvent.click(screen.getByRole('button', { name: /Add goal/ }));
  expect(onDraftGoals).toHaveBeenCalledWith([expect.objectContaining({ title: 'Clear month', targetDays: 30, deadline: '2026-10-20' })]);
  expect(quickGoalInput('  Clear month ', 30, '', 'habit-1')).toEqual({ title: 'Clear month', targetDays: 30, deadline: null, habitIds: ['habit-1'] });
  expect(quickGoalInput('Clear month', 30, '2026-10-20', 'habit-1').deadline).toBe('2026-10-20');
});
