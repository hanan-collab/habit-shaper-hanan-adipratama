import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../../lib/queryKeys';
import { Link } from 'react-router';
import { PageHeader } from '../../components/layout/PageHeader';
import { CircularProgress } from '../../components/ui/Progress';
import { localDate } from '../../lib/api';
import { useSession } from '../auth/auth.queries';
import { aggregateRange } from './statistics.domain';
import { statisticsApi } from './statistics.api';
import styles from './StatisticsPage.module.css';

export function StatisticsPage() {
  const [range, setRange] = useState(30);
  const [sort, setSort] = useState<'completion' | 'streak'>('completion');
  const session = useSession();
  const query = useQuery({ queryKey: queryKeys.statistics.all, queryFn: statisticsApi.all });
  const aggregate = useMemo(
    () => aggregateRange(query.data ?? [], range, localDate(session.data?.user.timezone)),
    [query.data, range, session.data?.user.timezone],
  );
  if (query.isLoading)
    return (
      <div className="stack">
        <div className="skeleton" />
        <div className="skeleton" />
        <div className="skeleton" />
      </div>
    );
  if (query.isError)
    return (
      <section className="panel">
        <h2>We couldn't load your pattern.</h2>
        <button className="raisedSecondary" onClick={() => query.refetch()}>
          Retry
        </button>
      </section>
    );
  if (!query.data?.length)
    return (
      <>
        <PageHeader eyebrow="Statistics" title="Your pattern." />
        <section className={styles.empty}>
          <img src="/brand/patterns/step-grid.svg" alt="" />
          <h2>Your pattern starts here.</h2>
          <p>Complete your first action and the graphs will take shape.</p>
          <Link className="raisedPrimary" to="/app/habits/new">
            Create a habit
          </Link>
        </section>
      </>
    );
  const points = aggregate.series
    .map((item, index) => `${(index / (aggregate.series.length - 1 || 1)) * 100},${100 - item.rate}`)
    .join(' ');
  const recent = aggregate.series.slice(-7);
  const comparison = [...query.data].sort((a, b) =>
    sort === 'streak'
      ? b.statistics.longestStreak - a.statistics.longestStreak
      : b.statistics.weeklyCompletionRate - a.statistics.weeklyCompletionRate,
  );
  const eligibleRecent = recent.filter((item) => item.eligible > 0);
  const best = eligibleRecent.reduce<(typeof recent)[number] | undefined>(
    (top, item) => (!top || item.rate > top.rate ? item : top),
    undefined,
  );
  const lowest = eligibleRecent.reduce<(typeof recent)[number] | undefined>(
    (low, item) => (!low || item.rate < low.rate ? item : low),
    undefined,
  );
  return (
    <>
      <PageHeader
        eyebrow="Progress intelligence"
        title="Your pattern."
        summary="Read the record directly. Use what worked to shape the next week."
      />
      <section className={styles.top}>
        <CircularProgress
          value={aggregate.rate}
          label={aggregate.eligible ? `${range}-day completion` : `No eligible days in ${range}d`}
          size={170}
        />
        <div>
          <span>Current best streak</span>
          <strong>{aggregate.currentStreak}</strong>
          <small>days across active habits</small>
        </div>
        <div>
          <span>Personal best</span>
          <strong>{aggregate.personalBest}</strong>
          <small>longest recorded streak</small>
        </div>
        <div className={styles.ranges} role="group" aria-label="Statistics range">
          {[7, 30, 90].map((value) => (
            <button
              type="button"
              aria-pressed={range === value}
              className={range === value ? styles.selected : undefined}
              key={value}
              onClick={() => setRange(value)}
            >
              {value}d
            </button>
          ))}
        </div>
      </section>
      <section className={styles.chartPanel}>
        <header>
          <div>
            <p className="eyebrow">Completion trend</p>
            <h2>Is completion improving?</h2>
          </div>
          <strong>
            {aggregate.completed} / {aggregate.eligible}
          </strong>
        </header>
        {aggregate.eligible ? (
          <>
            <div
              className={styles.lineChart}
              aria-label={`${range}-day completion trend ending at ${aggregate.series.at(-1)?.rate}%`}
            >
              <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
                <g>
                  {[25, 50, 75].map((y) => (
                    <line key={y} x1="0" x2="100" y1={y} y2={y} />
                  ))}
                </g>
                <polyline points={points} />
                {aggregate.series.map((item, index) => (
                  <circle
                    key={item.date}
                    cx={(index / (aggregate.series.length - 1 || 1)) * 100}
                    cy={100 - item.rate}
                    r="1.2"
                  >
                    <title>
                      {item.date}: {item.completed} of {item.eligible}, {item.rate}%
                    </title>
                  </circle>
                ))}
              </svg>
            </div>
            <p className={styles.summary}>
              {aggregate.rate}% across the selected {range}-day range. {aggregate.missed} scheduled actions were left
              open.
            </p>
          </>
        ) : (
          <div className={styles.noRange}>
            <strong>No eligible days in this range.</strong>
            <span>Your habits begin after the selected period. Choose a shorter range or keep checking in.</span>
          </div>
        )}
      </section>
      <section className={styles.twoCol}>
        <article className="panel">
          <p className="eyebrow">Daily distribution</p>
          <h2>Which days were strongest?</h2>
          <div className={styles.bars} aria-label="Completion over the last seven days">
            {recent.map((item) => (
              <div key={item.date} title={`${item.date}: ${item.eligible ? `${item.rate}%` : 'not eligible'}`}>
                <span
                  style={{ height: item.eligible ? `${Math.max(3, item.rate)}%` : '3%' }}
                  data-empty={!item.eligible}
                />
                <b>{new Date(`${item.date}T00:00:00Z`).toLocaleDateString('en', { weekday: 'short' }).slice(0, 2)}</b>
                <small>{item.eligible ? `${item.rate}%` : '—'}</small>
              </div>
            ))}
          </div>
          <p className="muted">
            {best && lowest
              ? `${best.date} is strongest at ${best.rate}%; ${lowest.date} is lowest at ${lowest.rate}%.`
              : 'No eligible days to compare yet.'}
          </p>
        </article>
        <article className="panel">
          <header className={styles.compareHead}>
            <div>
              <p className="eyebrow">Habit comparison</p>
              <h2>Where is support useful?</h2>
            </div>
            <div className="field">
              <label htmlFor="statistics-sort" className="srOnly">
                Sort habits
              </label>
              <select
                id="statistics-sort"
                value={sort}
                onChange={(event) => setSort(event.target.value as typeof sort)}
              >
                <option value="completion">Completion</option>
                <option value="streak">Streak</option>
              </select>
            </div>
          </header>
          <div className={styles.compare}>
            {comparison.map((item) => {
              const value = sort === 'streak' ? item.statistics.longestStreak : item.statistics.weeklyCompletionRate;
              const maximum =
                sort === 'streak' ? Math.max(1, ...comparison.map((entry) => entry.statistics.longestStreak)) : 100;
              return (
                <Link key={item.habit.id} to={`/app/habits/${item.habit.id}`}>
                  <span>{item.habit.name}</span>
                  <i>
                    <b style={{ width: `${(value / maximum) * 100}%` }} />
                  </i>
                  <strong>
                    {Math.round(value)}
                    {sort === 'completion' ? '%' : 'd'}
                  </strong>
                </Link>
              );
            })}
          </div>
        </article>
      </section>
    </>
  );
}
