import { useState } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { User, Bell, Shield, Palette, Database, Save, Moon, Sun } from 'lucide-react';
import './SettingsPage.css';

type Tab = 'profile' | 'notifications' | 'appearance' | 'security' | 'system';

export default function SettingsPage() {
  const { user } = useAuthStore();
  const [tab, setTab] = useState<Tab>('profile');
  const [theme, setTheme] = useState<'light' | 'dark'>(() =>
    document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light');
  const [saved, setSaved] = useState(false);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    document.documentElement.dataset.theme = next;
    localStorage.setItem('transitops-theme', next);
  };

  const save = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const TABS: { key: Tab; label: string; icon: React.ElementType }[] = [
    { key: 'profile',       label: 'Profile',       icon: User },
    { key: 'notifications', label: 'Notifications', icon: Bell },
    { key: 'appearance',    label: 'Appearance',    icon: Palette },
    { key: 'security',      label: 'Security',      icon: Shield },
    { key: 'system',        label: 'System',        icon: Database },
  ];

  return (
    <div className="settings-page page-enter">
      <div className="settings-header">
        <h1 className="text-h1">Settings</h1>
      </div>

      <div className="settings-layout">
        {/* Sidebar nav */}
        <nav className="settings-nav neu-card no-hover">
          {TABS.map(t => {
            const Icon = t.icon;
            return (
              <button key={t.key} className={`settings-nav-item ${tab === t.key ? 'active' : ''}`}
                onClick={() => setTab(t.key)}>
                <Icon size={16} />
                {t.label}
              </button>
            );
          })}
        </nav>

        {/* Content */}
        <div className="settings-content">
          {tab === 'profile' && (
            <div className="settings-section slide-up">
              <h2 className="settings-section-title">Profile</h2>
              <div className="settings-card neu-card no-hover">
                <div className="profile-avatar-row">
                  <div className="profile-avatar">
                    {user?.firstName?.[0]}{user?.lastName?.[0]}
                  </div>
                  <div>
                    <div className="profile-name">{user?.firstName} {user?.lastName}</div>
                    <div className="profile-role badge available">{user?.role}</div>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">First Name</label>
                    <input className="input-field" defaultValue={user?.firstName} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Last Name</label>
                    <input className="input-field" defaultValue={user?.lastName} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input className="input-field" type="email" defaultValue={user?.email} />
                </div>
                <button className="btn btn-pill" style={{ alignSelf: 'flex-start' }} onClick={save}>
                  {saved ? '✓ Saved!' : <><Save size={14} /> Save Profile</>}
                </button>
              </div>
            </div>
          )}

          {tab === 'appearance' && (
            <div className="settings-section slide-up">
              <h2 className="settings-section-title">Appearance</h2>
              <div className="settings-card neu-card no-hover">
                <div className="settings-row">
                  <div>
                    <div className="settings-row-title">Theme</div>
                    <div className="settings-row-desc">Toggle between light and dark mode</div>
                  </div>
                  <button className="theme-toggle-btn" onClick={toggleTheme}>
                    {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                    {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                  </button>
                </div>
                <div className="settings-row">
                  <div>
                    <div className="settings-row-title">Accent Color</div>
                    <div className="settings-row-desc">GaugeOS signature palette</div>
                  </div>
                  <div className="color-swatches">
                    {['hsl(16,85%,55%)', 'hsl(200,60%,48%)', 'hsl(152,55%,42%)', 'hsl(38,90%,55%)'].map(c => (
                      <div key={c} className="color-swatch" style={{ background: c }} title={c} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {tab === 'notifications' && (
            <div className="settings-section slide-up">
              <h2 className="settings-section-title">Notifications</h2>
              <div className="settings-card neu-card no-hover">
                {[
                  { key: 'license_expiry', label: 'License Expiry Alerts', desc: 'Notify 30 days before driver license expires' },
                  { key: 'maintenance_due', label: 'Maintenance Due', desc: 'Notify when vehicle maintenance is overdue' },
                  { key: 'fuel_anomaly', label: 'Fuel Anomaly Detection', desc: 'Alert on unusual fuel consumption patterns' },
                  { key: 'trip_updates', label: 'Trip Status Updates', desc: 'Notify on trip state changes' },
                  { key: 'drowsiness', label: 'Drowsiness Alerts', desc: 'Real-time CV detection alerts' },
                ].map(n => (
                  <div key={n.key} className="settings-row">
                    <div>
                      <div className="settings-row-title">{n.label}</div>
                      <div className="settings-row-desc">{n.desc}</div>
                    </div>
                    <label className="toggle-switch">
                      <input type="checkbox" defaultChecked />
                      <span className="toggle-track" />
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === 'security' && (
            <div className="settings-section slide-up">
              <h2 className="settings-section-title">Security</h2>
              <div className="settings-card neu-card no-hover">
                <div className="form-group">
                  <label className="form-label">Current Password</label>
                  <input className="input-field" type="password" placeholder="••••••••" />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">New Password</label>
                    <input className="input-field" type="password" placeholder="••••••••" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Confirm Password</label>
                    <input className="input-field" type="password" placeholder="••••••••" />
                  </div>
                </div>
                <button className="btn btn-pill" style={{ alignSelf: 'flex-start' }} onClick={save}>
                  {saved ? '✓ Updated!' : <><Shield size={14} /> Update Password</>}
                </button>
              </div>
            </div>
          )}

          {tab === 'system' && (
            <div className="settings-section slide-up">
              <h2 className="settings-section-title">System</h2>
              <div className="settings-card neu-card no-hover">
                {[
                  { label: 'API Version', value: 'v1.0.0' },
                  { label: 'Database', value: 'PostgreSQL 15' },
                  { label: 'Environment', value: 'Development' },
                  { label: 'Stack', value: 'React + Express + Prisma 7' },
                ].map(item => (
                  <div key={item.label} className="system-info-row">
                    <span className="system-info-label">{item.label}</span>
                    <span className="system-info-val text-mono">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
