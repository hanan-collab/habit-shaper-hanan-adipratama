import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowDown, Check, ChevronLeft, ChevronRight, Clock3, Info, LocateFixed, Pencil, Sparkles } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { Navigate, useNavigate } from 'react-router';
import { z } from 'zod';
import { AnimatedGridPattern, AnimatedList, TextAnimate } from '../../components/magicui';
import { BrandMark } from '../../components/ui/BrandMark';
import { HabitPreviewCard } from '../../components/ui/HabitPreviewCard';
import { ApiError, localDate } from '../../lib/api';
import { queryKeys } from '../../lib/queryKeys';
import type { HabitType } from '../../types/domain';
import { authApi, type CompleteOnboardingInput } from '../auth/auth.api';
import { sessionKey, useSession } from '../auth/auth.queries';
import { dashboardKey } from '../dashboard/DashboardPage';
import { goalsApi, type GoalInput } from '../goals/goals.api';
import type { CreateHabitRequest } from '../habits/dto/request/habit.request';
import { habitsApi } from '../habits/habits.api';
import styles from './OnboardingPage.module.css';

const isTimezone = (value: string) => {
  try {
    new Intl.DateTimeFormat('en', { timeZone: value }).format();
    return true;
  } catch {
    return false;
  }
};
const schema = z
  .object({
    type: z.enum(['BUILD', 'BREAK']),
    name: z.string().trim().min(1, 'Name the action you want to shape.').max(191),
    timezone: z.string().trim().refine(isTimezone, 'Choose a valid timezone.'),
    goalMode: z.enum(['skip', 'add']),
    goalTitle: z.string().max(191),
    goalTarget: z.number().int().min(1, 'Use at least one day.').max(100000),
    goalDeadline: z.string(),
  })
  .superRefine((value, context) => {
    if (value.goalMode === 'add' && !value.goalTitle.trim())
      context.addIssue({ code: 'custom', path: ['goalTitle'], message: 'Give this goal a memorable name.' });
    if (value.goalMode === 'add' && value.goalDeadline && value.goalDeadline < localDate(value.timezone))
      context.addIssue({ code: 'custom', path: ['goalDeadline'], message: 'Deadline cannot be in the past.' });
  });
type Values = z.infer<typeof schema>;
type Submission = { habit: CreateHabitRequest; goal: GoalInput | null; onboarding: CompleteOnboardingInput };
type RequestState = 'idle' | 'pending' | 'success' | 'error' | 'skipped';
type Checkpoint = { fingerprint: string; habitId?: string; goalId?: string };
const storageKey = 'habit-shaper:onboarding-submission';
const fallbackTimezones = [
  'UTC',
  'Asia/Jakarta',
  'Asia/Makassar',
  'Asia/Jayapura',
  'Asia/Singapore',
  'Asia/Tokyo',
  'Australia/Sydney',
  'Europe/London',
  'America/New_York',
  'America/Los_Angeles',
];
const getTimezones = () => {
  const intl = Intl as typeof Intl & { supportedValuesOf?: (key: 'timeZone') => string[] };
  return intl.supportedValuesOf?.('timeZone') ?? fallbackTimezones;
};

