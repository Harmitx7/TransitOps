import { NavLink } from 'react-router-dom';
import { Gauge, Truck, Route, MapPin, Ellipsis } from 'lucide-react';
import './BottomNav.css';

const bottomItems = [
  { icon: Gauge, label: 'Dashboard', to: '/' },
  { icon: Truck,  label: 'Fleet',     to: '/vehicles' },
  { icon: Route,  label: 'Trips',     to: '/trips' },
  { icon: MapPin, label: 'Map',       to: '/map' },
  { icon: Ellipsis, label: 'More',   to: '/settings' },
];

export default function BottomNav() {
  return (
    <nav className="bottom-nav" aria-label="Mobile navigation">
      {bottomItems.map(({ icon: Icon, label, to }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          className={({ isActive }) => `bottom-nav-item${isActive ? ' active' : ''}`}
        >
          <Icon size={20} aria-hidden="true" />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
