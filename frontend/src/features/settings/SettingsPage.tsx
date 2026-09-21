import { useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { PageHeader } from '../../components/layout/PageHeader';
import { FormOverlay } from '../../components/ui/FormOverlay';
import { UserAvatar } from '../../components/ui/UserAvatar';
import { useToast } from '../../components/ui/ToastProvider';
import { ApiError } from '../../lib/api';
import { authApi } from '../auth/auth.api';
import { sessionKey, useSession } from '../auth/auth.queries';
import { exportApi } from './export.api';
import styles from './SettingsPage.module.css';

const timezoneValues = () => {
  try {
    return (Intl as typeof Intl & { supportedValuesOf: (key: 'timeZone') => string[] }).supportedValuesOf('timeZone');
  } catch {
    return ['UTC', 'Asia/Jakarta', 'Asia/Makassar', 'Asia/Jayapura'];
  }
};

export function SettingsPage() {
  const session = useSession();
  const cache = useQueryClient();
  const navigate = useNavigate();
  const { pushToast } = useToast();
  const user = session.data?.user;
  const [username, setUsername] = useState('');
  const [timezone, setTimezone] = useState('UTC');
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [reduced, setReduced] = useState(() => localStorage.getItem('reduce-motion') === 'true');
  const [reminder, setReminder] = useState(() => localStorage.getItem('daily-reminder') === 'true');
  const [reminderTime, setReminderTime] = useState(() => localStorage.getItem('daily-reminder-time') || '20:00');
  const timezones = useMemo(() => timezoneValues(), []);

  useEffect(() => {
    if (user) {
      setUsername(user.username);
      setTimezone(user.timezone);
    }
  }, [user]);
  useEffect(() => {
    document.documentElement.dataset.reduceMotion = String(reduced);
    localStorage.setItem('reduce-motion', String(reduced));
  }, [reduced]);
  useEffect(() => {
    localStorage.setItem('daily-reminder', String(reminder));
    localStorage.setItem('daily-reminder-time', reminderTime);
  }, [reminder, reminderTime]);
  useEffect(() => {
    if (!reminder) return;
    const check = () => {
      const now = new Date();
      const key = `${now.toISOString().slice(0, 10)}-${reminderTime}`;
      if (
        `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}` === reminderTime &&
        sessionStorage.getItem('reminder-shown') !== key
      ) {
        sessionStorage.setItem('reminder-shown', key);
        pushToast({
          variant: 'info',
          title: 'Your daily check-in',
          message: 'Take a moment to resolve today’s habits.',
        });
      }
    };
    check();
    const timer = window.setInterval(check, 30_000);
    return () => window.clearInterval(timer);
  }, [pushToast, reminder, reminderTime]);

  const saveProfile = async () => {
    if (!username.trim())
      return pushToast({
        variant: 'error',
        title: 'Username required',
        message: 'Add at least one visible character.',
      });
    setSaving(true);
    try {
      const result = await authApi.updateProfile({ username: username.trim(), timezone });
      cache.setQueryData(sessionKey, result);
      pushToast({ variant: 'success', title: 'Profile saved', message: 'Your initial and local day are up to date.' });
    } catch (error) {
      pushToast({
        variant: 'error',
        title: 'Profile not saved',
        message: error instanceof ApiError ? error.message : 'Check your connection and try again.',
      });
    } finally {
      setSaving(false);
    }
  };
  const exportData = async () => {
    setExporting(true);
    try {
      const exported = await exportApi.get();
      const blob = new Blob([JSON.stringify(exported, null, 2)], { type: 'application/json' });
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
  const deleteAccount = async () => {
    setDeleting(true);
    try {
      await authApi.deleteAccount();
      cache.clear();
      navigate('/', { replace: true });
    } catch {
      setDeleting(false);
      pushToast({
        variant: 'error',
        title: 'Account not deleted',
        message: 'Nothing was removed. Check your connection and try again.',
      });
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="Account & preferences"
        title="Settings."
        summary="Keep your identity, local day, reminders, and interface preferences accurate."
      />
      <div className={styles.layout}>
        <nav aria-label="Settings sections">
          <a href="#profile">Profile</a>
          <a href="#local-day">Local day</a>
          <a href="#accessibility">Preferences</a>
          <a href="#data">Your data</a>
        </nav>
        <div className={styles.sections}>
          <section id="profile">
            <div className={styles.profileHead}>
              {user && <UserAvatar username={username} email={user.email} size="large" />}
              <header>
                <p className="eyebrow">Profile</p>
                <h2>Account identity.</h2>
              </header>
            </div>
            <div className={styles.profileGrid}>
              <div className="field">
                <label htmlFor="settings-username">Username</label>
                <input
                  id="settings-username"
                  value={username}
                  maxLength={191}
                  onChange={(event) => setUsername(event.target.value)}
                />
              </div>
              <div className="field">
                <label htmlFor="settings-email">Email</label>
                <input id="settings-email" value={user?.email ?? ''} readOnly />
              </div>
            </div>
            <p className={styles.explain}>
              Your avatar uses the first visible character of your username. Email is your sign-in identity and cannot
              be changed here.
            </p>
          </section>
          <section id="local-day">
            <header>
              <p className="eyebrow">Local day</p>
              <h2>Your timezone.</h2>
            </header>
            <div className="field">
              <label htmlFor="timezone">Current timezone</label>
              <select id="timezone" value={timezone} onChange={(event) => setTimezone(event.target.value)}>
                {timezones.map((zone) => (
                  <option key={zone} value={zone}>
                    {zone.replaceAll('_', ' ')}
                  </option>
                ))}
              </select>
            </div>
            <p className={styles.explain}>
              Day boundaries use this timezone. Existing check-ins retain their recorded calendar date.
            </p>
            <strong className={styles.localTime}>
              {user
                ? new Intl.DateTimeFormat('en', { timeZone: timezone, dateStyle: 'full', timeStyle: 'short' }).format(
                    new Date(),
                  )
                : ''}
            </strong>
            <button
              className="raisedPrimary"
              disabled={saving || (username.trim() === user?.username && timezone === user?.timezone)}
              onClick={saveProfile}
            >
              {saving ? 'Saving…' : 'Save profile & timezone'}
            </button>
          </section>
          <section id="accessibility">
            <header>
              <p className="eyebrow">Preferences</p>
              <h2>Make the interface yours.</h2>
            </header>
            <label className={styles.toggle}>
              <span>
                <strong>Reduce motion</strong>
                <small>Show final states immediately and remove decorative movement.</small>
              </span>
              <input type="checkbox" checked={reduced} onChange={(event) => setReduced(event.target.checked)} />
            </label>
            <label className={styles.toggle}>
              <span>
                <strong>Daily in-app reminder</strong>
                <small>Shown only while Habit Shaper is open in this browser.</small>
              </span>
              <input type="checkbox" checked={reminder} onChange={(event) => setReminder(event.target.checked)} />
            </label>
            {reminder && (
              <div className="field">
                <label htmlFor="reminder-time">Reminder time</label>
                <input
                  id="reminder-time"
                  type="time"
                  value={reminderTime}
                  onChange={(event) => setReminderTime(event.target.value)}
                />
              </div>
            )}
          </section>
          <section id="data">
            <header>
              <p className="eyebrow">Your data</p>
              <h2>Take the record with you.</h2>
            </header>
            <p className={styles.explain}>
              Export your habits, check-ins, relapses, goals, and account metadata as JSON.
            </p>
            <button className="raisedSecondary" disabled={exporting} onClick={exportData}>
              {exporting ? 'Preparing…' : 'Export activity'}
            </button>
          </section>
          <section className={styles.danger}>
            <header>
              <p className="eyebrow">Danger zone</p>
              <h2>Delete the account.</h2>
            </header>
            <p>
              This permanently removes your account, habits, history, goals, and active sessions. Export first if you
              want a copy.
            </p>
            <button className={styles.deleteButton} onClick={() => setConfirmDelete(true)}>
              Delete account
            </button>
          </section>
        </div>
      </div>
      {confirmDelete && (
        <FormOverlay
          title="Delete everything?"
          eyebrow="Permanent action"
          pending={deleting}
          onClose={() => setConfirmDelete(false)}
          copy="This cannot be undone. Your entire Habit Shaper record will be removed."
          footer={
            <>
              <button className="raisedSecondary" disabled={deleting} onClick={() => setConfirmDelete(false)}>
                Keep account
              </button>
              <button className={styles.deleteConfirm} disabled={deleting} onClick={deleteAccount}>
                {deleting ? 'Deleting…' : 'Delete permanently'}
              </button>
            </>
          }
        >
          <p className={styles.deleteNotice}>There is no recovery period after confirmation.</p>
        </FormOverlay>
      )}
    </>
  );
}
