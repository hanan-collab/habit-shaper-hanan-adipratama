import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowRight, Check, RotateCcw, Sparkles, Target } from 'lucide-react';
import { Link } from 'react-router';
import { UserAvatar } from '../../components/ui/UserAvatar';
import { localDate } from '../../lib/api';
import { useSession } from '../auth/auth.queries';
import { dashboardApi } from '../dashboard/dashboard.api';
import { habitsApi } from '../habits/habits.api';
import styles from './LandingPage.module.css';

const activity = [
  { icon: Check, label: 'Morning walk completed', meta: '12 day streak', tone: 'success' },
  { icon: Sparkles, label: 'New personal best', meta: 'Reading · 18 days', tone: 'accent' },
  { icon: Target, label: 'Goal is halfway shaped', meta: '15 of 30 days', tone: 'dark' },
  { icon: RotateCcw, label: 'Back after a reset', meta: 'Progress still counts', tone: 'recovery' },
] as const;

const activityTone = {
  success: '',
  accent: '',
  dark: styles.activityItemDark,
  recovery: styles.activityItemRecovery,
};

function StepMark({ compact = false }: { compact?: boolean }) {
  return (
    <span className={compact ? `${styles.stepMark} ${styles.stepMarkCompact}` : styles.stepMark} aria-hidden="true">
      <i />
      <i />
      <i />
    </span>
  );
}

function AnimatedHeadline() {
  const words = useMemo(() => ['BUILD.', 'BREAK.', 'SHAPE.'], []);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const interval = window.setInterval(
      () => setActive((current) => (current + 1) % words.length),
      2200,
    );
    return () => window.clearInterval(interval);
  }, [words.length]);

  return (
    <span className={styles.rotatingWord} aria-live="polite">
      {words.map((word, index) => (
        <span className={active === index ? styles.isActive : undefined} key={word}>
          {word}
        </span>
      ))}
    </span>
  );
}

function AnimatedActivityList() {
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const interval = window.setInterval(
      () => setOffset((current) => (current + 1) % activity.length),
      2600,
    );
    return () => window.clearInterval(interval);
  }, []);

  const ordered = activity.map((_, index) => activity[(index + offset) % activity.length]);

  return (
    <div className={styles.activityWindow} aria-label="Recent progress events">
      <div className={styles.activityTrack} key={offset}>
        {ordered.slice(0, 3).map(({ icon: Icon, label, meta, tone }, index) => (
          <article
            className={[styles.activityItem, activityTone[tone]].filter(Boolean).join(' ')}
            key={label}
            style={{ '--index': index } as CSSProperties}
          >
            <span className={styles.activityIcon}><Icon size={17} strokeWidth={2.4} /></span>
            <span>
              <strong>{label}</strong>
              <small>{meta}</small>
            </span>
          </article>
        ))}
      </div>
    </div>
  );
}

type ProductPreviewProps = {
  avatarSeed?: string;
  dateLabel: string;
  done: boolean;
  habitName: string;
  momentum: number;
  pending: boolean;
  streak: number;
  weekCompleted: number;
  onToggle: () => void;
};