export function OnboardingPage() {
  const session = useSession();
  const cache = useQueryClient();
  const navigate = useNavigate();
  const reducedMotion = useReducedMotion();
  const [step, setStep] = useState(0);
  const [detected, setDetected] = useState(false);
  const [now, setNow] = useState(() => new Date());
  const [requestStates, setRequestStates] = useState<Record<'habit' | 'goal' | 'onboarding', RequestState>>({
    habit: 'idle',
    goal: 'idle',
    onboarding: 'idle',
  });
  const [submitError, setSubmitError] = useState('');
  const {
    register,
    control,
    handleSubmit,
    setValue,
    setError,
    trigger,
    formState: { errors, isSubmitting, isValid },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    mode: 'onChange',
    defaultValues: {
      type: 'BUILD',
      name: '',
      timezone: '',
      goalMode: 'skip',
      goalTitle: '',
      goalTarget: 7,
      goalDeadline: '',
    },
  });
  const values = useWatch({ control });
  const timezone = values.timezone || '';
  const timezones = useMemo(() => getTimezones(), []);
  const habitReady = Boolean(values.name?.trim()) && Boolean(values.type);
  const timezoneReady = isTimezone(timezone);
  const safeTimezone = timezoneReady ? timezone : 'UTC';
  const goalReady =
    values.goalMode === 'skip' ||
    (Boolean(values.goalTitle?.trim()) &&
      Number(values.goalTarget) >= 1 &&
      (!values.goalDeadline || values.goalDeadline >= localDate(safeTimezone)));
  const stepReady = [true, habitReady, timezoneReady, goalReady, isValid];
  const progress = (step / 4) * 100;

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  if (session.isLoading)
    return (
      <div className="pageWidth" style={{ paddingTop: 80 }}>
        <div className="skeleton" />
      </div>
    );
  if (!session.data?.user) return <Navigate to="/login" replace />;
  if (session.data.user.onboardingCompleted) return <Navigate to="/app" replace />;

  const nodes = [
    { label: 'Start', icon: <Sparkles /> },
    { label: 'Habit', icon: <img src="/brand/icons/build.svg" alt="" /> },
    { label: 'Timezone', icon: <Clock3 /> },
    { label: 'Goal', icon: <img src="/brand/icons/goal.svg" alt="" /> },
    { label: 'Review', icon: <Pencil /> },
  ];
  const goNext = async () => {
    const fields: (keyof Values)[][] = [
      [],
      ['type', 'name'],
      ['timezone'],
      ['goalMode', 'goalTitle', 'goalTarget', 'goalDeadline'],
    ];
    if (step === 0 || step >= 4 || (await trigger(fields[step]))) setStep((current) => Math.min(4, current + 1));
  };
  const useBrowserTimezone = () => {
    setValue('timezone', Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC', {
      shouldDirty: true,
      shouldValidate: true,
    });
    setDetected(true);
  };
  const buildSubmission = (input: Values): Submission => ({
    habit: { name: input.name.trim(), type: input.type as HabitType, startDate: localDate(input.timezone) },
    goal:
      input.goalMode === 'add'
        ? {
            title: input.goalTitle.trim(),
            targetDays: input.goalTarget,
            ...(input.goalDeadline ? { deadline: input.goalDeadline } : {}),
          }
        : null,
    onboarding: { completed: true, timezone: input.timezone },
  });
  const submit = async (input: Values) => {
    const submission = buildSubmission(input);
    const fingerprint = JSON.stringify(submission);
    let checkpoint: Checkpoint = { fingerprint };
    try {
      const saved = JSON.parse(sessionStorage.getItem(storageKey) || 'null') as Checkpoint | null;
      if (saved?.fingerprint === fingerprint) checkpoint = saved;
    } catch {
      sessionStorage.removeItem(storageKey);
    }
    const persist = (value: Checkpoint) => sessionStorage.setItem(storageKey, JSON.stringify(value));
    setSubmitError('');
    setRequestStates({
      habit: checkpoint.habitId ? 'success' : 'pending',
      goal: submission.goal ? (checkpoint.goalId ? 'success' : 'idle') : 'skipped',
      onboarding: 'idle',
    });
    try {
      if (!checkpoint.habitId) {
        const result = await habitsApi.create(submission.habit);
        checkpoint = { ...checkpoint, habitId: result.habit.id };
        persist(checkpoint);
        setRequestStates((current) => ({
          ...current,
          habit: 'success',
          goal: submission.goal ? 'pending' : 'skipped',
        }));
      } else if (submission.goal && !checkpoint.goalId)
        setRequestStates((current) => ({ ...current, goal: 'pending' }));
      if (submission.goal && !checkpoint.goalId) {
        const result = await goalsApi.create(checkpoint.habitId!, submission.goal);
        checkpoint = { ...checkpoint, goalId: result.goal.id };
        persist(checkpoint);
        setRequestStates((current) => ({ ...current, goal: 'success', onboarding: 'pending' }));
      } else setRequestStates((current) => ({ ...current, onboarding: 'pending' }));
      const result = await authApi.completeOnboarding(submission.onboarding);
      setRequestStates((current) => ({ ...current, onboarding: 'success' }));
      sessionStorage.removeItem(storageKey);
      cache.setQueryData(sessionKey, result);
      await Promise.all([
        cache.invalidateQueries({ queryKey: dashboardKey }),
        cache.invalidateQueries({ queryKey: queryKeys.habits.all }),
        cache.invalidateQueries({ queryKey: queryKeys.goals.all }),
      ]);
      navigate('/app', { replace: true });
    } catch (caught) {
      const error = caught instanceof ApiError ? caught : null;
      setSubmitError(error?.message ?? 'We could not finish setup. Your completed steps are saved.');
      setRequestStates((current) =>
        current.habit === 'pending'
          ? { ...current, habit: 'error' }
          : current.goal === 'pending'
            ? { ...current, goal: 'error' }
            : { ...current, onboarding: 'error' },
      );
      if (error?.fields)
        Object.entries(error.fields).forEach(([field, messages]) => {
          const mapped =
            field === 'title'
              ? 'goalTitle'
              : field === 'targetDays'
                ? 'goalTarget'
                : field === 'deadline'
                  ? 'goalDeadline'
                  : field;
          if (['name', 'type', 'timezone', 'goalTitle', 'goalTarget', 'goalDeadline'].includes(mapped))
            setError(mapped as keyof Values, { message: messages[0] });
        });
    }
  };
  const localTime = timezoneReady
    ? new Intl.DateTimeFormat('en', {
        timeZone: timezone,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }).format(now)
    : '--:--';
  const transition = reducedMotion
    ? { duration: 0 }
    : { duration: 0.34, ease: [0.2, 0.8, 0.2, 1] as [number, number, number, number] };

  return (
    <main className={styles.page}>
      <AnimatedGridPattern />
      <div className={styles.shell}>
        <header className={styles.brandRow}>
          <BrandMark inverted size={44} />
          <span>
            <strong>Habit Shaper</strong>
            <small>Shape your first daily action</small>
          </span>
        </header>
        <nav className={styles.progress} aria-label="Onboarding progress">
          <span className={styles.progressLine}>
            <i style={{ width: `${progress}%` }} />
          </span>
          {nodes.map((node, index) => (
            <button
              type="button"
              key={node.label}
              disabled={index > step}
              className={`${styles.progressNode} ${index < step ? styles.progressDone : ''} ${index === step ? styles.progressActive : ''}`}
              onClick={() => setStep(index)}
              aria-current={index === step ? 'step' : undefined}
            >
              <b>{index < step ? <Check /> : node.icon}</b>
              <small>{node.label}</small>
            </button>
          ))}
        </nav>

        <form onSubmit={handleSubmit(submit)} noValidate>
          <div className={styles.stepViewport}>
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                className={styles.stepCard}
                key={step}
                initial={reducedMotion ? false : { opacity: 0, x: 26, filter: 'blur(5px)' }}
                animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                exit={reducedMotion ? undefined : { opacity: 0, x: -22, filter: 'blur(4px)' }}
                transition={transition}
              >
                {step === 0 && (
                  <section className={styles.welcomeSection}>
                    <div>
                      <TextAnimate as="h1">Start with one thing.</TextAnimate>
                      <p className={styles.supporting}>
                        Choose one daily action you can recognize, record, and return to. The shape becomes clearer
                        after you begin.
                      </p>
                      <div className={styles.infoChip}>
                        <Sparkles size={18} />
                        <span>Small enough to repeat. Clear enough to record.</span>
                      </div>
                    </div>
                    <img
                      className={styles.welcomeArt}
                      src="/brand/motion/completion-success.svg"
                      alt="Three rising steps showing a completed action"
                    />
                  </section>
                )}

                {step === 1 && (
                  <section className={styles.introSection}>
                    <div className={styles.habitFormColumn}>
                      <div className={styles.introCopy}>
                        <h2>Shape your daily action.</h2>
                        <p className={styles.supporting}>Choose a direction, then make it concrete.</p>
                      </div>
                      <fieldset className={styles.typeField}>
                        <legend>Which direction are you shaping?</legend>
                        <div className={styles.typeChoices}>
                          {(['BUILD', 'BREAK'] as HabitType[]).map((type) => (
                            <label key={type} className={values.type === type ? styles.selectedType : ''}>
                              <input type="radio" value={type} {...register('type')} />
                              <img src={`/brand/icons/${type.toLowerCase()}.svg`} alt="" />
                              <strong>{type === 'BUILD' ? 'Build' : 'Break'}</strong>
                              <span>
                                {type === 'BUILD'
                                  ? 'Repeat an action that supports you.'
                                  : 'Move away from an action that no longer helps.'}
                              </span>
                            </label>
                          ))}
                        </div>
                      </fieldset>
                      <div className="field">
                        <label htmlFor="habit-name">Name this daily habit</label>
                        <input
                          id="habit-name"
                          maxLength={191}
                          {...register('name')}
                          placeholder={values.type === 'BREAK' ? 'No soda after lunch' : 'Read for 20 minutes'}
                          aria-invalid={!!errors.name}
                        />
                        <ValidationMessage message={errors.name?.message} />
                        <span className={styles.fieldHint}>Daily rhythm · use an action you can answer honestly.</span>
                      </div>
                    </div>
                    <div className={styles.habitVisualColumn}>
                      <HabitPreviewCard type={values.type as HabitType} name={values.name || ''} streak={1} />
                    </div>
                  </section>
                )}

                {step === 2 && (
                  <section className={styles.section}>
                    <SectionHeading
                      title="Put midnight in the right place."
                      copy="Your streak follows calendar days in this timezone. Detection only runs after you choose it."
                    />
                    <div className={styles.timezoneCard}>
                      <div className={styles.clock}>
                        <span>{timezone || 'LOCAL TIME'}</span>
                        <strong>{localTime}</strong>
                        <small>
                          {detected ? 'Detected with your permission' : 'Choose manually or use this device'}
                        </small>
                      </div>
                      <div className={styles.timezoneControls}>
                        <div className="field">
                          <label htmlFor="timezone-select">Timezone</label>
                          <select id="timezone-select" {...register('timezone')} aria-invalid={!!errors.timezone}>
                            <option value="" disabled>
                              Select your timezone
                            </option>
                            {timezones.map((zone) => (
                              <option key={zone} value={zone}>
                                {zone.replaceAll('_', ' ')}
                              </option>
                            ))}
                          </select>
                          <ValidationMessage message={errors.timezone?.message} />
                        </div>
                        <button type="button" className="raisedPrimary" onClick={useBrowserTimezone}>
                          <LocateFixed size={18} /> Use my timezone
                        </button>
                      </div>
                    </div>
                  </section>
                )}

                {step === 3 && (
                  <section className={styles.section}>
                    <SectionHeading
                      title="Give the habit a target—or don't."
                      copy="A goal can add direction, but your habit works without one. Skipping is a complete choice."
                    />
                    <div className={styles.goalDecision}>
                      <label className={values.goalMode === 'skip' ? styles.goalDecisionActive : ''}>
                        <input type="radio" value="skip" {...register('goalMode')} />
                        <strong>Skip for now</strong>
                        <span>Start the habit today. Add a finish line whenever it becomes useful.</span>
                      </label>
                      <label className={values.goalMode === 'add' ? styles.goalDecisionActive : ''}>
                        <input type="radio" value="add" {...register('goalMode')} />
                        <strong>Add a goal</strong>
                        <span>
                          Choose how many completed days you want to collect. They do not need to be consecutive.
                        </span>
                      </label>
                    </div>
                    {values.goalMode === 'add' && (
                      <div className={styles.goalSetup}>
                        <div className={[styles.goalRelationRow, styles.goalConnection].join(' ')}>
                          <div className={styles.goalPath}>
                            <span className={styles.goalConnectionHabit}>
                              <img src={`/brand/icons/${String(values.type).toLowerCase()}.svg`} alt="" />
                              <span>
                                <small>DAILY HABIT</small>
                                <strong>{values.name}</strong>
                              </span>
                            </span>
                            <span className={styles.goalConnectionArrow} aria-hidden="true">
                              <ArrowDown />
                            </span>
                            <span className={styles.goalConnectionTarget}>
                              <img src="/brand/icons/goal.svg" alt="" />
                              <span>
                                <small>GOAL · {Number(values.goalTarget) || 1} DAYS</small>
                                <strong>{values.goalTitle || 'Your goal'}</strong>
                              </span>
                            </span>
                          </div>
                          <aside className={styles.goalInfo}>
                            <Info aria-hidden="true" />
                            <span>
                              <strong>How progress works</strong>
                              <small>
                                Complete this habit to add one progress day. A missed day leaves your total intact, so
                                the target does not require a perfect streak.
                              </small>
                            </span>
                          </aside>
                        </div>
                        <div className={styles.goalFields}>
                          <div className="field">
                            <label htmlFor="goal-title">Goal name</label>
                            <input
                              id="goal-title"
                              maxLength={191}
                              {...register('goalTitle')}
                              placeholder="Complete 30 reading days"
                              aria-invalid={!!errors.goalTitle}
                            />
                            <ValidationMessage message={errors.goalTitle?.message} />
                          </div>
                          <div className="field">
                            <label htmlFor="goal-target">Target days</label>
                            <input
                              id="goal-target"
                              type="number"
                              min="1"
                              max="100000"
                              {...register('goalTarget', { valueAsNumber: true })}
                              aria-invalid={!!errors.goalTarget}
                            />
                            <ValidationMessage message={errors.goalTarget?.message} />
                          </div>
                          <div className="field">
                            <label htmlFor="goal-deadline">Deadline (optional)</label>
                            <input
                              id="goal-deadline"
                              type="date"
                              min={localDate(safeTimezone)}
                              {...register('goalDeadline')}
                              aria-invalid={!!errors.goalDeadline}
                            />
                            <ValidationMessage message={errors.goalDeadline?.message} />
                          </div>
                        </div>
                      </div>
                    )}
                  </section>
                )}

                {step === 4 && (
                  <section className={styles.reviewSection}>
                    <div className={styles.reviewTitle}>
                      <div>
                        <h2>Everything in one place.</h2>
                        <p className={styles.supporting}>
                          One submit creates the habit, optional goal, and finishes setup.
                        </p>
                      </div>
                    </div>
                    <AnimatedList className={styles.reviewList} from="top">
                      <ReviewRow
                        label="Daily habit"
                        value={`${values.type} · ${values.name?.trim()}`}
                        onClick={() => setStep(1)}
                        icon="/brand/icons/build.svg"
                      />
                      <ReviewRow label="Local day" value={timezone} onClick={() => setStep(2)} icon={<Clock3 />} />
                      <ReviewRow
                        label="Goal"
                        value={
                          values.goalMode === 'skip'
                            ? 'Skipped for now'
                            : `${values.goalTitle} · ${values.goalTarget} days`
                        }
                        onClick={() => setStep(3)}
                        icon="/brand/icons/goal.svg"
                        goal
                      />
                    </AnimatedList>
                    {submitError && (
                      <div className={styles.submitError} role="alert">
                        {submitError}
                      </div>
                    )}
                    <button className={`raisedPrimary ${styles.submit}`} disabled={isSubmitting || !isValid}>
                      {isSubmitting
                        ? 'Shaping your setup…'
                        : requestStates.habit === 'success'
                          ? 'Retry setup'
                          : 'Start shaping'}
                    </button>
                  </section>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
          <footer className={styles.stepActions}>
            <button
              type="button"
              className={styles.backButton}
              disabled={step === 0 || isSubmitting}
              onClick={() => setStep((current) => Math.max(0, current - 1))}
            >
              <ChevronLeft /> Before
            </button>
            <span>Step {step + 1} of 5</span>
            {step < 4 ? (
              <button type="button" className={styles.nextButton} disabled={!stepReady[step]} onClick={goNext}>
                Next <ChevronRight />
              </button>
            ) : (
              <span className={styles.actionSpacer} />
            )}
          </footer>
        </form>
      </div>
    </main>
  );
}

function ValidationMessage({ message }: { message?: string }) {
  return (
    <span className={`${styles.validationMessage} ${message ? styles.validationVisible : ''}`} aria-live="polite">
      {message || '\u00a0'}
    </span>
  );
}
function SectionHeading({ title, copy }: { title: string; copy: string }) {
  return (
    <div className={styles.sectionHeading}>
      <div>
        <h2>{title}</h2>
        <p className={styles.supporting}>{copy}</p>
      </div>
    </div>
  );
}
function ReviewRow({
  label,
  value,
  onClick,
  icon,
  goal = false,
}: {
  label: string;
  value: string;
  onClick: () => void;
  icon: string | ReactNode;
  goal?: boolean;
}) {
  return (
    <button type="button" className={styles.reviewRow} onClick={onClick}>
      <span className={`${styles.reviewIcon} ${goal ? styles.reviewGoalIcon : ''}`}>
        {typeof icon === 'string' ? <img src={icon} alt="" /> : icon}
      </span>
      <span>
        <small>{label}</small>
        <strong>{value}</strong>
      </span>
      <b className={styles.edit}>
        <Pencil />
      </b>
    </button>
  );
}
