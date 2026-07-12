import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Sun, Moon, Search, X, Truck, Users, Route, Camera, Plus, Fuel, AlertTriangle, CheckCircle2, Wrench } from 'lucide-react';
import { useThemeStore } from '../../store/useThemeStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useLprStore } from '../../store/useLprStore';
import api from '../../lib/api';
import './Topbar.css';

interface SearchResult {
  vehicles: Array<{ id: string; registrationNumber: string; make: string; model: string; status: string }>;
  drivers:  Array<{ id: string; firstName: string; lastName: string; licenseNumber: string; status: string }>;
  trips:    Array<{ id: string; tripNumber: string; source: string; destination: string; status: string }>;
}

export default function Topbar() {
  const { theme, toggleTheme } = useThemeStore();
  const { user } = useAuthStore();
  const { openLpr } = useLprStore();
  const navigate = useNavigate();

  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult | null>(null);
  const [searching, setSearching] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  // Close notif on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (notifOpen && notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [notifOpen]);

  // Cmd+K shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
        setTimeout(() => searchRef.current?.focus(), 50);
      }
      if (e.key === 'Escape') setSearchOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Debounced search
  useEffect(() => {
    if (!searchQuery.trim()) { setSearchResults(null); return; }
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const { data } = await api.get(`/search?q=${encodeURIComponent(searchQuery)}`);
        setSearchResults(data);
      } catch { /* silent */ }
      finally { setSearching(false); }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleResultClick = (path: string) => {
    navigate(path);
    setSearchOpen(false);
    setSearchQuery('');
    setSearchResults(null);
  };

  const totalResults = searchResults
    ? (searchResults.vehicles.length + searchResults.drivers.length + searchResults.trips.length)
    : 0;

  return (
    <>
      <header className="topbar">
        {/* Mobile logo */}
        <div className="topbar-logo-mobile">
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" width="24" height="24">
            <rect width="24" height="24" rx="6" fill="hsl(16,85%,55%)"/>
            <path d="M4 16 L7 8 L12 13 L17 8 L20 16" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span>TransitOps</span>
        </div>

        {/* Search trigger */}
        <button
          className="topbar-search-trigger"
          onClick={() => { setSearchOpen(true); setTimeout(() => searchRef.current?.focus(), 50); }}
          aria-label="Search (Ctrl+K)"
        >
          <Search size={16} aria-hidden="true" />
          <span>Search fleet, drivers, trips...</span>
          <kbd>Ctrl K</kbd>
        </button>

        {/* Actions */}
        <div className="topbar-actions">
          <div className="topbar-quick-actions" style={{ display: 'flex', gap: '8px', marginRight: '16px' }}>
            <button className="topbar-btn-3d orange" onClick={() => openLpr()}>
              <Camera size={14} /> License Plate
            </button>
            <button className="topbar-btn-3d light" onClick={() => navigate('/trips')}>
              <Plus size={14} /> New Trip
            </button>
            <button className="topbar-btn-3d light" onClick={() => navigate('/fuel')}>
              <Fuel size={14} /> Log Fuel
            </button>
          </div>

          <button className="btn-round" onClick={toggleTheme} aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}>
            {theme === 'light' ? <Moon size={16} aria-hidden="true" /> : <Sun size={16} aria-hidden="true" />}
          </button>

          <div style={{ position: 'relative' }} ref={notifRef}>
            <button className="btn-round topbar-bell" onClick={() => setNotifOpen(!notifOpen)} aria-label="Notifications">
              <Bell size={16} aria-hidden="true" />
              <span className="topbar-badge" aria-label="4 unread notifications">4</span>
            </button>
            
            {notifOpen && (
              <div className="notif-dropdown slide-up">
                <div className="notif-header">
                  <h3 style={{ margin: 0, fontSize: 'var(--text-sm)', fontWeight: 700 }}>Notifications</h3>
                  <button className="btn-ghost" style={{ fontSize: 'var(--text-xs)', padding: '4px 8px' }}>Mark all read</button>
                </div>
                <div className="notif-list">
                  <div className="notif-item unread">
                    <div className="notif-icon-wrap danger"><AlertTriangle size={14} /></div>
                    <div className="notif-content">
                      <div className="notif-title">Drowsiness Alert</div>
                      <div className="notif-desc">Driver Rajesh (MH12AB) showed signs of fatigue.</div>
                      <div className="notif-time">2m ago</div>
                    </div>
                  </div>
                  <div className="notif-item unread">
                    <div className="notif-icon-wrap success"><CheckCircle2 size={14} /></div>
                    <div className="notif-content">
                      <div className="notif-title">Trip Completed</div>
                      <div className="notif-desc">TR260012 arrived safely at destination.</div>
                      <div className="notif-time">15m ago</div>
                    </div>
                  </div>
                  <div className="notif-item">
                    <div className="notif-icon-wrap warning"><Wrench size={14} /></div>
                    <div className="notif-content">
                      <div className="notif-title">Maintenance Due</div>
                      <div className="notif-desc">Van GJ05CD is due for oil change today.</div>
                      <div className="notif-time">1h ago</div>
                    </div>
                  </div>
                </div>
                <div className="notif-footer" style={{ textAlign: 'center' }}>
                  <button className="btn-ghost" onClick={() => { setNotifOpen(false); navigate('/notifications'); }} style={{ width: '100%', fontSize: 'var(--text-xs)' }}>View All Activity</button>
                </div>
              </div>
            )}
          </div>

          <div className="topbar-user-chip">
            <div className="topbar-avatar" aria-hidden="true">
              {user ? `${user.firstName[0]}${user.lastName[0]}` : 'U'}
            </div>
            <span className="topbar-user-name">{user?.firstName}</span>
          </div>
        </div>
      </header>

      {/* Search modal */}
      {searchOpen && (
        <div className="search-overlay" role="dialog" aria-modal="true" aria-label="Global search" onClick={() => setSearchOpen(false)}>
          <div className="search-modal scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="search-input-wrap">
              <Search size={18} className="search-icon" aria-hidden="true" />
              <input
                ref={searchRef}
                type="search"
                className="search-input"
                placeholder="Search vehicles, drivers, trips..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Search"
                autoComplete="off"
              />
              {searching && <div className="spin search-spinner" aria-hidden="true" />}
              <button className="btn-round search-close" onClick={() => setSearchOpen(false)} aria-label="Close search">
                <X size={14} aria-hidden="true" />
              </button>
            </div>

            {searchResults && totalResults > 0 && (
              <div className="search-results" role="listbox" aria-label="Search results">
                {searchResults.vehicles.length > 0 && (
                  <div className="search-group">
                    <div className="search-group-label"><Truck size={12} aria-hidden="true" /> Vehicles</div>
                    {searchResults.vehicles.map((v) => (
                      <button key={v.id} className="search-result-item" role="option" onClick={() => handleResultClick(`/vehicles/${v.id}`)}>
                        <span className="search-result-main">{v.registrationNumber}</span>
                        <span className="search-result-sub">{v.make} {v.model}</span>
                        <span className={`badge ${v.status.toLowerCase().replace('_', '-')}`}>{v.status.replace('_', ' ')}</span>
                      </button>
                    ))}
                  </div>
                )}
                {searchResults.drivers.length > 0 && (
                  <div className="search-group">
                    <div className="search-group-label"><Users size={12} aria-hidden="true" /> Drivers</div>
                    {searchResults.drivers.map((d) => (
                      <button key={d.id} className="search-result-item" role="option" onClick={() => handleResultClick(`/drivers/${d.id}`)}>
                        <span className="search-result-main">{d.firstName} {d.lastName}</span>
                        <span className="search-result-sub">{d.licenseNumber}</span>
                        <span className={`badge ${d.status.toLowerCase().replace('_', '-')}`}>{d.status.replace('_', ' ')}</span>
                      </button>
                    ))}
                  </div>
                )}
                {searchResults.trips.length > 0 && (
                  <div className="search-group">
                    <div className="search-group-label"><Route size={12} aria-hidden="true" /> Trips</div>
                    {searchResults.trips.map((t) => (
                      <button key={t.id} className="search-result-item" role="option" onClick={() => handleResultClick(`/trips/${t.id}`)}>
                        <span className="search-result-main">{t.tripNumber}</span>
                        <span className="search-result-sub">{t.source} to {t.destination}</span>
                        <span className={`badge ${t.status.toLowerCase().replace('_', '-')}`}>{t.status.replace('_', ' ')}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {searchResults && totalResults === 0 && (
              <div className="search-empty">No results for "{searchQuery}"</div>
            )}

            {!searchQuery && (
              <div className="search-hint">
                <kbd>Enter</kbd> to search &nbsp;|&nbsp; <kbd>Esc</kbd> to close
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
