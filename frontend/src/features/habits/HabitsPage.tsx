import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useReducedMotion } from 'motion/react';
import { Link } from 'react-router';
import { PageHeader } from '../../components/layout/PageHeader';
import { HabitCard } from '../../components/ui/TrackingCards';
import type { GamificationEvent, HabitType } from '../../types/domain';
import { dashboardApi } from '../dashboard/dashboard.api';
import { dashboardKey } from '../dashboard/dashboard.keys';
import { EventResponse } from '../gamification/EventResponse';
import { useHabitAction } from './useHabitAction';
import styles from './HabitsPage.module.css';

export function HabitsPage() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'ALL' | HabitType>('ALL');
  const [events, setEvents] = useState<GamificationEvent[]>([]);
  const reducedMotion = useReducedMotion();
  const query = useQuery({ queryKey: dashboardKey, queryFn: dashboardApi.get });
  const allHabits = query.data?.dashboard.habits ?? [];
  const habitAction = useHabitAction(allHabits, setEvents);
  const habits = useMemo(() => allHabits.filter(habit =>
    (filter === 'ALL' || habit.type === filter) && habit.name.toLowerCase().includes(search.trim().toLowerCase())
  ), [allHabits, filter, search]);
  const filtered = Boolean(search.trim() || filter !== 'ALL');

  return <>
    <PageHeader eyebrow="Habit library" title="Habits." action={<Link className="raisedPrimary" to="/app/habits/new">Create habit</Link>} />
    <section className={styles.tools}>
      <label><span className="srOnly">Search habits</span><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search habits…" /></label>
      <div role="group" aria-label="Filter habits">{(['ALL', 'BUILD', 'BREAK'] as const).map(value => <button key={value} onClick={() => setFilter(value)} className={filter === value ? styles.active : undefined}>{value[0] + value.slice(1).toLowerCase()}</button>)}</div>
    </section>
    {query.isLoading ? <div className={styles.grid}><div className="skeleton" /><div className="skeleton" /></div>
      : query.isError ? <section className="panel"><h2>We couldn't load your habits.</h2><button className="raisedSecondary" onClick={() => query.refetch()}>Retry</button></section>
      : habits.length ? <section className={styles.grid}>{habits.map((habit, index) => <HabitCard key={habit.id} habit={habit} variant="library" index={index} reducedMotion={Boolean(reducedMotion)} burst={habitAction.burstId === habit.id} pending={habitAction.pendingId === habit.id} onAction={() => habitAction.act(habit)} />)}</section>
      : <section className={styles.empty}><img src="/brand/patterns/step-grid.svg" alt="" /><h2>{filtered ? 'No matches.' : 'No habits yet.'}</h2><p>{filtered ? 'Try another search or filter.' : 'Create one daily action.'}</p>{filtered ? <button className="raisedSecondary" onClick={() => { setSearch(''); setFilter('ALL'); }}>Clear filters</button> : <Link className="raisedPrimary" to="/app/habits/new">Create habit</Link>}</section>}
    {habitAction.dialog}
    <EventResponse events={events} onDismiss={() => setEvents([])} />
  </>;
}
