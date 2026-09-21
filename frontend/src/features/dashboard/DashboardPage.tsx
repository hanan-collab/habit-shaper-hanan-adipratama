import { useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AnimatePresence, motion, type PanInfo, useReducedMotion } from 'motion/react';
import { Plus, Search } from 'lucide-react';
import { Link } from 'react-router';
import { NumberTicker, TextAnimate } from '../../components/magicui';
import { FormOverlay } from '../../components/ui/FormOverlay';
import { GoalRelationComposer } from '../../components/ui/RelationComposer';
import type { DraftGoal } from '../../types/relations';
import { GoalCard, HabitCard, isGoalHabitResolved } from '../../components/ui/TrackingCards';
import { useToast } from '../../components/ui/ToastProvider';
import { UserAvatar } from '../../components/ui/UserAvatar';
import { localDate } from '../../lib/api';
import type { DashboardHabit, GamificationEvent, Goal, Habit, HabitType } from '../../types/domain';
import { useSession } from '../auth/auth.queries';
import { EventResponse } from '../gamification/EventResponse';
import { habitsApi } from '../habits/habits.api';
import { useHabitAction } from '../habits/useHabitAction';
import { dashboardApi } from './dashboard.api';
import { dashboardKey } from './dashboard.keys';
import { queryKeys } from '../../lib/queryKeys';
import styles from './DashboardPage.module.css';

export { dashboardKey } from './dashboard.keys';
type SearchState = Record<HabitType, string>;
type GoalMode = 'none' | 'existing' | 'new';

export const isHabitResolved = (habit: Pick<DashboardHabit, 'type' | 'todayStatus'>) =>
  habit.type === 'BUILD' ? habit.todayStatus === 'COMPLETED' : habit.todayStatus === 'CLEAN';
export { isGoalHabitResolved };
const percentage = (complete: number, total: number) => (total ? Math.round((complete / total) * 100) : 0);
export const quickGoalInput = (title: string, targetDays: number, deadline: string, habitId: string) => ({
  title: title.trim(),
  targetDays,
  deadline: deadline || null,
  habitIds: [habitId],
});

