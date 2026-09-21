import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router';
import { z } from 'zod';
import { PageHeader } from '../../components/layout/PageHeader';
import { FormOverlay } from '../../components/ui/FormOverlay';
import { HabitRelationComposer } from '../../components/ui/RelationComposer';
import type { DraftHabit } from '../../types/relations';
import { ApiError, localDate } from '../../lib/api';
import { queryKeys } from '../../lib/queryKeys';
import { useSession } from '../auth/auth.queries';
import { dashboardKey } from '../dashboard/dashboard.keys';
import { habitsApi } from '../habits/habits.api';
import { goalsApi } from './goals.api';
import styles from './GoalFormPage.module.css';

const schema = z.object({
  title: z.string().trim().min(3, 'Use at least 3 characters').max(191),
  targetDays: z.number().int().min(1).max(100000),
  deadline: z.string().optional(),
});
type Values = z.infer<typeof schema>;

export function GoalFormPage() {
  const { goalId = '' } = useParams();
  const [params] = useSearchParams();
  const editing = Boolean(goalId);
  const navigate = useNavigate();
  const cache = useQueryClient();
  const session = useSession();
  const habits = useQuery({ queryKey: queryKeys.habits.all, queryFn: habitsApi.list });
  const goals = useQuery({ queryKey: queryKeys.goals.all, queryFn: goalsApi.list, enabled: editing });
  const existing = goals.data?.goals.find((goal) => goal.id === goalId);
  const [habitIds, setHabitIds] = useState<string[]>(params.get('habitId') ? [params.get('habitId')!] : []);
  const [drafts, setDrafts] = useState<DraftHabit[]>([]);
  const [relationError, setRelationError] = useState('');
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { title: '', targetDays: 7, deadline: '' } });
  useEffect(() => {
    if (existing) {
      reset({ title: existing.title, targetDays: existing.targetDays, deadline: existing.deadline ?? '' });
      setHabitIds(existing.habits.map((habit) => habit.id));
    }
  }, [existing, reset]);
  const locked = editing && existing?.status !== 'ACTIVE';
  const save = async (values: Values) => {
    if (!locked && habitIds.length + drafts.length < 1) {
      setRelationError('Choose at least one habit.');
      return;
    }
    try {
      const input = locked
        ? { title: values.title }
        : {
            title: values.title,
            targetDays: values.targetDays,
            deadline: values.deadline || null,
            habitIds,
            newHabits: drafts.map(({ key: _key, ...draft }) => draft),
          };
      const result = editing
        ? await goalsApi.update(goalId, input)
        : await goalsApi.createMulti(input as Parameters<typeof goalsApi.createMulti>[0]);
      await Promise.all([
        cache.invalidateQueries({ queryKey: queryKeys.goals.all }),
        cache.invalidateQueries({ queryKey: queryKeys.habits.all }),
        cache.invalidateQueries({ queryKey: dashboardKey }),
        cache.invalidateQueries({ queryKey: queryKeys.statistics.all }),
      ]);
      navigate(`/app/goals/${result.goal.id}`);
    } catch (error) {
      setError('root', {
        message: error instanceof ApiError ? error.message : 'We could not save this goal. Try again.',
      });
    }
  };
  if (habits.isLoading || (editing && goals.isLoading))
    return (
      <div className="stack">
        <div className="skeleton" />
        <div className="skeleton" />
      </div>
    );
  if (editing && !existing)
    return (
      <section className="panel">
        <h2>Goal not found.</h2>
        <Link className="raisedSecondary" to="/app/goals">
          Back to goals
        </Link>
      </section>
    );
  const fields = (
    <>
      <div className="field">
        <label htmlFor="goal-title">Goal title</label>
        <input id="goal-title" disabled={isSubmitting} {...register('title')} placeholder="30 focused mornings" />
        {errors.title && <span className="fieldError">{errors.title.message}</span>}
      </div>
      {!locked && (
        <HabitRelationComposer
          habits={habits.data?.habits ?? []}
          selectedIds={habitIds}
          drafts={drafts}
          onSelectedIds={setHabitIds}
          onDrafts={setDrafts}
          pending={isSubmitting}
          error={relationError}
          onError={setRelationError}
        />
      )}
      <div className={styles.row}>
        <div className="field">
          <label htmlFor="goal-target">Target days</label>
          <input
            id="goal-target"
            type="number"
            min="1"
            disabled={Boolean(locked) || isSubmitting}
            {...register('targetDays', { valueAsNumber: true })}
          />
        </div>
        <div className="field">
          <label htmlFor="goal-deadline">Deadline (optional)</label>
          <input
            id="goal-deadline"
            type="date"
            min={localDate(session.data?.user.timezone)}
            disabled={Boolean(locked) || isSubmitting}
            {...register('deadline')}
          />
        </div>
      </div>
      {locked && (
        <div className="statusMessage">
          Completed or cancelled goals only allow renaming. Target, deadline, and connections are read-only.
        </div>
      )}
      {errors.root && (
        <div className="statusMessage" role="alert">
          {errors.root.message}
        </div>
      )}
    </>
  );
  if (!editing) {
    const close = () => !isSubmitting && navigate('/app/goals');
    return (
      <FormOverlay
        eyebrow="New goal"
        title="Set a finish line."
        copy="Choose existing habits or stage new ones. Everything is created together when you submit."
        pending={isSubmitting}
        onClose={close}
        footer={
          <>
            <button type="button" className="plainButton" disabled={isSubmitting} onClick={close}>
              Cancel
            </button>
            <button type="submit" form="create-goal" className="raisedPrimary" disabled={isSubmitting}>
              {isSubmitting ? 'Creating…' : 'Create goal'}
            </button>
          </>
        }
      >
        <form id="create-goal" className={styles.form} onSubmit={handleSubmit(save)}>
          {fields}
        </form>
      </FormOverlay>
    );
  }
  return (
    <>
      <PageHeader eyebrow="Goal settings" title="Edit goal." />
      <form className={styles.layout} onSubmit={handleSubmit(save)}>
        <section className={`${styles.form} panel`}>
          {fields}
          <footer>
            <Link className="plainButton" to={`/app/goals/${goalId}`}>
              Cancel
            </Link>
            <button className="raisedPrimary" disabled={isSubmitting}>
              {isSubmitting ? 'Saving…' : 'Save changes'}
            </button>
          </footer>
        </section>
      </form>
    </>
  );
}
