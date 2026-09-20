import { BrowserRouter, Navigate, Route, Routes } from 'react-router';
import { AppShell } from '../components/layout/AppShell';
import { useSession } from '../features/auth/auth.queries';
import { LandingPage } from '../features/landing/LandingPage';
import { AuthPage } from '../features/auth/AuthPage';
import { OnboardingPage } from '../features/onboarding/OnboardingPage';
import { DashboardPage } from '../features/dashboard/DashboardPage';
import { HabitsPage } from '../features/habits/HabitsPage';
import { HabitFormPage } from '../features/habits/HabitFormPage';
import { HabitDetailPage } from '../features/habits/HabitDetailPage';
import { GoalsPage } from '../features/goals/GoalsPage';
import { GoalFormPage } from '../features/goals/GoalFormPage';
import { GoalDetailPage } from '../features/goals/GoalDetailPage';
import { StatisticsPage } from '../features/statistics/StatisticsPage';
import { SettingsPage } from '../features/settings/SettingsPage';
import { BrandKitPage } from '../features/brand-kit/BrandKitPage';

function ProtectedShell() {
  const session = useSession();
  if (session.isLoading) return <div className="pageWidth" style={{paddingTop:80}}><div className="skeleton" /></div>;
  if (!session.data?.user) return <Navigate to="/login" replace />;
  if (!session.data.user.onboardingCompleted) return <Navigate to="/onboarding" replace />;
  return <AppShell />;
}

export function App() { return <BrowserRouter><Routes>
  <Route path="/" element={<LandingPage />} />
  <Route path="/login" element={<AuthPage mode="login" />} />
  <Route path="/register" element={<AuthPage mode="register" />} />
  <Route path="/onboarding" element={<OnboardingPage />} />
  <Route path="/brand-kit" element={<BrandKitPage />} />
  <Route path="/app" element={<ProtectedShell />}>
    <Route index element={<DashboardPage />} />
    <Route path="habits" element={<HabitsPage />} />
    <Route path="habits/new" element={<HabitFormPage />} />
    <Route path="habits/:habitId" element={<HabitDetailPage />} />
    <Route path="habits/:habitId/edit" element={<HabitFormPage />} />
    <Route path="goals" element={<GoalsPage />} />
    <Route path="goals/new" element={<GoalFormPage />} />
    <Route path="goals/:goalId" element={<GoalDetailPage />} />
    <Route path="goals/:goalId/edit" element={<GoalFormPage />} />
    <Route path="statistics" element={<StatisticsPage />} />
    <Route path="settings" element={<SettingsPage />} />
  </Route>
  <Route path="*" element={<Navigate to="/" replace />} />
  </Routes></BrowserRouter>; }
