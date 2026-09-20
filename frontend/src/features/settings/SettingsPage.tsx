import { useEffect, useState } from 'react';
import { PageHeader } from '../../components/layout/PageHeader';
import { UserAvatar } from '../../components/ui/UserAvatar';
import { useToast } from '../../components/ui/ToastProvider';
import { useSession } from '../auth/auth.queries';
import { goalsApi } from '../goals/goals.api';
import { habitsApi } from '../habits/habits.api';
import styles from './SettingsPage.module.css';

export function SettingsPage() {
  const session = useSession();
  const [reduced, setReduced] = useState(() => localStorage.getItem('reduce-motion') === 'true');
  const [exporting, setExporting] = useState(false);
  const { pushToast } = useToast();

  useEffect(() => {
    document.documentElement.dataset.reduceMotion = String(reduced);
    localStorage.setItem('reduce-motion', String(reduced));
  }, [reduced]);

  const exportData = async () => {
    setExporting(true);
    try {
      const [{ habits }, { goals }] = await Promise.all([habitsApi.list(), goalsApi.list()]);
      const histories = await Promise.all(habits.map(habit => habitsApi.get(habit.id).then(result => result.habit)));
      const blob = new Blob([JSON.stringify({ exportedAt: new Date().toISOString(), user: session.data?.user, habits: histories, goals }, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `habit-shaper-export-${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      URL.revokeObjectURL(url);
      pushToast({ variant: 'success', title: 'Export ready', message: 'Your activity export has been downloaded.' });
    } catch {
      pushToast({ variant: 'error', title: 'Export failed', message: 'We could not prepare the export. Try again.' });
    } finally {
      setExporting(false);
    }
  };

  const user = session.data?.user;
  return <>
    <PageHeader eyebrow="Account & preferences" title="Settings." summary="Keep the local day accurate and choose how the interface responds. Settings stay calm—no celebration required." />
    <div className={styles.layout}>
      <nav aria-label="Settings sections"><a href="#profile">Profile</a><a href="#local-day">Local day</a><a href="#accessibility">Accessibility</a><a href="#data">Your data</a></nav>
      <div className={styles.sections}>
        <section id="profile">
          <div className={styles.profileHead}>{user && <UserAvatar username={user.username} email={user.email} size="large" />}<header><p className="eyebrow">Profile</p><h2>Account identity.</h2></header></div>
          <dl><div><dt>Profile initial</dt><dd>Based on your username</dd></div><div><dt>Email</dt><dd>{user?.email}</dd></div><div><dt>Member since</dt><dd>{user ? new Date(user.createdAt).toLocaleDateString('en', { dateStyle: 'long' }) : '—'}</dd></div><div><dt>Onboarding</dt><dd>{user?.onboardingCompleted ? 'Completed' : 'In progress'}</dd></div></dl>
        </section>
        <section id="local-day"><header><p className="eyebrow">Local day</p><h2>Your timezone.</h2></header><div className="field"><label htmlFor="timezone">Current timezone</label><input id="timezone" value={user?.timezone ?? ''} readOnly /></div><p className={styles.explain}>Day boundaries use this timezone. Existing check-ins retain their recorded calendar date. Timezone editing is unavailable until the account API supports it.</p><strong className={styles.localTime}>{user ? new Intl.DateTimeFormat('en', { timeZone: user.timezone, dateStyle: 'full', timeStyle: 'short' }).format(new Date()) : ''}</strong></section>
        <section id="accessibility"><header><p className="eyebrow">Accessibility</p><h2>Motion preference.</h2></header><label className={styles.toggle}><span><strong>Reduce motion</strong><small>Show final states immediately and remove decorative movement.</small></span><input type="checkbox" checked={reduced} onChange={event => setReduced(event.target.checked)} /></label></section>
        <section id="data"><header><p className="eyebrow">Your data</p><h2>Take the record with you.</h2></header><p className={styles.explain}>Export your habits, check-ins, relapses, goals, and account metadata as JSON.</p><button className="raisedSecondary" disabled={exporting} onClick={exportData}>{exporting ? 'Preparing…' : 'Export activity'}</button></section>
        <section className={styles.danger}><header><p className="eyebrow">Danger zone</p><h2>Account deletion.</h2></header><p>Permanent account deletion is not available because the current backend does not expose a deletion endpoint. No local control will pretend to delete server data.</p></section>
      </div>
    </div>
  </>;
}