function ProductPreview({ avatarSeed, dateLabel, done, habitName, momentum, pending, streak, weekCompleted, onToggle }: ProductPreviewProps) {
  const completedDays = Math.min(7, Math.max(0, weekCompleted));
  return (
    <div className={styles.productStage}>
      <div className={styles.productGlow} />
      <div className={styles.productShell}>
        <div className={styles.productBar}>
          <div className={styles.productUser}>
            <StepMark compact />
            <span><b>Today</b><small>{dateLabel}</small></span>
          </div>
          {avatarSeed
            ? <Link className={styles.avatarLink} to="/app/settings"><UserAvatar seed={avatarSeed} /></Link>
            : <Link className={styles.avatar} to="/login" aria-label="Log in">AV</Link>}
        </div>

        <div className={styles.productSummary}>
          <span className={styles.summaryKicker}>YOUR MOMENTUM</span>
          <div className={styles.summaryLine}>
            <strong className={done ? styles.numberPop : undefined}>{momentum}</strong>
            <span>DAYS<br />MOVING.</span>
          </div>
          <div className={styles.weekDots} aria-label={`${completedDays} of seven days completed`}>
            {[0, 1, 2, 3, 4, 5, 6].map((day) => (
              <i className={day < completedDays ? styles.isDone : undefined} key={day}>
                {day < completedDays ? <Check size={11} /> : 'T'}
              </i>
            ))}
          </div>
        </div>

        <div className={styles.habitCard}>
          <div className={styles.habitTopline}>
            <span className={styles.habitIcon}><img src="/brand/motion/flame-active.svg" alt="" /></span>
            <span><small>BUILD</small><b>{habitName}</b></span>
            <strong>{streak}<small>DAY STREAK</small></strong>
          </div>
          <button
            className={done ? `${styles.completeButton} ${styles.isComplete}` : styles.completeButton}
            type="button"
            disabled={pending}
            onClick={onToggle}
          >
            <span>{done ? <Check size={18} /> : null}{pending ? 'SAVING…' : done ? 'COMPLETED' : 'COMPLETE TODAY'}</span>
          </button>
        </div>

        <AnimatedActivityList />
      </div>

      <div className={styles.milestoneChip} role="status">
        <img src="/brand/motion/flame-active.svg" alt="" />
        <span><b>PERSONAL BEST</b><small>One more day shaped.</small></span>
      </div>
    </div>
  );
}

