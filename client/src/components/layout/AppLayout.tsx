import { Outlet } from 'react-router-dom';
import { useEffect } from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import BottomNav from './BottomNav';
import { useThemeStore } from '../../store/useThemeStore';
import './AppLayout.css';

export default function AppLayout() {
  const { theme } = useThemeStore();

  // Apply theme on mount
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="app-main">
        <Topbar />
        <main className="app-content" id="main-content">
          <Outlet />
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
