import { useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AnimatePresence, motion, type PanInfo, useReducedMotion } from 'motion/react';
import { Check, Plus, Search } from 'lucide-react';
import { Link } from 'react-router';
import { NumberTicker, Particles, TextAnimate } from '../../components/magicui';
import { FormOverlay } from '../../components/ui/FormOverlay';
import { HabitIcon } from '../../components/ui/HabitIcon';
import { useToast } from '../../components/ui/ToastProvider';
import { UserAvatar } from '../../components/ui/UserAvatar';
import { localDate } from '../../lib/api';
import type { DashboardHabit, GamificationEvent, Goal, GoalHabit, Habit, HabitType } from '../../types/domain';
import { useSession } from '../auth/auth.queries';
import { EventResponse } from '../gamification/EventResponse';
import { goalsApi } from '../goals/goals.api';
import { habitsApi } from '../habits/habits.api';
import { RelapseDialog } from '../habits/RelapseDialog';
import { dashboardApi } from './dashboard.api';
import styles from './DashboardPage.module.css';

export const dashboardKey = ['dashboard'] as const;
type Action = { id: string; action: 'complete' | 'undo' | 'relapse' | 'undo-relapse'; note?: string };
type SearchState = Record<HabitType, string>;
type GoalMode = 'none' | 'existing' | 'new';
class GoalConnectionError extends Error {}

export const isHabitResolved = (habit: Pick<DashboardHabit, 'type' | 'todayStatus'>) =>
  habit.type === 'BUILD' ? habit.todayStatus === 'COMPLETED' : habit.todayStatus === 'CLEAN';