export function LandingPage() {
  const cache = useQueryClient();
  const session = useSession();
  const user = session.data?.user;
  const [demoDone, setDemoDone] = useState(false);
  const dashboard = useQuery({
    queryKey: ['dashboard'],
    queryFn: dashboardApi.get,
    enabled: Boolean(user?.onboardingCompletedAt),
  });
  const liveDashboard = dashboard.data?.dashboard;
  const liveHabit = liveDashboard?.habits.find((habit) => habit.type === 'BUILD');
  const liveDone = liveHabit?.todayStatus === 'COMPLETED';
  const completion = useMutation({
    mutationFn: () => {
      if (!liveHabit) return Promise.resolve();
      const date = liveDashboard?.date ?? localDate(user?.timezone);
      return liveDone
        ? habitsApi.removeCompletion(liveHabit.id, date)
        : habitsApi.complete(liveHabit.id, date);
    },
    onSuccess: () => cache.invalidateQueries({ queryKey: ['dashboard'] }),
  });
  const done = liveHabit ? liveDone : demoDone;
  const streak = liveHabit?.statistics.currentStreak ?? (demoDone ? 18 : 17);
  const momentum = liveDashboard?.userStatistics.bestOverallStreak ?? (demoDone ? 13 : 12);
  const dateLabel = liveDashboard?.date
    ? new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeZone: user?.timezone }).format(new Date(`${liveDashboard.date}T12:00:00`))
    : 'Tuesday, 18 Sep';
  const appDestination = user
    ? (user.onboardingCompletedAt ? '/app' : '/onboarding')
    : '/register';
  const toggleCompletion = () => {
    if (liveHabit) completion.mutate();
    else setDemoDone((value) => !value);
  };

  return (
    <main className={styles.page}>
      <nav className={styles.siteNav} aria-label="Main navigation">
        <a className={styles.brand} href="#top" aria-label="Habit Shaper home">
          <StepMark compact />
          <span>HABIT SHAPER</span>
        </a>
        <div className={styles.navLinks}>
          <a href="#method">How it works</a>
          <a href="#progress">Progress</a>
          <Link to="/brand-kit">Brand kit</Link>
        </div>
        <a className={styles.navCta} href="#start">Start shaping <ArrowRight size={16} /></a>
      </nav>

      <section className={styles.hero} id="top">
        <div className={styles.heroCopy}>
          <div className={styles.eyebrow}><span /> SMALL ACTIONS / VISIBLE PROGRESS</div>
          <h1>
            <AnimatedHeadline />
            <span>WHAT HELPS.</span>
          </h1>
          <p>
            Track the actions you want to build—or break. See your momentum clearly, and begin again without losing sight of how far you’ve come.
          </p>
          <div className={styles.heroActions}>
            <a className={styles.raisedButton} href="#start">START WITH ONE HABIT <ArrowRight size={18} /></a>
            <span>No perfect streaks required.</span>
          </div>
        </div>
        <ProductPreview
          avatarSeed={user?.id || user?.email}
          dateLabel={dateLabel}
          done={done}
          habitName={liveHabit?.name ?? 'Read for 20 minutes'}
          momentum={momentum}
          pending={completion.isPending}
          streak={streak}
          weekCompleted={liveHabit?.statistics.completedThisWeek ?? (demoDone ? 7 : 6)}
          onToggle={toggleCompletion}
        />
      </section>

      <section className={styles.momentumBand} aria-label="Habit Shaper promise">
        <div className={styles.momentumCopy}>
          <span>CONSISTENCY, MADE VISIBLE.</span>
          <span>PROGRESS, WITHOUT PUNISHMENT.</span>
        </div>
        <div className={styles.momentumSteps} aria-hidden="true"><i /><i /><i /></div>
      </section>

      <section className={styles.methodSection} id="method">
        <header className={styles.sectionHeading}>
          <span>THE METHOD / 03 STEPS</span>
          <h2>DON’T CHANGE EVERYTHING.<br />SHAPE ONE THING.</h2>
        </header>
        <div className={styles.methodMeter} aria-label="Three-step habit shaping method">
          <span />
          <div aria-hidden="true"><i>1</i><i>2</i><i>3</i></div>
        </div>
        <div className={styles.methodSpine}>
          <div className={styles.methodRail} aria-hidden="true"><i /></div>
          <article>
            <b>01</b>
            <div><span>SET THE DIRECTION</span><h3>Choose the action.</h3><p>Build what helps or break what keeps pulling you back. Goals stay optional; the first commitment is simply one clear action.</p></div>
            <img src="/brand/icons/goal.svg" alt="" />
          </article>
          <article>
            <b>02</b>
            <div><span>MAKE IT VISIBLE</span><h3>Show up today.</h3><p>Check in once. Habit Shaper records the day, updates the streak, and keeps the next action obvious.</p></div>
            <img src="/brand/motion/completion-success.svg" alt="" />
          </article>
          <article>
            <b>03</b>
            <div><span>LEARN THE PATTERN</span><h3>See the shape form.</h3><p>Streaks, completion rate, and personal bests turn repetition into evidence—without pretending every week is perfect.</p></div>
            <img src="/brand/icons/statistics.svg" alt="" />
          </article>
        </div>
      </section>

      <div className={styles.steppedSeparator} aria-hidden="true"><i /><i /><i /></div>

      <section className={styles.progressSection} id="progress">
        <div className={styles.progressCopy}>
          <span className={styles.sectionLabel}>MOMENTUM, NOT PRESSURE</span>
          <h2>A RESET IS DATA.<br />NOT A VERDICT.</h2>
          <p>Habit Shaper remembers the work that came before. If a day goes sideways, record it honestly and keep moving with a clearer view of your pattern.</p>
        </div>
        <div className={styles.recoveryCard}>
          <div className={styles.recoveryIcon}><RotateCcw size={25} /></div>
          <span>RESET RECORDED.</span>
          <strong>YOUR PROGRESS<br />STILL COUNTS.</strong>
          <div className={styles.recoveryStats}>
            <span><b>24</b><small>days shaped</small></span>
            <span><b>6</b><small>best streak</small></span>
            <span><b>82%</b><small>this month</small></span>
          </div>
        </div>
      </section>

      <section className={styles.finalCta} id="start">
        <StepMark />
        <div>
          <span>ONE SMALL ACTION.</span>
          <h2>START SHAPING.</h2>
        </div>
        <Link className={styles.raisedButton} to={appDestination}>
          {user ? 'OPEN TODAY' : 'CREATE YOUR FIRST HABIT'} <ArrowRight size={18} />
        </Link>
      </section>

      <footer className={styles.siteFooter}>
        <a className={styles.brand} href="#top"><StepMark compact /><span>HABIT SHAPER</span></a>
        <span>SMALL ACTIONS. VISIBLE PROGRESS.</span>
        <span>© 2026</span>
      </footer>
    </main>
  );
}
