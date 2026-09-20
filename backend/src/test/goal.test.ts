import type { GoalRepository } from '../features/goals/goal.repository.js';
import { createGoalService } from '../features/goals/goal.service.js';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import type { Habit, HabitEvent } from '@prisma/client';
const today = new Date().toISOString().slice(0, 10);
const habit: Habit & {events: HabitEvent[]} = { id: 'habit-1', userId: 'user-1', name: 'Read', description: null, type: 'BUILD' as const, startDate: new Date(`${today}T00:00:00Z`), createdAt: new Date(), updatedAt: new Date(), events: [] };
const link = { id: 'link-1', goalId: 'goal-1', habitId: habit.id, connectedOn: new Date(`${today}T00:00:00Z`), disconnectedOn: null, createdAt: new Date(), habit };
const base = { id: 'goal-1', userId: 'user-1', title: 'Seven days', targetDays: 7, deadline: null, status: 'ACTIVE' as const, completedDate: null, finalProgressDays: null, lastEvaluatedDate: null, createdAt: new Date(), updatedAt: new Date(), habitLinks: [link], progressDays: [] as { id:string;goalId:string;date:Date;createdAt:Date }[] };
let current = structuredClone(base) as typeof base; let repository: GoalRepository;
beforeEach(() => {
  current = structuredClone(base) as typeof base;
  repository = {
    list: vi.fn(async () => [current]), find: vi.fn(async (_u,id) => id === current.id ? current : null),
    findHabits: vi.fn(async () => [{ id: habit.id, startDate: habit.startDate }]), findActiveByHabit: vi.fn(async () => [current]),
    create: vi.fn(async data => { current = { ...current, ...data, habitLinks: [link] }; return current; }),
    update: vi.fn(async (_id, data) => { current = { ...current, ...(data as object) }; }), replaceLinks: vi.fn(async () => undefined), connect: vi.fn(async () => undefined), disconnectHabit: vi.fn(async () => undefined),
    setProgressDay: vi.fn(async (_id,date,complete) => { current.progressDays = complete ? [{ id:'day',goalId:current.id,date,createdAt:new Date() }] : []; }), delete: vi.fn(async () => undefined),
  };
});
describe('multi-habit goal service', () => {
  test('creates a pending goal and evaluates today', async () => {
    const result = await createGoalService(repository).createMulti('user-1','UTC',{ title:'Seven days',targetDays:7,habitIds:[habit.id] });
    expect(result).toMatchObject({ status:'ACTIVE', todayStatus:'PENDING', progress:{currentDays:0} });
  });
  test('counts a day only when every connected build is complete', async () => {
    current.habitLinks[0].habit.events.push({ id:'event',habitId:habit.id,type:'COMPLETED',date:new Date(`${today}T00:00:00Z`),note:null,createdAt:new Date() });
    const result = (await createGoalService(repository).list('user-1','UTC'))[0];
    expect(result).toMatchObject({ todayStatus:'COMPLETE', progress:{currentDays:1} });
  });
  test('rejects a past deadline', async () => {
    await expect(createGoalService(repository).createMulti('user-1','UTC',{title:'Expired',targetDays:2,deadline:'2020-01-01',habitIds:[habit.id]})).rejects.toMatchObject({code:'INVALID_GOAL_DEADLINE'});
  });
  test('connects one habit to multiple active goals in one batch', async () => {
    const second = { ...structuredClone(base), id: 'goal-2', title: 'Another goal' } as typeof base;
    repository.find = vi.fn(async (_userId, id) => id === current.id ? current : id === second.id ? second : null);
    await createGoalService(repository).connectHabit('user-1', 'UTC', habit.id, [current.id, second.id]);
    expect(repository.connect).toHaveBeenCalledWith(habit.id, [current.id, second.id], expect.any(Date));
  });
});
