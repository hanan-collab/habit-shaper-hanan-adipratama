import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useParams } from 'react-router';
import { z } from 'zod';
import { PageHeader } from '../../components/layout/PageHeader';
import { FormOverlay } from '../../components/ui/FormOverlay';
import { GoalRelationComposer } from '../../components/ui/RelationComposer';
import type { DraftGoal } from '../../types/relations';
import { ApiError } from '../../lib/api';
import { queryKeys } from '../../lib/queryKeys';
import type { HabitType } from '../../types/domain';
import { dashboardKey } from '../dashboard/dashboard.keys';
import { goalsApi } from '../goals/goals.api';
import { habitsApi } from './habits.api';
import styles from './HabitFormPage.module.css';

const schema = z.object({
  type: z.enum(['BUILD', 'BREAK']),
  name: z.string().trim().min(3, 'Use at least 3 characters').max(191),
  description: z.string().max(5000).optional(),
});
type Values = z.infer<typeof schema>;
const refresh = (cache: ReturnType<typeof useQueryClient>, id?: string) =>
  Promise.all([
    cache.invalidateQueries({ queryKey: dashboardKey }),
    cache.invalidateQueries({ queryKey: queryKeys.habits.all }),
    cache.invalidateQueries({ queryKey: queryKeys.goals.all }),
    cache.invalidateQueries({ queryKey: queryKeys.statistics.all }),
    ...(id
      ? [
          cache.invalidateQueries({ queryKey: queryKeys.habits.detail(id) }),
          cache.invalidateQueries({ queryKey: queryKeys.habits.statistics(id) }),
        ]
      : []),
  ]);

export function HabitFormPage() {
  const { habitId = '' } = useParams();
  const editing = Boolean(habitId);
  const navigate = useNavigate();
  const cache = useQueryClient();
  const [goalIds, setGoalIds] = useState<string[]>([]);
  const [drafts, setDrafts] = useState<DraftGoal[]>([]);
  const [relationError, setRelationError] = useState('');
  const habit = useQuery({
    queryKey: queryKeys.habits.detail(habitId),
    queryFn: () => habitsApi.get(habitId),
    enabled: editing,
  });
  const goals = useQuery({ queryKey: queryKeys.goals.all, queryFn: goalsApi.list, enabled: !editing });
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { type: 'BUILD', name: '', description: '' } });
  useEffect(() => {
    if (habit.data)
      reset({
        type: habit.data.habit.type,
        name: habit.data.habit.name,
        description: habit.data.habit.description ?? '',
      });
  }, [habit.data, reset]);
  const save = async (values: Values) => {
    try {
      if (editing) {
        await habitsApi.update(habitId, { name: values.name, description: values.description || null });
        await refresh(cache, habitId);
        navigate(`/app/habits/${habitId}`);
      } else {
        await habitsApi.create({
          ...values,
          description: values.description || null,
          goalIds,
          newGoals: drafts.map(({ key: _key, ...draft }) => ({ ...draft, deadline: draft.deadline || undefined })),
        });
        await refresh(cache);
        navigate('/app/habits', { replace: true });
      }
    } catch (error) {
      setError('root', {
        message: error instanceof ApiError ? error.message : 'We could not save this habit. Try again.',
      });
    }
  };
  if (editing) {
    if (habit.isLoading) return <div className="skeleton" />;
    return (
      <>
        <PageHeader eyebrow="Habit settings" title="Edit habit." />
        <form className={styles.layout} onSubmit={handleSubmit(save)}>
          <section className={`${styles.form} panel`}>
            <div className="field">
              <label htmlFor="name">Habit name</label>
              <input id="name" {...register('name')} />
              {errors.name && <span className="fieldError">{errors.name.message}</span>}
            </div>
            <div className="field">
              <label htmlFor="description">Why this matters (optional)</label>
              <textarea id="description" {...register('description')} />
            </div>
            {errors.root && (
              <div className="statusMessage" role="alert">
                {errors.root.message}
              </div>
            )}
            <footer>
              <Link className="plainButton" to={`/app/habits/${habitId}`}>
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
  const type = watch('type');
  const close = () => !isSubmitting && navigate('/app/habits');
  return (
    <FormOverlay
      eyebrow="New habit"
      title="Shape one daily action."
      copy="Create the habit and all of its goal connections together."
      pending={isSubmitting}
      onClose={close}
      footer={
        <>
          <button type="button" className="plainButton" disabled={isSubmitting} onClick={close}>
            Cancel
          </button>
          <button type="submit" form="create-habit" className="raisedPrimary" disabled={isSubmitting}>
            {isSubmitting ? 'Creating…' : 'Create habit'}
          </button>
        </>
      }
    >
      <form id="create-habit" className={styles.form} onSubmit={handleSubmit(save)}>
        <fieldset disabled={isSubmitting}>
          <legend>Direction</legend>
          <div className={styles.types}>
            {(['BUILD', 'BREAK'] as HabitType[]).map((value) => (
              <label key={value} className={type === value ? styles.selected : undefined}>
                <input type="radio" value={value} {...register('type')} />
                <img src={`/brand/icons/${value.toLowerCase()}.svg`} alt="" />
                <strong>{value}</strong>
                <span>
                  {value === 'BUILD'
                    ? 'Repeat an action that helps.'
                    : 'Move away from an action that no longer helps.'}
                </span>
              </label>
            ))}
          </div>
        </fieldset>
        <div className="field">
          <label htmlFor="name">Habit name</label>
          <input
            id="name"
            disabled={isSubmitting}
            {...register('name')}
            placeholder={type === 'BUILD' ? 'Read for 20 minutes' : 'No soda after lunch'}
          />
          {errors.name && <span className="fieldError">{errors.name.message}</span>}
        </div>
        <div className="field">
          <label htmlFor="description">Why this matters (optional)</label>
          <textarea id="description" disabled={isSubmitting} {...register('description')} />
        </div>
        <GoalRelationComposer
          goals={goals.data?.goals ?? []}
          selectedIds={goalIds}
          drafts={drafts}
          onSelectedIds={setGoalIds}
          onDrafts={setDrafts}
          pending={isSubmitting}
          error={relationError}
          onError={setRelationError}
        />
        {errors.root && (
          <div className="statusMessage" role="alert">
            {errors.root.message}
          </div>
        )}
      </form>
    </FormOverlay>
  );
}
