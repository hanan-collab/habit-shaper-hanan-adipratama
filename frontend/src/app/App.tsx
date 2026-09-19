import { BrowserRouter, Navigate, Route, Routes } from 'react-router';
import { AppShell } from '../components/layout/AppShell';
import { useSession } from '../features/auth/auth.queries';
import { LandingPage } from '../features/landing/LandingPage';

function Placeholder({ title }: { title: string }) { return <section className="pageWidth"><p className="eyebrow">Habit Shaper</p><h1>{title}</h1><p>This page is being shaped.</p></section>; }
function ProtectedShell() {
  const session = useSession();
  if (session.isLoading) return <div className="pageWidth" style={{paddingTop:80}}><div className="skeleton" /></div>;
  if (!session.data?.user) return <Navigate to="/login" replace />;
  if (!session.data.user.onboardingCompletedAt) return <Navigate to="/onboarding" replace />;
  return <AppShell />;
}

export function App() { return <BrowserRouter><Routes>
  <Route path="/" element={<LandingPage />} />
  <Route path="/login" element={<Placeholder title="Welcome back." />} />
  <Route path="/register" element={<Placeholder title="Start with one habit." />} />
  <Route path="/onboarding" element={<Placeholder title="Start with one thing." />} />
  <Route path="/brand-kit" element={<Placeholder title="The Monument system." />} />
  <Route path="/app" element={<ProtectedShell />}>
    <Route index element={<Placeholder title="Today." />} />
    <Route path="habits" element={<Placeholder title="Your habits." />} />
    <Route path="habits/new" element={<Placeholder title="Shape a habit." />} />
    <Route path="habits/:habitId" element={<Placeholder title="Habit detail." />} />
    <Route path="habits/:habitId/edit" element={<Placeholder title="Edit habit." />} />
    <Route path="goals" element={<Placeholder title="Goals." />} />
    <Route path="goals/new" element={<Placeholder title="Set a finish line." />} />
    <Route path="goals/:goalId" element={<Placeholder title="Goal detail." />} />
    <Route path="goals/:goalId/edit" element={<Placeholder title="Edit goal." />} />
    <Route path="statistics" element={<Placeholder title="Your pattern." />} />
    <Route path="settings" element={<Placeholder title="Settings." />} />
  </Route>
  <Route path="*" element={<Navigate to="/" replace />} />
  </Routes></BrowserRouter>; }
