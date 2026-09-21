import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, test, vi } from 'vitest';
import type { Goal, Habit } from '../../types/domain';
import { GoalRelationComposer, HabitRelationComposer, type DraftGoal, type DraftHabit } from './RelationComposer';

const habit: Habit = {
  id: 'habit-1',
  userId: 'user-1',
  name: 'Read',
  description: null,
  type: 'BUILD',
  startDate: '2026-09-21',
  createdAt: '',
  updatedAt: '',
};
const goal: Goal = {
  id: 'goal-1',
  userId: 'user-1',
  title: 'Focused week',
  targetDays: 7,
  deadline: null,
  status: 'ACTIVE',
  completedDate: null,
  createdAt: '',
  updatedAt: '',
  todayStatus: 'PENDING',
  habits: [],
  progress: { currentDays: 0, remainingDays: 7, percentage: 0, overdue: false },
};

function HabitHarness() {
  const [ids, setIds] = useState<string[]>([]);
  const [drafts, setDrafts] = useState<DraftHabit[]>([]);
  const [error, setError] = useState('');
  return (
    <HabitRelationComposer
      habits={[habit]}
      selectedIds={ids}
      drafts={drafts}
      onSelectedIds={setIds}
      onDrafts={setDrafts}
      error={error}
      onError={setError}
    />
  );
}
function GoalHarness() {
  const [ids, setIds] = useState<string[]>([]);
  const [drafts, setDrafts] = useState<DraftGoal[]>([]);
  const [error, setError] = useState('');
  return (
    <GoalRelationComposer
      goals={[goal]}
      selectedIds={ids}
      drafts={drafts}
      onSelectedIds={setIds}
      onDrafts={setDrafts}
      error={error}
      onError={setError}
    />
  );
}

describe('relation composer staging', () => {
  test('stages an existing habit and multiple new habits without requests', () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    render(<HabitHarness />);
    expect(screen.getByRole('option', { name: /Read/ })).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Search connected habits'), { target: { value: 'read' } });
    fireEvent.click(screen.getByRole('option', { name: /Read/ }));
    const input = screen.getByLabelText('New habit name');
    fireEvent.change(input, { target: { value: 'Walk' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    fireEvent.change(input, { target: { value: 'Journal' } });
    fireEvent.click(screen.getByRole('button', { name: /Add habit/ }));
    expect(screen.getByText('Read')).toBeInTheDocument();
    expect(screen.getByText('Walk')).toBeInTheDocument();
    expect(screen.getByText('Journal')).toBeInTheDocument();
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });
  test('rejects normalized duplicate drafts and supports removal', () => {
    render(<GoalHarness />);
    const input = screen.getByLabelText('New goal title');
    fireEvent.change(input, { target: { value: 'Clear Month' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    fireEvent.change(input, { target: { value: ' clear month ' } });
    fireEvent.click(screen.getByRole('button', { name: /Add goal/ }));
    expect(screen.getByRole('alert')).toHaveTextContent('Already added.');
    fireEvent.click(screen.getByRole('button', { name: 'Remove Clear Month' }));
    expect(screen.queryByText('Clear Month')).not.toBeInTheDocument();
  });
  test('adds the first search result with Enter', () => {
    render(<GoalHarness />);
    const search = screen.getByLabelText('Search connected goals');
    fireEvent.change(search, { target: { value: 'focus' } });
    fireEvent.keyDown(search, { key: 'Enter' });
    expect(screen.getByText('Focused week')).toBeInTheDocument();
    expect(screen.getByText('Existing')).toBeInTheDocument();
  });
});
