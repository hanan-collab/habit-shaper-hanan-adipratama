import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useReducedMotion } from 'motion/react';
import { Link, useNavigate, useParams } from 'react-router';
import { FormOverlay } from '../../components/ui/FormOverlay';
import { HabitRelationComposer, type DraftHabit } from '../../components/ui/RelationComposer';
import { CompactHabitCard, CompletionIllustration, GoalCard } from '../../components/ui/TrackingCards';
import { useToast } from '../../components/ui/ToastProvider';
import { dashboardKey } from '../dashboard/dashboard.keys';
import { habitsApi } from '../habits/habits.api';
import { goalsApi } from './goals.api';
import styles from './GoalDetailPage.module.css';

export function GoalDetailPage() {
  const { goalId = '' } = useParams(); const navigate = useNavigate(); const cache = useQueryClient(); const reducedMotion = useReducedMotion();
  const [confirm, setConfirm] = useState<'cancel' | 'delete' | null>(null); const { pushToast } = useToast();
  const [editingHabits, setEditingHabits] = useState(false); const [habitIds, setHabitIds] = useState<string[]>([]); const [draftHabits, setDraftHabits] = useState<DraftHabit[]>([]); const [relationError, setRelationError] = useState('');
  const goals = useQuery({ queryKey: ['goals'], queryFn: goalsApi.list }); const goal = goals.data?.goals.find(item => item.id === goalId);
  const habits = useQuery({ queryKey: ['habits'], queryFn: habitsApi.list });
  const refresh = () => Promise.all([cache.invalidateQueries({ queryKey: ['goals'] }), cache.invalidateQueries({ queryKey: dashboardKey })]);
  const mutationError = () => pushToast({ variant: 'error', title: 'Goal unchanged', message: 'We could not save that action. Try again.' });
  const cancel = useMutation({ mutationFn: () => goalsApi.cancel(goalId), onSuccess: async () => { setConfirm(null); await refresh(); }, onError: mutationError });
  const remove = useMutation({ mutationFn: () => goalsApi.delete(goalId), onSuccess: async () => { await refresh(); navigate('/app/goals', { replace: true }); }, onError: mutationError });
  const saveHabits = useMutation({ mutationFn: () => goalsApi.update(goalId, { habitIds, newHabits: draftHabits.map(({ key: _key, ...draft }) => draft) }), onSuccess: async () => { setEditingHabits(false); setDraftHabits([]); await Promise.all([refresh(), cache.invalidateQueries({ queryKey: ['habits'] }), cache.invalidateQueries({ queryKey: ['statistics'] })]); }, onError: error => setRelationError(error instanceof Error ? error.message : 'Could not save connections.') });
  if (goals.isLoading) return <div className="stack"><div className="skeleton" /><div className="skeleton" /></div>;
  if (goals.isError) return <section className="panel"><h2>We couldn't load this goal.</h2><button className="raisedSecondary" onClick={() => goals.refetch()}>Retry</button></section>;
  if (!goal) return <section className="panel"><h2>Goal not found.</h2><Link className="raisedSecondary" to="/app/goals">Back to goals</Link></section>;
  const created = new Date(goal.createdAt).toLocaleDateString('en', { dateStyle: 'medium' }); const pending = cancel.isPending || remove.isPending;
  return <>
    <header className={styles.header}><div><div className="cluster"><span className={`${styles.status} ${styles[goal.status.toLowerCase()]}`}>{goal.status}</span><span className="muted">Created {created}</span></div><h1>{goal.title}</h1></div><Link className="raisedSecondary" to={`/app/goals/${goalId}/edit`}>Edit goal</Link></header>
    {goal.status === 'COMPLETED' && <CompletionIllustration title={`${goal.targetDays} days. Done.`} copy="Habits stay active and can support other goals." />}
    <section className={styles.sharedGoal}><GoalCard goal={goal} variant="library" reducedMotion={Boolean(reducedMotion)} /></section>
    <section className="panel"><p className="eyebrow">Connected habits</p><h2>Habits for this goal.</h2><div className={styles.habits}>{goal.habits.map(habit => <CompactHabitCard key={habit.id} habit={habit} />)}</div>{goal.status === 'ACTIVE' && <button className="raisedSecondary" onClick={() => { setHabitIds(goal.habits.map(habit => habit.id)); setDraftHabits([]); setRelationError(''); setEditingHabits(true); }}>Manage habits</button>}</section>
    <section className={styles.actions}><h2>Goal actions.</h2><p>Habits remain active if this goal is cancelled or deleted.</p><div className="cluster">{goal.status === 'ACTIVE' && <button className="raisedSecondary" onClick={() => setConfirm('cancel')}>Cancel goal</button>}<button className="plainButton" onClick={() => setConfirm('delete')}>Delete goal</button></div></section>
    {editingHabits && <FormOverlay eyebrow="Goal relationships" title="Connected habits." pending={saveHabits.isPending} onClose={() => setEditingHabits(false)} footer={<><button className="plainButton" disabled={saveHabits.isPending} onClick={() => setEditingHabits(false)}>Cancel</button><button className="raisedPrimary" disabled={saveHabits.isPending || habitIds.length + draftHabits.length < 1} onClick={() => saveHabits.mutate()}>{saveHabits.isPending ? 'Saving…' : 'Save connections'}</button></>}><HabitRelationComposer habits={habits.data?.habits ?? []} selectedIds={habitIds} drafts={draftHabits} onSelectedIds={setHabitIds} onDrafts={setDraftHabits} pending={saveHabits.isPending} error={relationError} onError={setRelationError} /></FormOverlay>}
    {confirm && <FormOverlay eyebrow={confirm === 'cancel' ? 'Cancel goal' : 'Delete goal'} title={confirm === 'cancel' ? 'Cancel this goal?' : 'Delete this goal?'} copy={confirm === 'cancel' ? 'Progress is kept, but no new progress days will be added.' : 'The goal and its progress will be permanently deleted.'} pending={pending} onClose={() => setConfirm(null)} footer={<><button className="plainButton" disabled={pending} onClick={() => setConfirm(null)}>Keep goal</button><button className="raisedPrimary" disabled={pending} onClick={() => confirm === 'cancel' ? cancel.mutate() : remove.mutate()}>{pending ? 'Saving…' : confirm === 'cancel' ? 'Cancel goal' : 'Delete goal'}</button></>}><p>Connected habits will not be changed.</p></FormOverlay>}
  </>;
}