export function DashboardPage() {
  const cache = useQueryClient();
  const session = useSession();
  const reducedMotion = useReducedMotion();
  const { pushToast } = useToast();
  const swipingRef = useRef(false);
  const query = useQuery({ queryKey: dashboardKey, queryFn: dashboardApi.get });
  const [tab, setTab] = useState<HabitType>('BUILD');
  const [tabDirection, setTabDirection] = useState(1);
  const [events, setEvents] = useState<GamificationEvent[]>([]);
  const [searches, setSearches] = useState<SearchState>({ BUILD: '', BREAK: '' });
  const [quickType, setQuickType] = useState<HabitType | null>(null);
  const [quickName, setQuickName] = useState('');
  const [newHabitId, setNewHabitId] = useState('');
  const [goalMode, setGoalMode] = useState<GoalMode>('none');
  const [selectedGoalIds, setSelectedGoalIds] = useState<string[]>([]);
  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [newGoalTarget, setNewGoalTarget] = useState(7);
  const [newGoalDeadline, setNewGoalDeadline] = useState('');
  const [quickGoalDrafts, setQuickGoalDrafts] = useState<DraftGoal[]>([]);
  const [quickCreatedHabit, setQuickCreatedHabit] = useState<Habit | null>(null);

  const quickAdd = useMutation({
    mutationFn: async () => {
      const finalType = quickType ?? tab;
      return habitsApi.create({
        name: quickName.trim(),
        type: finalType,
        description: null,
        goalIds: goalMode === 'existing' ? selectedGoalIds : [],
        newGoals: quickGoalDrafts.map(({ key: _key, ...draft }) => ({ ...draft, deadline: draft.deadline || null })),
      });
    },
    onSuccess: async (result) => {
      const finalType = result.habit.type;
      setQuickType(null);
      setQuickCreatedHabit(null);
      setQuickName('');
      setNewHabitId(result.habit.id);
      setEvents(result.meta.gamificationEvents);
      changeTab(finalType);
      pushToast({ variant: 'success', title: 'Habit added', message: `${result.habit.name} is ready for today.` });
      await Promise.all([
        query.refetch(),
        cache.invalidateQueries({ queryKey: queryKeys.habits.all }),
        cache.invalidateQueries({ queryKey: queryKeys.goals.all }),
        cache.invalidateQueries({ queryKey: queryKeys.statistics.all }),
      ]);
      window.setTimeout(() => setNewHabitId(''), 900);
    },
    onError: (error) =>
      pushToast({
        variant: 'error',
        title: "Couldn't finish quick add",
        message: error instanceof Error ? error.message : 'Try again. Nothing was saved.',
      }),
  });

  const dashboard = query.data?.dashboard;
  const habitAction = useHabitAction(dashboard?.habits ?? [], setEvents);
  const visibleHabits = useMemo(() => {
    const keyword = searches[tab].trim().toLowerCase();
    return (dashboard?.habits ?? [])
      .filter((habit) => habit.type === tab && habit.name.toLowerCase().includes(keyword))
      .sort((a, b) => Number(isHabitResolved(a)) - Number(isHabitResolved(b)));
  }, [dashboard?.habits, searches, tab]);

  if (query.isLoading)
    return (
      <div className="stack">
        <div className="skeleton" />
        <div className="skeleton" />
        <div className="skeleton" />
      </div>
    );
  if (query.isError || !dashboard)
    return (
      <div className="panel">
        <h2>We couldn't load today.</h2>
        <p>Your progress has not changed.</p>
        <button className="raisedSecondary" onClick={() => query.refetch()}>
          Retry
        </button>
      </div>
    );

  const builds = dashboard.habits.filter((habit) => habit.type === 'BUILD');
  const breaks = dashboard.habits.filter((habit) => habit.type === 'BREAK');
  const buildComplete = builds.filter(isHabitResolved).length;
  const cleanComplete = breaks.filter(isHabitResolved).length;
  const goalRows = dashboard.goals.map((goal) => ({ goal, complete: goal.todayStatus === 'COMPLETE' }));
  const goalsComplete = goalRows.filter((row) => row.complete).length;
  const allGoalsComplete = goalRows.length > 0 && goalsComplete === goalRows.length;
  const currentBiggest = Math.max(0, ...dashboard.habits.map((habit) => habit.statistics.currentStreak));
  const dateLabel = new Intl.DateTimeFormat('en', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    timeZone: session.data?.user.timezone,
  }).format(new Date());
  const username = session.data?.user.username || session.data?.user.email.split('@')[0] || 'shaper';

  function changeTab(next: HabitType) {
    if (next === tab) return;
    setTabDirection(next === 'BREAK' ? 1 : -1);
    setTab(next);
  }

  const openQuickAdd = (type: HabitType) => {
    quickAdd.reset();
    setQuickName('');
    setGoalMode('none');
    setSelectedGoalIds([]);
    setNewGoalTitle('');
    setNewGoalTarget(7);
    setNewGoalDeadline('');
    setQuickGoalDrafts([]);
    setQuickCreatedHabit(null);
    setQuickType(type);
  };

  const closeQuickAdd = () => {
    if (quickAdd.isPending) return;
    if (quickCreatedHabit) {
      pushToast({
        variant: 'info',
        title: 'Habit saved',
        message: 'The goal connection was skipped. You can connect it later.',
      });
      void query.refetch();
    }
    quickAdd.reset();
    setQuickName('');
    setNewGoalDeadline('');
    setQuickGoalDrafts([]);
    setQuickType(null);
    setQuickCreatedHabit(null);
  };

  const handleSwipe = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (tab === 'BUILD' && (info.offset.x < -64 || info.velocity.x < -500)) changeTab('BREAK');
    if (tab === 'BREAK' && (info.offset.x > 64 || info.velocity.x > 500)) changeTab('BUILD');
    window.setTimeout(() => {
      swipingRef.current = false;
    }, 80);
  };

  return (
    <div className={styles.page}>
      <section className={styles.review}>
        <header className={styles.reviewHeader}>
          <div>
            <b>Today</b>
            <span>{dateLabel}</span>
          </div>
          <div className={styles.identity}>
            <div>
              <small>Hi,</small>
              <strong title={username}>{username}</strong>
            </div>
            {session.data?.user && <UserAvatar username={session.data.user.username} email={session.data.user.email} />}
          </div>
        </header>
        <div className={styles.todayStats}>
          <TodayRing
            value={percentage(buildComplete, builds.length)}
            label="Build"
            detail={`${buildComplete}/${builds.length}`}
          />
          <TodayRing
            value={percentage(cleanComplete, breaks.length)}
            label="Clean"
            detail={`${cleanComplete}/${breaks.length}`}
          />
          <TodayRing
            value={percentage(goalsComplete, goalRows.length)}
            label="Goal"
            detail={`${goalsComplete}/${goalRows.length}`}
            monochrome
          />
          <StreakSummary value={currentBiggest} reducedMotion={Boolean(reducedMotion)} />
        </div>
      </section>

      <section className={styles.goalsPanel}>
        <header>
          <div>
            <p className="eyebrow">Today's active goals</p>
            <h2>Finish lines powered by today's habits.</h2>
          </div>
          <span title="Goals done today / all active goals">
            {goalsComplete} / {goalRows.length}
            <small>done today / all goals</small>
          </span>
        </header>
        {goalRows.length ? (
          allGoalsComplete ? (
            <AllGoalsCompleteState key="all-complete" reducedMotion={Boolean(reducedMotion)} />
          ) : (
            <motion.div layout className={styles.goalList} aria-label="Pending goals">
              <AnimatePresence mode="popLayout" initial={false}>
                {goalRows
                  .filter((row) => !row.complete)
                  .map(({ goal }, index) => (
                    <motion.div
                      layout
                      key={goal.id}
                      initial={reducedMotion ? false : { opacity: 0, x: 54 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={reducedMotion ? { opacity: 0 } : { opacity: 0, x: -54, scale: 0.96 }}
                      transition={{ delay: index * 0.05, layout: { duration: 0.32 } }}
                    >
                      <GoalCard goal={goal} variant="today" reducedMotion={Boolean(reducedMotion)} />
                    </motion.div>
                  ))}
              </AnimatePresence>
            </motion.div>
          )
        ) : (
          <div className={styles.noGoals}>
            <h3>No active finish lines.</h3>
            <p>Your habits still count. Add a goal when a target helps.</p>
            <Link className={styles.raisedDarkButton} to="/app/goals/new">
              Add a goal
            </Link>
          </div>
        )}
      </section>

      <section className={styles.habitWorkspace}>
        <div className={styles.habitIntro}>
          <div>
            <p className="eyebrow">Daily actions</p>
            <TextAnimate key={tab} as="h2">
              {tab === 'BUILD' ? 'Mark what you build.' : "I'm relapsing, but it's okay."}
            </TextAnimate>
            <p>
              {tab === 'BUILD'
                ? 'One honest completion moves the pattern forward.'
                : 'A reset is information. Your clean days and next choice still matter.'}
            </p>
          </div>
        </div>
        <nav className={styles.typeNav} aria-label="Habit type" role="tablist">
          <button
            id="build-habits-tab"
            role="tab"
            aria-selected={tab === 'BUILD'}
            aria-controls="build-habits-panel"
            className={tab === 'BUILD' ? styles.activeTab : ''}
            onClick={() => changeTab('BUILD')}
          >
            <img src="/brand/icons/build.svg" alt="" />
            Build <b>{builds.length}</b>
          </button>
          <button
            id="break-habits-tab"
            role="tab"
            aria-selected={tab === 'BREAK'}
            aria-controls="break-habits-panel"
            className={tab === 'BREAK' ? styles.activeTab : ''}
            onClick={() => changeTab('BREAK')}
          >
            <img src="/brand/icons/break.svg" alt="" />
            Break <b>{breaks.length}</b>
          </button>
        </nav>
        <div className={styles.quickTools}>
          <label className={styles.search}>
            <Search />
            <input
              aria-label={`Search ${tab.toLowerCase()} habits`}
              value={searches[tab]}
              onChange={(event) => setSearches((current) => ({ ...current, [tab]: event.target.value }))}
              placeholder={`Search ${tab.toLowerCase()} habits`}
            />
          </label>
          <button className={styles.quickButton} onClick={() => openQuickAdd(tab)}>
            <Plus /> Add {tab === 'BUILD' ? 'build' : 'break'}
          </button>
        </div>
        <AnimatePresence mode="wait" custom={tabDirection}>
          <motion.div
            id={`${tab.toLowerCase()}-habits-panel`}
            role="tabpanel"
            aria-labelledby={`${tab.toLowerCase()}-habits-tab`}
            key={tab}
            className={styles.swipePanel}
            custom={tabDirection}
            initial={reducedMotion ? false : { opacity: 0, x: tabDirection * 44 }}
            animate={{ opacity: 1, x: 0 }}
            exit={reducedMotion ? { opacity: 0 } : { opacity: 0, x: tabDirection * -44 }}
            transition={{ duration: 0.28 }}
            drag={reducedMotion ? false : 'x'}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.08}
            onDragStart={() => {
              swipingRef.current = true;
            }}
            onDragEnd={handleSwipe}
            onClickCapture={(event) => {
              if (swipingRef.current) {
                event.preventDefault();
                event.stopPropagation();
              }
            }}
          >
            {visibleHabits.length ? (
              <div className={styles.habitList}>
                {visibleHabits.map((habit, index) => (
                  <HabitCard
                    key={habit.id}
                    habit={habit}
                    index={index}
                    newItem={habit.id === newHabitId}
                    burst={habit.id === habitAction.burstId}
                    pending={habit.id === habitAction.pendingId}
                    reducedMotion={Boolean(reducedMotion)}
                    onAction={() => habitAction.act(habit)}
                  />
                ))}
              </div>
            ) : (
              <div className={styles.emptyHabits}>
                <h3>No {tab.toLowerCase()} habit matches.</h3>
                <p>{searches[tab] ? 'Try another keyword.' : `Add one ${tab.toLowerCase()} habit for today.`}</p>
                <button className={styles.quickButton} onClick={() => openQuickAdd(tab)}>
                  <Plus /> Add habit
                </button>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </section>

      {habitAction.dialog}
      {quickType && (
        <QuickAddDialog
          type={quickType}
          typeLocked={Boolean(quickCreatedHabit)}
          value={quickName}
          pending={quickAdd.isPending}
          onType={setQuickType}
          onChange={setQuickName}
          onClose={closeQuickAdd}
          onSubmit={() => quickName.trim() && quickAdd.mutate()}
          goals={dashboard.goals}
          goalMode={goalMode}
          onGoalMode={setGoalMode}
          selectedGoalIds={selectedGoalIds}
          onSelectedGoalIds={setSelectedGoalIds}
          newGoalTitle={newGoalTitle}
          onNewGoalTitle={setNewGoalTitle}
          newGoalTarget={newGoalTarget}
          onNewGoalTarget={setNewGoalTarget}
          newGoalDeadline={newGoalDeadline}
          onNewGoalDeadline={setNewGoalDeadline}
          minimumDeadline={localDate(session.data?.user.timezone)}
          draftGoals={quickGoalDrafts}
          onDraftGoals={setQuickGoalDrafts}
        />
      )}
      <EventResponse events={events} onDismiss={() => setEvents([])} />
    </div>
  );
}

export function AllGoalsCompleteState({ reducedMotion }: { reducedMotion: boolean }) {
  return (
    <motion.div
      className={styles.goalsComplete}
      role="status"
      aria-live="polite"
      initial={reducedMotion ? false : { opacity: 0, scale: 0.96, y: 16 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: reducedMotion ? 0 : 0.38, ease: 'easeOut' }}
    >
      <div className={styles.goalsCompleteIllustration} aria-hidden="true">
        <img src="/brand/motion/completion-success.svg" alt="" />
      </div>
      <div className={styles.goalsCompleteCopy}>
        <span>All clear</span>
        <TextAnimate as="h3">You kept every promise to yourself today.</TextAnimate>
        <p>Take the win. You showed up for every goal.</p>
      </div>
    </motion.div>
  );
}

function TodayRing({
  value,
  label,
  detail,
  monochrome = false,
}: {
  value: number;
  label: string;
  detail: string;
  monochrome?: boolean;
}) {
  const reduced = useReducedMotion();
  return (
    <article className={`${styles.statItem} ${monochrome ? styles.goalStat : ''}`}>
      <div className={styles.ring}>
        <svg viewBox="0 0 100 100" aria-hidden="true">
          <circle className={styles.ringTrack} cx="50" cy="50" r="43" />
          <motion.circle
            className={styles.ringValue}
            cx="50"
            cy="50"
            r="43"
            pathLength="1"
            initial={reduced ? false : { pathLength: 0 }}
            animate={{ pathLength: value / 100 }}
            transition={{ duration: 0.8 }}
          />
        </svg>
        <strong>
          <NumberTicker value={value} suffix="%" />
        </strong>
      </div>
      <div>
        <b>{label}</b>
        <small>{detail}</small>
      </div>
    </article>
  );
}

function StreakSummary({ value, reducedMotion }: { value: number; reducedMotion: boolean }) {
  return (
    <article className={styles.biggestStreak}>
      <motion.div
        key={value}
        className={styles.streakVisual}
        initial={reducedMotion ? false : { scale: 1.2 }}
        animate={{ scale: 1 }}
      >
        <strong>
          <NumberTicker value={value} />
        </strong>
        {value > 0 && <img src="/brand/motion/flame-active.svg" alt="" />}
      </motion.div>
      <small>BIGGEST CURRENT STREAK</small>
    </article>
  );
}

export function GoalTodayCard({ goal, reducedMotion }: { goal: Goal; reducedMotion: boolean }) {
  return <GoalCard goal={goal} variant="today" reducedMotion={reducedMotion} />;
}

export function HabitTodayCard(props: {
  habit: DashboardHabit;
  burst: boolean;
  pending: boolean;
  newItem: boolean;
  index: number;
  reducedMotion: boolean;
  onAction: () => void;
}) {
  return <HabitCard {...props} variant="today" streakNumberClassName={styles.habitStreakNumber} />;
}

export function QuickAddDialog({
  type,
  typeLocked,
  value,
  pending,
  onType,
  onChange,
  onClose,
  onSubmit,
  goals,
  goalMode,
  onGoalMode,
  selectedGoalIds,
  onSelectedGoalIds,
  draftGoals = [],
  onDraftGoals = () => undefined,
}: {
  type: HabitType;
  typeLocked: boolean;
  value: string;
  pending: boolean;
  onType: (type: HabitType) => void;
  onChange: (value: string) => void;
  onClose: () => void;
  onSubmit: () => void;
  goals: Goal[];
  goalMode: GoalMode;
  onGoalMode: (mode: GoalMode) => void;
  selectedGoalIds: string[];
  onSelectedGoalIds: (ids: string[]) => void;
  newGoalTitle: string;
  onNewGoalTitle: (value: string) => void;
  newGoalTarget: number;
  onNewGoalTarget: (value: number) => void;
  newGoalDeadline: string;
  onNewGoalDeadline: (value: string) => void;
  minimumDeadline: string;
  draftGoals?: DraftGoal[];
  onDraftGoals?: (drafts: DraftGoal[]) => void;
}) {
  const [relationError, setRelationError] = useState('');
  const ready = Boolean(value.trim());
  const label = type === 'BUILD' ? 'build' : 'break';
  return (
    <FormOverlay
      eyebrow="Quick add"
      title="Shape one daily action."
      copy="Choose a direction and optionally connect it to one or more active goals."
      pending={pending}
      onClose={onClose}
      labelledBy="quick-add-title"
      footer={
        <>
          <button className={styles.cancelButton} disabled={pending} onClick={onClose}>
            Cancel
          </button>
          <button className={styles.addButton} disabled={pending || !ready} onClick={onSubmit}>
            {pending
              ? typeLocked
                ? 'Retrying connection…'
                : 'Adding…'
              : typeLocked
                ? 'Retry goal connection'
                : `Add ${label} habit`}
          </button>
        </>
      }
    >
      <fieldset className={styles.quickTypeChoices} disabled={pending || typeLocked}>
        <legend>Habit direction</legend>
        {(['BUILD', 'BREAK'] as HabitType[]).map((choice) => (
          <label key={choice} className={choice === type ? styles.quickTypeSelected : ''}>
            <input
              type="radio"
              name="quick-type"
              value={choice}
              checked={choice === type}
              onChange={() => onType(choice)}
            />
            <img src={`/brand/icons/${choice.toLowerCase()}.svg`} alt="" />
            <span>
              <strong>{choice === 'BUILD' ? 'Build' : 'Break'}</strong>
              <small>
                {choice === 'BUILD' ? 'Repeat an action that helps.' : 'Move away from an action that no longer helps.'}
              </small>
            </span>
          </label>
        ))}
      </fieldset>
      <div className={`field ${styles.quickField}`}>
        <label htmlFor="quick-habit-name">Habit name</label>
        <input
          id="quick-habit-name"
          autoFocus
          value={value}
          maxLength={191}
          disabled={typeLocked}
          aria-invalid={!value.trim()}
          onChange={(event) => onChange(event.target.value)}
          placeholder={type === 'BUILD' ? 'Read for ten minutes' : 'No late-night soda'}
        />
      </div>
      <div className={styles.goalChoice}>
        <span>
          Connect to goals <small>Optional</small>
        </span>
        <div className={styles.goalModes}>
          {(['none', 'existing', 'new'] as const).map((mode) => (
            <button
              type="button"
              key={mode}
              className={goalMode === mode ? styles.goalChoiceActive : ''}
              disabled={pending || typeLocked}
              onClick={() => onGoalMode(mode)}
            >
              {mode === 'none' ? 'No goal' : mode === 'existing' ? 'Existing goals' : 'New goal'}
            </button>
          ))}
        </div>
        {goalMode !== 'none' && (
          <GoalRelationComposer
            goals={goals}
            selectedIds={selectedGoalIds}
            drafts={draftGoals}
            onSelectedIds={onSelectedGoalIds}
            onDrafts={onDraftGoals}
            pending={pending || typeLocked}
            error={relationError}
            onError={setRelationError}
          />
        )}
      </div>
      {typeLocked && (
        <p className={styles.partialNotice}>The habit is already saved. Retry only reconnects the selected goal.</p>
      )}
    </FormOverlay>
  );
}
