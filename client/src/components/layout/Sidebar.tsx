import { NavLink, useNavigate } from 'react-router-dom';
import {
  Gauge, Truck, Users, Route, Wrench, Fuel,
  FileBarChart, MapPin, ClipboardCheck, Camera,
  Brain, Bell, Settings, LogOut, ChevronRight
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import './Sidebar.css';

const navItems = [
  { icon: Gauge,          label: 'Dashboard',    to: '/' },
  { icon: Truck,          label: 'Fleet',        to: '/vehicles' },
  { icon: Users,          label: 'Drivers',      to: '/drivers' },
  { icon: Route,          label: 'Trips',        to: '/trips' },
  { icon: Wrench,         label: 'Maintenance',  to: '/maintenance' },
  { icon: Fuel,           label: 'Fuel & Costs', to: '/fuel' },
  { icon: FileBarChart,   label: 'Reports',      to: '/reports' },
  { icon: MapPin,         label: 'Live Map',     to: '/map' },
  { icon: ClipboardCheck, label: 'Inspections',  to: '/inspections' },
  { icon: Camera,         label: 'CV Monitor',   to: '/cv' },
  { icon: Brain,          label: 'AI Dispatch',  to: '/ai' },
  { icon: Bell,           label: 'Alerts',       to: '/notifications' },
  { icon: Settings,       label: 'Settings',     to: '/settings' },
];

export default function Sidebar() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const initials = user
    ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
    : 'U';

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="logo-mark">
          <svg viewBox="0 0 32 32" fill="none" aria-hidden="true">
            <rect width="32" height="32" rx="8" fill="hsl(16,85%,55%)"/>
            <path d="M6 22 L10 10 L16 18 L22 10 L26 22" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            <circle cx="6" cy="22" r="2" fill="white"/>
            <circle cx="26" cy="22" r="2" fill="white"/>
          </svg>
        </div>
        <div className="logo-text">
          <span className="logo-name">TransitOps</span>
          <span className="logo-sub">Fleet Control</span>
        </div>
      </div>

      {/* Screw decorations */}
      <div className="sidebar-screw tl" aria-hidden="true" />
      <div className="sidebar-screw tr" aria-hidden="true" />

      {/* Nav */}
      <nav className="sidebar-nav" aria-label="Main navigation">
        {navItems.map(({ icon: Icon, label, to }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) => `sidebar-item${isActive ? ' active' : ''}`}
          >
            <Icon size={18} aria-hidden="true" />
            <span>{label}</span>
            <ChevronRight size={14} className="sidebar-chevron" aria-hidden="true" />
          </NavLink>
        ))}
      </nav>

      {/* User footer */}
      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="sidebar-avatar" aria-hidden="true">{initials}</div>
          <div className="sidebar-user-info">
            <span className="sidebar-user-name">{user?.firstName} {user?.lastName}</span>
            <span className="sidebar-user-role">{user?.role.replace('_', ' ')}</span>
          </div>
        </div>
        <button className="sidebar-logout btn-round" onClick={handleLogout} aria-label="Sign out">
          <LogOut size={16} aria-hidden="true" />
        </button>
      </div>
    </aside>
  );
}