export const isGoalHabitResolved = (habit: Pick<GoalHabit, 'todayStatus'>) => habit.todayStatus === 'DONE' || habit.todayStatus === 'CLEAR';
const percentage = (complete: number, total: number) => total ? Math.round(complete / total * 100) : 0;
export const quickGoalInput = (title: string, targetDays: number, deadline: string, habitId: string) => ({
  title: title.trim(), targetDays, deadline: deadline || null, habitIds: [habitId],
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
  const [relapseId, setRelapseId] = useState<string | null>(null);
  const [burstHabitId, setBurstHabitId] = useState<string | null>(null);
  const [searches, setSearches] = useState<SearchState>({ BUILD: '', BREAK: '' });
  const [quickType, setQuickType] = useState<HabitType | null>(null);
  const [quickName, setQuickName] = useState('');
  const [newHabitId, setNewHabitId] = useState('');
  const [goalMode, setGoalMode] = useState<GoalMode>('none');
  const [selectedGoalIds, setSelectedGoalIds] = useState<string[]>([]);
  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [newGoalTarget, setNewGoalTarget] = useState(7);
  const [newGoalDeadline, setNewGoalDeadline] = useState('');
  const [quickCreatedHabit, setQuickCreatedHabit] = useState<Habit | null>(null);

  const mutation = useMutation({
    mutationFn: async (input: Action) => {
      const date = localDate(session.data?.user.timezone);
      if (input.action === 'undo') return habitsApi.removeCompletion(input.id, date);
      if (input.action === 'undo-relapse') return habitsApi.removeRelapse(input.id, date);
      if (input.action === 'relapse') return habitsApi.relapse(input.id, date, input.note) as Promise<{ meta: { gamificationEvents: GamificationEvent[] } }>;
      return habitsApi.complete(input.id, date) as Promise<{ meta: { gamificationEvents: GamificationEvent[] } }>;
    },
    onSuccess: async (result, input) => {
      if (result && 'meta' in result) {
        setEvents(result.meta.gamificationEvents);
        if (input.action === 'complete') {
          setBurstHabitId(input.id);
          window.setTimeout(() => setBurstHabitId(current => current === input.id ? null : current), 900);
        }
      }
      setRelapseId(null);
      await cache.invalidateQueries({ queryKey: dashboardKey });
    },
    onError: () => pushToast({ variant: 'error', title: "Couldn't save action", message: 'Your progress has not changed. Try again.' }),
  });

  const quickAdd = useMutation({
    mutationFn: async () => {
      const finalType = quickType ?? tab;
      let result: { habit: Habit; meta: { gamificationEvents: GamificationEvent[] } };
      if (quickCreatedHabit) result = { habit: quickCreatedHabit, meta: { gamificationEvents: [] } };
      else {
        result = await habitsApi.create({ name: quickName.trim(), type: finalType, description: null, startDate: localDate(session.data?.user.timezone) });
        setQuickCreatedHabit(result.habit);
      }
      try {
        if (goalMode === 'existing' && selectedGoalIds.length) await goalsApi.connectHabit(result.habit.id, selectedGoalIds);
        if (goalMode === 'new') await goalsApi.createMulti(quickGoalInput(newGoalTitle, newGoalTarget, newGoalDeadline, result.habit.id));
      } catch (cause) {
        throw new GoalConnectionError('The habit was saved, but its goal connection failed.', { cause });
      }
      return result;
    },
    onSuccess: async result => {
      const finalType = result.habit.type;
      setQuickType(null);
      setQuickCreatedHabit(null);
      setQuickName('');
      setNewHabitId(result.habit.id);
      setEvents(result.meta.gamificationEvents);
      changeTab(finalType);
      pushToast({ variant: 'success', title: 'Habit added', message: `${result.habit.name} is ready for today.` });
      await query.refetch();
      window.setTimeout(() => setNewHabitId(''), 900);
    },
    onError: error => pushToast({
      variant: 'error',
      title: error instanceof GoalConnectionError ? 'Habit saved, goal not linked' : "Couldn't finish quick add",
      message: error instanceof GoalConnectionError ? 'Retry to connect the goal without creating another habit.' : error instanceof Error ? error.message : 'Try again.',
    }),
  });

  const dashboard = query.data?.dashboard;
  const visibleHabits = useMemo(() => {
    const keyword = searches[tab].trim().toLowerCase();
    return (dashboard?.habits ?? [])
      .filter(habit => habit.type === tab && habit.name.toLowerCase().includes(keyword))
      .sort((a, b) => Number(isHabitResolved(a)) - Number(isHabitResolved(b)));
  }, [dashboard?.habits, searches, tab]);

  if (query.isLoading) return <div className="stack"><div className="skeleton" /><div className="skeleton" /><div className="skeleton" /></div>;
  if (query.isError || !dashboard) return <div className="panel"><h2>We couldn't load today.</h2><p>Your progress has not changed.</p><button className="raisedSecondary" onClick={() => query.refetch()}>Retry</button></div>;

  const builds = dashboard.habits.filter(habit => habit.type === 'BUILD');
  const breaks = dashboard.habits.filter(habit => habit.type === 'BREAK');
  const buildComplete = builds.filter(isHabitResolved).length;
  const cleanComplete = breaks.filter(isHabitResolved).length;
  const goalRows = dashboard.goals.map(goal => ({ goal, complete: goal.todayStatus === 'COMPLETE' }));
  const goalsComplete = goalRows.filter(row => row.complete).length;
  const allGoalsComplete = goalRows.length > 0 && goalsComplete === goalRows.length;
  const currentBiggest = Math.max(0, ...dashboard.habits.map(habit => habit.statistics.currentStreak));
  const relapseHabit = dashboard.habits.find(habit => habit.id === relapseId);
  const dateLabel = new Intl.DateTimeFormat('en', { weekday: 'long', month: 'long', day: 'numeric', timeZone: session.data?.user.timezone }).format(new Date());
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
    setQuickCreatedHabit(null);
    setQuickType(type);
  };

  const closeQuickAdd = () => {
    if (quickAdd.isPending) return;
    if (quickCreatedHabit) {
      pushToast({ variant: 'info', title: 'Habit saved', message: 'The goal connection was skipped. You can connect it later.' });
      void query.refetch();
    }
    quickAdd.reset();
    setQuickName('');
    setNewGoalDeadline('');
    setQuickType(null);
    setQuickCreatedHabit(null);
  };

  const handleSwipe = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (tab === 'BUILD' && (info.offset.x < -64 || info.velocity.x < -500)) changeTab('BREAK');
    if (tab === 'BREAK' && (info.offset.x > 64 || info.velocity.x > 500)) changeTab('BUILD');
    window.setTimeout(() => { swipingRef.current = false; }, 80);
  };

  return <div className={styles.page}>
    <section className={styles.review}>
      <header className={styles.reviewHeader}>
        <div><b>Today</b><span>{dateLabel}</span></div>
        <div className={styles.identity}><div><small>Hi,</small><strong title={username}>{username}</strong></div>{session.data?.user && <UserAvatar username={session.data.user.username} email={session.data.user.email} />}</div>
      </header>
      <div className={styles.todayStats}>
        <TodayRing value={percentage(buildComplete, builds.length)} label="Build" detail={`${buildComplete}/${builds.length}`} />
        <TodayRing value={percentage(cleanComplete, breaks.length)} label="Clean" detail={`${cleanComplete}/${breaks.length}`} />
        <TodayRing value={percentage(goalsComplete, goalRows.length)} label="Goal" detail={`${goalsComplete}/${goalRows.length}`} monochrome />
        <StreakSummary value={currentBiggest} reducedMotion={Boolean(reducedMotion)} />
      </div>
    </section>

    <section className={styles.goalsPanel}>
      <header><div><p className="eyebrow">Today's active goals</p><h2>Finish lines powered by today's habits.</h2></div><span title="Goals done today / all active goals">{goalsComplete} / {goalRows.length}<small>done today / all goals</small></span></header>
      {goalRows.length ? allGoalsComplete
        ? <AllGoalsCompleteState key="all-complete" reducedMotion={Boolean(reducedMotion)} />
        : <motion.div layout className={styles.goalList} aria-label="Pending goals">
          <AnimatePresence mode="popLayout" initial={false}>
            {goalRows.filter(row => !row.complete).map(({ goal }, index) => <motion.div layout key={goal.id} initial={reducedMotion ? false : { opacity: 0, x: 54 }} animate={{ opacity: 1, x: 0 }} exit={reducedMotion ? { opacity: 0 } : { opacity: 0, x: -54, scale: .96 }} transition={{ delay: index * .05, layout: { duration: .32 } }}><GoalTodayCard goal={goal} reducedMotion={Boolean(reducedMotion)} /></motion.div>)}
          </AnimatePresence>
        </motion.div>
        : <div className={styles.noGoals}><h3>No active finish lines.</h3><p>Your habits still count. Add a goal when a target helps.</p><Link className={styles.raisedDarkButton} to="/app/goals/new">Add a goal</Link></div>}
    </section>

    <section className={styles.habitWorkspace}>
      <div className={styles.habitIntro}><div><p className="eyebrow">Daily actions</p><TextAnimate key={tab} as="h2">{tab === 'BUILD' ? 'Mark what you build.' : "I'm relapsing, but it's okay."}</TextAnimate><p>{tab === 'BUILD' ? 'One honest completion moves the pattern forward.' : 'A reset is information. Your clean days and next choice still matter.'}</p></div></div>
      <nav className={styles.typeNav} aria-label="Habit type" role="tablist">
        <button id="build-habits-tab" role="tab" aria-selected={tab === 'BUILD'} aria-controls="build-habits-panel" className={tab === 'BUILD' ? styles.activeTab : ''} onClick={() => changeTab('BUILD')}><img src="/brand/icons/build.svg" alt="" />Build <b>{builds.length}</b></button>
        <button id="break-habits-tab" role="tab" aria-selected={tab === 'BREAK'} aria-controls="break-habits-panel" className={tab === 'BREAK' ? styles.activeTab : ''} onClick={() => changeTab('BREAK')}><img src="/brand/icons/break.svg" alt="" />Break <b>{breaks.length}</b></button>
      </nav>
      <div className={styles.quickTools}>
        <label className={styles.search}><Search /><input aria-label={`Search ${tab.toLowerCase()} habits`} value={searches[tab]} onChange={event => setSearches(current => ({ ...current, [tab]: event.target.value }))} placeholder={`Search ${tab.toLowerCase()} habits`} /></label>
        <button className={styles.quickButton} onClick={() => openQuickAdd(tab)}><Plus /> Add {tab === 'BUILD' ? 'build' : 'break'}</button>
      </div>
      <AnimatePresence mode="wait" custom={tabDirection}>
        <motion.div id={`${tab.toLowerCase()}-habits-panel`} role="tabpanel" aria-labelledby={`${tab.toLowerCase()}-habits-tab`} key={tab} className={styles.swipePanel} custom={tabDirection} initial={reducedMotion ? false : { opacity: 0, x: tabDirection * 44 }} animate={{ opacity: 1, x: 0 }} exit={reducedMotion ? { opacity: 0 } : { opacity: 0, x: tabDirection * -44 }} transition={{ duration: .28 }} drag={reducedMotion ? false : 'x'} dragConstraints={{ left: 0, right: 0 }} dragElastic={.08} onDragStart={() => { swipingRef.current = true; }} onDragEnd={handleSwipe} onClickCapture={event => { if (swipingRef.current) { event.preventDefault(); event.stopPropagation(); } }}>
          {visibleHabits.length ? <div className={styles.habitList}>{visibleHabits.map((habit, index) => <HabitTodayCard key={habit.id} habit={habit} index={index} newItem={habit.id === newHabitId} burst={habit.id === burstHabitId} pending={mutation.isPending && mutation.variables?.id === habit.id} reducedMotion={Boolean(reducedMotion)} onAction={() => habit.type === 'BUILD' ? mutation.mutate({ id: habit.id, action: habit.todayStatus === 'COMPLETED' ? 'undo' : 'complete' }) : habit.todayStatus === 'RELAPSED' ? mutation.mutate({ id: habit.id, action: 'undo-relapse' }) : setRelapseId(habit.id)} />)}</div> : <div className={styles.emptyHabits}><h3>No {tab.toLowerCase()} habit matches.</h3><p>{searches[tab] ? 'Try another keyword.' : `Add one ${tab.toLowerCase()} habit for today.`}</p><button className={styles.quickButton} onClick={() => openQuickAdd(tab)}><Plus /> Add habit</button></div>}
        </motion.div>
      </AnimatePresence>
    </section>

    {relapseHabit && <RelapseDialog habitName={relapseHabit.name} pending={mutation.isPending} onClose={() => setRelapseId(null)} onConfirm={note => mutation.mutate({ id: relapseHabit.id, action: 'relapse', note })} />}
    {quickType && <QuickAddDialog type={quickType} typeLocked={Boolean(quickCreatedHabit)} value={quickName} pending={quickAdd.isPending} onType={setQuickType} onChange={setQuickName} onClose={closeQuickAdd} onSubmit={() => quickName.trim() && quickAdd.mutate()} goals={dashboard.goals} goalMode={goalMode} onGoalMode={setGoalMode} selectedGoalIds={selectedGoalIds} onSelectedGoalIds={setSelectedGoalIds} newGoalTitle={newGoalTitle} onNewGoalTitle={setNewGoalTitle} newGoalTarget={newGoalTarget} onNewGoalTarget={setNewGoalTarget} newGoalDeadline={newGoalDeadline} onNewGoalDeadline={setNewGoalDeadline} minimumDeadline={localDate(session.data?.user.timezone)} />}
    <EventResponse events={events} onDismiss={() => setEvents([])} />
  </div>;
}

