import { lazy, Suspense } from 'react';
import { BrowserRouter, Link, Navigate, Outlet, Route, Routes, useRouteError } from 'react-router';
import { AppShell } from '../components/layout/AppShell';
import { useSession } from '../features/auth/auth.queries';
import { AuthPage } from '../features/auth/AuthPage';
import { LandingPage } from '../features/landing/LandingPage';

const OnboardingPage = lazy(() =>
  import('../features/onboarding/OnboardingPage').then((module) => ({ default: module.OnboardingPage })),
);
const DashboardPage = lazy(() =>
  import('../features/dashboard/DashboardPage').then((module) => ({ default: module.DashboardPage })),
);
const HabitsPage = lazy(() =>
  import('../features/habits/HabitsPage').then((module) => ({ default: module.HabitsPage })),
);
const HabitFormPage = lazy(() =>
  import('../features/habits/HabitFormPage').then((module) => ({ default: module.HabitFormPage })),
);
const HabitDetailPage = lazy(() =>
  import('../features/habits/HabitDetailPage').then((module) => ({ default: module.HabitDetailPage })),
);
const GoalsPage = lazy(() => import('../features/goals/GoalsPage').then((module) => ({ default: module.GoalsPage })));
const GoalFormPage = lazy(() =>
  import('../features/goals/GoalFormPage').then((module) => ({ default: module.GoalFormPage })),
);
const GoalDetailPage = lazy(() =>
  import('../features/goals/GoalDetailPage').then((module) => ({ default: module.GoalDetailPage })),
);
const StatisticsPage = lazy(() =>
  import('../features/statistics/StatisticsPage').then((module) => ({ default: module.StatisticsPage })),
);
const SettingsPage = lazy(() =>
  import('../features/settings/SettingsPage').then((module) => ({ default: module.SettingsPage })),
);
const BrandKitPage = lazy(() =>
  import('../features/brand-kit/BrandKitPage').then((module) => ({ default: module.BrandKitPage })),
);

function RouteFallback() {
  return (
    <div className="pageWidth" style={{ paddingTop: 80 }}>
      <div className="skeleton" />
    </div>
  );
}

function RouteError() {
  const error = useRouteError();
  const message = error instanceof Error ? error.message : 'The page could not be loaded.';
  return (
    <main className="pageWidth" style={{ paddingTop: 80 }}>
      <section className="panel">
        <h1>Something went wrong.</h1>
        <p>{message}</p>
        <Link className="raisedSecondary" to="/">
          Return home
        </Link>
      </section>
    </main>
  );
}

function ProtectedShell() {
  const session = useSession();
  if (session.isLoading) return <RouteFallback />;
  if (!session.data?.user) return <Navigate to="/login" replace />;
  if (!session.data.user.onboardingCompleted) return <Navigate to="/onboarding" replace />;
  return <AppShell />;
}

function HabitsLibraryRoute() {
  return (
    <>
      <HabitsPage />
      <Outlet />
    </>
  );
}

function GoalsLibraryRoute() {
  return (
    <>
      <GoalsPage />
      <Outlet />
    </>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/" element={<LandingPage />} errorElement={<RouteError />} />
          <Route path="/login" element={<AuthPage mode="login" />} errorElement={<RouteError />} />
          <Route path="/register" element={<AuthPage mode="register" />} errorElement={<RouteError />} />
          <Route path="/onboarding" element={<OnboardingPage />} errorElement={<RouteError />} />
          <Route path="/brand-kit" element={<BrandKitPage />} errorElement={<RouteError />} />
          <Route path="/app" element={<ProtectedShell />} errorElement={<RouteError />}>
            <Route index element={<DashboardPage />} />
            <Route path="habits" element={<HabitsLibraryRoute />}>
              <Route path="new" element={<HabitFormPage />} />
            </Route>
            <Route path="habits/:habitId" element={<HabitDetailPage />} />
            <Route path="habits/:habitId/edit" element={<HabitFormPage />} />
            <Route path="goals" element={<GoalsLibraryRoute />}>
              <Route path="new" element={<GoalFormPage />} />
            </Route>
            <Route path="goals/:goalId" element={<GoalDetailPage />} />
            <Route path="goals/:goalId/edit" element={<GoalFormPage />} />
            <Route path="statistics" element={<StatisticsPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
