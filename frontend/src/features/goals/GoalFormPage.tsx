import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router';
import { z } from 'zod';
import { PageHeader } from '../../components/layout/PageHeader';
import { ApiError, localDate } from '../../lib/api';
import { dashboardKey } from '../dashboard/DashboardPage';
import { habitsApi } from '../habits/habits.api';
import { goalsApi } from './goals.api';
import styles from './GoalFormPage.module.css';
const schema = z.object({ title: z.string().trim().min(3, 'Use at least 3 characters').max(191), habitIds: z.array(z.string()).min(1, 'Choose at least one habit'), targetDays: z.number().int().min(1).max(100000), deadline: z.string().optional() });
type Values = z.infer<typeof schema>;
export function GoalFormPage() {
  const { goalId = '' } = useParams(); const [params] = useSearchParams(); const editing = !!goalId; const navigate = useNavigate(); const cache = useQueryClient();
  const habits = useQuery({ queryKey: ['habits'], queryFn: habitsApi.list }); const goals = useQuery({ queryKey: ['goals'], queryFn: goalsApi.list, enabled: editing });
  const { register, handleSubmit, reset, watch, formState: { errors, isSubmitting }, setError } = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { title: '', habitIds: params.get('habitId') ? [params.get('habitId')!] : [], targetDays: 7, deadline: '' } });
  const existing = goals.data?.goals.find(goal => goal.id === goalId);
  useEffect(() => { if (existing) reset({ title: existing.title, habitIds: existing.habits.map(habit => habit.id), targetDays: existing.targetDays, deadline: existing.deadline ?? '' }); }, [existing, reset]);
  const selected = new Set(watch('habitIds'));
  const save = async (values: Values) => { try { const input = { title: values.title, targetDays: values.targetDays, habitIds: values.habitIds, deadline: values.deadline || null }; const result = editing ? await goalsApi.update(goalId, input) : await goalsApi.createMulti(input); await Promise.all([cache.invalidateQueries({ queryKey: ['goals'] }), cache.invalidateQueries({ queryKey: dashboardKey })]); navigate(`/app/goals/${result.goal.id}`); } catch (error) { setError('root', { message: error instanceof ApiError ? error.message : 'We could not save this goal. Try again.' }); } };
  const locked = editing && existing?.status !== 'ACTIVE';
  return <><PageHeader eyebrow={editing ? 'Goal settings' : 'New finish line'} title={editing ? 'Edit the goal.' : 'Set a finish line.'} summary="Connect one or more habits. A day counts when every connected Build is done and every connected Break stays clear." /><form className={styles.layout} onSubmit={handleSubmit(save)}><section className={`${styles.form} panel`}><div className="field"><label>Goal title</label><input {...register('title')} placeholder="30 focused mornings" />{errors.title && <span className="fieldError">{errors.title.message}</span>}</div><fieldset className="field" disabled={locked}><legend>Connected habits</legend>{habits.data?.habits.map(habit => <label key={habit.id} className="cluster"><input type="checkbox" value={habit.id} {...register('habitIds')} /><span>{habit.name} · {habit.type}</span></label>)}{errors.habitIds && <span className="fieldError">{errors.habitIds.message}</span>}<span className="muted">All connected habits must resolve on the same day to add one progress day.</span></fieldset><div className={styles.row}><div className="field"><label>Target days</label><input type="number" min="1" disabled={locked} {...register('targetDays', { valueAsNumber: true })} /></div><div className="field"><label>Deadline (optional)</label><input type="date" min={localDate()} disabled={locked} {...register('deadline')} /></div></div>{errors.root && <div className="statusMessage" role="alert">{errors.root.message}</div>}<footer><Link className="plainButton" to={editing ? `/app/goals/${goalId}` : '/app/goals'}>Cancel</Link><button className="raisedPrimary" disabled={isSubmitting}>{isSubmitting ? 'Saving…' : editing ? 'Save changes' : 'Create goal'}</button></footer></section><aside><img src="/brand/icons/goal.svg" alt="" /><p className="eyebrow">Connected pattern</p><h2>{selected.size || 0} habits</h2><div><span>Target</span><strong>{watch('targetDays') || 0}</strong><small>progress days</small></div><p className={styles.note}>New connections begin today. Progress already earned stays intact.</p></aside></form></>;
}