export function AllGoalsCompleteState({ reducedMotion }: { reducedMotion: boolean }) {
  return <motion.div
    className={styles.goalsComplete}
    role="status"
    aria-live="polite"
    initial={reducedMotion ? false : { opacity: 0, scale: .96, y: 16 }}
    animate={{ opacity: 1, scale: 1, y: 0 }}
    transition={{ duration: reducedMotion ? 0 : .38, ease: 'easeOut' }}
  >
    <div className={styles.goalsCompleteIllustration} aria-hidden="true">
      <img src="/brand/motion/completion-success.svg" alt="" />
    </div>
    <div className={styles.goalsCompleteCopy}>
      <span>All clear</span>
      <TextAnimate as="h3">You kept every promise to yourself today.</TextAnimate>
      <p>Take the win. You showed up for every goal.</p>
    </div>
  </motion.div>;
}

function TodayRing({ value, label, detail, monochrome = false }: { value: number; label: string; detail: string; monochrome?: boolean }) {
  const reduced = useReducedMotion();
  return <article className={`${styles.statItem} ${monochrome ? styles.goalStat : ''}`}><div className={styles.ring}><svg viewBox="0 0 100 100" aria-hidden="true"><circle className={styles.ringTrack} cx="50" cy="50" r="43" /><motion.circle className={styles.ringValue} cx="50" cy="50" r="43" pathLength="1" initial={reduced ? false : { pathLength: 0 }} animate={{ pathLength: value / 100 }} transition={{ duration: .8 }} /></svg><strong><NumberTicker value={value} suffix="%" /></strong></div><div><b>{label}</b><small>{detail}</small></div></article>;
}

