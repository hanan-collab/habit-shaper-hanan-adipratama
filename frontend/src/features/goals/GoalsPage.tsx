import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useReducedMotion } from 'motion/react';
import { Link } from 'react-router';
import { PageHeader } from '../../components/layout/PageHeader';
import { GoalCard, StatusChip } from '../../components/ui/TrackingCards';
import { goalsApi } from './goals.api';
import styles from './GoalsPage.module.css';

export function GoalsPage() {
  const query = useQuery({ queryKey: ['goals'], queryFn: goalsApi.list });
  const reducedMotion = useReducedMotion();
  const [archiveOpen, setArchiveOpen] = useState(false);
  if (query.isLoading) return <div className="stack"><div className="skeleton" /><div className="skeleton" /></div>;
  if (query.isError) return <section className="panel"><h2>We couldn't load your goals.</h2><button className="raisedSecondary" onClick={() => query.refetch()}>Retry</button></section>;
  const active = query.data!.goals.filter(goal => goal.status === 'ACTIVE');
  const archive = query.data!.goals.filter(goal => goal.status !== 'ACTIVE');
  return <>
    <PageHeader eyebrow="Optional finish lines" title="Goals." action={<Link className="raisedPrimary" to="/app/goals/new">Create goal</Link>} />
    {active.length ? <section className={styles.active}><p className="eyebrow">Active goals</p><div className={styles.grid}>{active.map(goal => <GoalCard key={goal.id} goal={goal} variant="library" reducedMotion={Boolean(reducedMotion)} />)}</div></section>
      : <section className={styles.empty}><img src="/brand/patterns/step-grid.svg" alt="" /><h2>No active goals.</h2><p>Goals are optional. Add one when a target helps.</p><Link className="raisedPrimary" to="/app/goals/new">Create goal</Link></section>}
    {archive.length > 0 && <section className={styles.archive}><button onClick={() => setArchiveOpen(!archiveOpen)} aria-expanded={archiveOpen}><span><small>History</small><strong>Completed &amp; cancelled</strong></span><b>{archive.length} {archiveOpen ? '−' : '+'}</b></button>{archiveOpen && <div>{archive.map(goal => <Link key={goal.id} to={`/app/goals/${goal.id}`}><StatusChip tone={goal.status === 'COMPLETED' ? 'success' : 'neutral'}>{goal.status}</StatusChip><strong>{goal.title}</strong><small>{goal.progress.currentDays} / {goal.targetDays} days</small></Link>)}</div>}</section>}
  </>;
}
