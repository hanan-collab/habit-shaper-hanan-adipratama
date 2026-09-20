import { ChartNoAxesColumnIncreasing, Flame, LogOut } from 'lucide-react';
import { NavLink, Outlet, useNavigate } from 'react-router';
import { useQueryClient } from '@tanstack/react-query';
import { authApi } from '../../features/auth/auth.api';
import { sessionKey, useSession } from '../../features/auth/auth.queries';
import { Dock, DockItem } from '../magicui';
import { UserAvatar } from '../ui/UserAvatar';
import styles from './AppShell.module.css';

const links = [
  { to: '/app', label: 'Today', icon: <Flame size={23} /> },
  { to: '/app/habits', label: 'Habits', icon: <img src="/brand/icons/build.svg" alt="" /> },
  { to: '/app/goals', label: 'Goals', icon: <img src="/brand/icons/goal.svg" alt="" /> },
  { to: '/app/statistics', label: 'Stats', icon: <ChartNoAxesColumnIncreasing size={23} /> },
];

export function AppShell() {
  const navigate = useNavigate();
  const cache = useQueryClient();
  const session = useSession();
  const user = session.data?.user;
  const logout = async () => {
    await authApi.logout();
    cache.setQueryData(sessionKey, null);
    navigate('/');
  };
  return <div className={styles.layout}>
    <main className={styles.main}><Outlet /></main>
    <Dock className={styles.productDock} label="Product navigation">
      {links.map(link => <NavLink key={link.to} end={link.to === '/app'} to={link.to} aria-label={link.label} className={styles.dockLink}>{({ isActive }) => <DockItem label={link.label} active={isActive}><span className={styles.icon}>{link.icon}</span></DockItem>}</NavLink>)}
      <NavLink to="/app/settings" aria-label="Settings" className={styles.dockLink}>{({ isActive }) => <DockItem label="Settings" active={isActive}>{user && <UserAvatar username={user.username} email={user.email} />}</DockItem>}</NavLink>
      <button type="button" aria-label="Log out" className={styles.logout} onClick={logout}><DockItem label="Log out"><LogOut size={22} /></DockItem></button>
    </Dock>
  </div>;
}