function StreakSummary({ value, reducedMotion }: { value: number; reducedMotion: boolean }) {
  return <article className={styles.biggestStreak}><motion.div key={value} className={styles.streakVisual} initial={reducedMotion ? false : { scale: 1.2 }} animate={{ scale: 1 }}><strong><NumberTicker value={value} /></strong>{value > 0 && <img src="/brand/motion/flame-active.svg" alt="" />}</motion.div><small>BIGGEST CURRENT STREAK</small></article>;
}

export function GoalTodayCard({ goal, reducedMotion }: { goal: Goal; reducedMotion: boolean }) {
  const resolved = goal.habits.filter(isGoalHabitResolved).length;
  const progress = percentage(resolved, goal.habits.length);
  return <article className={styles.goalCard}>
    <div className={styles.goalBrand}><span className={styles.goalIcon}><img src="/brand/icons/goal.svg" alt="" /></span><strong>{goal.progress.currentDays}/{goal.targetDays}</strong><small>completed days</small></div>
    <div className={styles.goalCopy}><small>ACTIVE TODAY</small><h3>{goal.title}</h3><ul>{goal.habits.map(habit => <li key={habit.id}><b>{habit.name}</b><span className={isGoalHabitResolved(habit) ? styles.resolvedHabit : ''}>{habit.type === 'BUILD' ? `Build · ${habit.todayStatus === 'DONE' ? 'Done' : 'Pending'}` : `Break · ${habit.todayStatus === 'CLEAR' ? 'Clean' : 'Relapsed'}`}</span></li>)}</ul></div>
    <div className={styles.goalHabitProgress} aria-label={`${resolved} of ${goal.habits.length} habits resolved today`}><svg viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="42" /><motion.circle className={styles.goalHabitProgressValue} cx="50" cy="50" r="42" pathLength="1" initial={reducedMotion ? false : { pathLength: 0 }} animate={{ pathLength: progress / 100 }} /></svg><strong>{resolved}/{goal.habits.length}</strong></div>
    <Link className={styles.goalDetail} to={`/app/goals/${goal.id}`}>Go</Link>
  </article>;
}

export function HabitTodayCard({ habit, burst, pending, newItem, index, reducedMotion, onAction }: { habit: DashboardHabit; burst: boolean; pending: boolean; newItem: boolean; index: number; reducedMotion: boolean; onAction: () => void }) {
  const passive = habit.type === 'BUILD' ? habit.todayStatus === 'COMPLETED' : habit.todayStatus === 'RELAPSED';
  const resolved = passive;
  return <motion.article layout initial={reducedMotion ? false : { opacity: 0, y: newItem ? 34 : 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .35, delay: newItem ? 0 : index * .06 }} className={`${styles.habitCard} ${resolved ? styles.habitResolved : ''}`}>{burst && <Particles burstKey={habit.id} />}<div className={styles.habitBody}><HabitIcon seed={habit.id} /><div className={styles.habitIdentity}><small>{habit.type} · DAILY</small><h3>{habit.name}</h3><Link className={styles.detailLink} to={`/app/habits/${habit.id}`}>See detail →</Link></div><motion.div key={habit.statistics.currentStreak} className={styles.habitStreak} initial={reducedMotion ? false : { scale: 1.22 }} animate={{ scale: 1 }}><div><strong><NumberTicker className={styles.habitStreakNumber} value={habit.statistics.currentStreak} /></strong>{habit.statistics.currentStreak > 0 && <img src="/brand/motion/flame-active.svg" alt="" />}</div><span>{habit.type === 'BUILD' ? 'DAY STREAK' : 'CLEAN STREAK'}</span></motion.div></div><button className={`${styles.habitAction} ${passive ? styles.habitActionPassive : ''}`} disabled={pending} onClick={onAction}>{pending ? 'Saving…' : habit.type === 'BUILD' ? passive ? 'Cancel completion' : 'Complete today' : passive ? 'Cancel report' : 'Report relapse'}</button></motion.article>;
}

export function QuickAddDialog({ type, typeLocked, value, pending, onType, onChange, onClose, onSubmit, goals, goalMode, onGoalMode, selectedGoalIds, onSelectedGoalIds, newGoalTitle, onNewGoalTitle, newGoalTarget, onNewGoalTarget, newGoalDeadline, onNewGoalDeadline, minimumDeadline }: { type: HabitType; typeLocked: boolean; value: string; pending: boolean; onType: (type: HabitType) => void; onChange: (value: string) => void; onClose: () => void; onSubmit: () => void; goals: Goal[]; goalMode: GoalMode; onGoalMode: (mode: GoalMode) => void; selectedGoalIds: string[]; onSelectedGoalIds: (ids: string[]) => void; newGoalTitle: string; onNewGoalTitle: (value: string) => void; newGoalTarget: number; onNewGoalTarget: (value: number) => void; newGoalDeadline: string; onNewGoalDeadline: (value: string) => void; minimumDeadline: string }) {
  const ready = Boolean(value.trim() && (goalMode !== 'new' || newGoalTitle.trim() && newGoalTarget > 0) && (goalMode !== 'existing' || selectedGoalIds.length));
  const label = type === 'BUILD' ? 'build' : 'break';
  return <FormOverlay eyebrow="Quick add" title="Shape one daily action." copy="Choose a direction and optionally connect it to one or more active goals." pending={pending} onClose={onClose} labelledBy="quick-add-title" footer={<><button className={styles.cancelButton} disabled={pending} onClick={onClose}>Cancel</button><button className={styles.addButton} disabled={pending || !ready} onClick={onSubmit}>{pending ? typeLocked ? 'Retrying connection…' : 'Adding…' : typeLocked ? 'Retry goal connection' : `Add ${label} habit`}</button></>}>
    <fieldset className={styles.quickTypeChoices} disabled={pending || typeLocked}><legend>Habit direction</legend>{(['BUILD', 'BREAK'] as HabitType[]).map(choice => <label key={choice} className={choice === type ? styles.quickTypeSelected : ''}><input type="radio" name="quick-type" value={choice} checked={choice === type} onChange={() => onType(choice)} /><img src={`/brand/icons/${choice.toLowerCase()}.svg`} alt="" /><span><strong>{choice === 'BUILD' ? 'Build' : 'Break'}</strong><small>{choice === 'BUILD' ? 'Repeat an action that helps.' : 'Move away from an action that no longer helps.'}</small></span></label>)}</fieldset>
    <div className={`field ${styles.quickField}`}><label htmlFor="quick-habit-name">Habit name</label><input id="quick-habit-name" autoFocus value={value} maxLength={191} disabled={typeLocked} aria-invalid={!value.trim()} onChange={event => onChange(event.target.value)} placeholder={type === 'BUILD' ? 'Read for ten minutes' : 'No late-night soda'} /></div>
    <div className={styles.goalChoice}><span>Connect to goals <small>Optional</small></span><div className={styles.goalModes}>{(['none', 'existing', 'new'] as const).map(mode => <button type="button" key={mode} className={goalMode === mode ? styles.goalChoiceActive : ''} disabled={pending || typeLocked} onClick={() => onGoalMode(mode)}>{mode === 'none' ? 'No goal' : mode === 'existing' ? 'Existing goals' : 'New goal'}</button>)}</div>
      {goalMode === 'existing' && <div className={styles.goalChecklist}>{goals.map(goal => { const selected = selectedGoalIds.includes(goal.id); return <button type="button" key={goal.id} className={selected ? styles.goalCheckSelected : ''} disabled={pending || typeLocked} aria-pressed={selected} onClick={() => onSelectedGoalIds(selected ? selectedGoalIds.filter(id => id !== goal.id) : [...selectedGoalIds, goal.id])}><span className={styles.goalCheckIcon}>{selected && <Check />}</span><span><strong>{goal.title}</strong><small>{goal.progress.currentDays}/{goal.targetDays} days · {Math.round(goal.progress.percentage)}%</small></span></button>; })}{!goals.length && <p>No active goals are available.</p>}</div>}
      {goalMode === 'new' && <div className={styles.newGoalFields}><div className="field"><label htmlFor="quick-goal-name">Goal name</label><input id="quick-goal-name" value={newGoalTitle} disabled={pending || typeLocked} onChange={event => onNewGoalTitle(event.target.value)} placeholder="30 focused mornings" /></div><div className="field"><label htmlFor="quick-goal-target">Target days</label><input id="quick-goal-target" type="number" min="1" value={newGoalTarget} disabled={pending || typeLocked} onChange={event => onNewGoalTarget(Number(event.target.value))} /></div><div className="field"><label htmlFor="quick-goal-deadline">Deadline (optional)</label><input id="quick-goal-deadline" type="date" min={minimumDeadline} value={newGoalDeadline} disabled={pending || typeLocked} onChange={event => onNewGoalDeadline(event.target.value)} /></div></div>}
    </div>
    {typeLocked && <p className={styles.partialNotice}>The habit is already saved. Retry only reconnects the selected goal.</p>}
  </FormOverlay>;
}
