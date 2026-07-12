import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail, AlertCircle } from 'lucide-react';
import api from '../../lib/api';
import { useAuthStore } from '../../store/useAuthStore';
import './LoginPage.css';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuthStore();

  const [email, setEmail] = useState('admin@transitops.io');
  const [password, setPassword] = useState('Admin@123');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const from = (location.state as any)?.from?.pathname || '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { setError('Email and password are required'); return; }

    setLoading(true);
    setError('');
    try {
      const { data } = await api.post('/auth/login', { email, password });
      login(data.user, data.token);
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed. Check credentials.');
      const card = document.querySelector('.login-card');
      card?.classList.remove('shake');
      void (card as HTMLElement)?.offsetWidth;
      card?.classList.add('shake');
    } finally {
      setLoading(false);
    }
  };

  const demoAccounts = [
    { email: 'admin@transitops.io', password: 'Admin@123', role: 'Admin' },
    { email: 'dispatch@transitops.io', password: 'Dispatch@123', role: 'Dispatcher' },
    { email: 'fleet@transitops.io', password: 'Fleet@123', role: 'Fleet Manager' },
  ];

  return (
    <div className="login-bg">
      {/* Decorative grid */}
      <div className="login-grid" aria-hidden="true" />

      <div className="login-card scale-in" role="main">
        {/* Header */}
        <div className="login-header">
          <div className="login-logo-mark" aria-hidden="true">
            <svg viewBox="0 0 48 48" fill="none">
              <rect width="48" height="48" rx="14" fill="hsl(16,85%,55%)"/>
              <path d="M8 34 L15 16 L24 28 L33 16 L40 34" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="8" cy="34" r="3" fill="white"/>
              <circle cx="40" cy="34" r="3" fill="white"/>
            </svg>
          </div>
          <div>
            <h1 className="login-title">TransitOps</h1>
            <p className="login-subtitle">Fleet Control Center</p>
          </div>
        </div>

        {/* Screw accents */}
        <div className="card-screw tl" aria-hidden="true" />
        <div className="card-screw tr" aria-hidden="true" />
        <div className="card-screw bl" aria-hidden="true" />
        <div className="card-screw br" aria-hidden="true" />

        <form onSubmit={handleSubmit} className="login-form" noValidate>
          <h2 className="login-form-title">Sign In</h2>

          {error && (
            <div className="login-error" role="alert">
              <AlertCircle size={16} aria-hidden="true" />
              {error}
            </div>
          )}

          <div className="form-group">
            <label className="form-label" htmlFor="login-email">Email Address</label>
            <div className="input-icon-wrap">
              <Mail size={16} className="input-icon" aria-hidden="true" />
              <input
                id="login-email"
                type="email"
                className="input-field input-with-icon"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                autoComplete="email"
                required
                aria-required="true"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="login-password">Password</label>
            <div className="input-icon-wrap">
              <Lock size={16} className="input-icon" aria-hidden="true" />
              <input
                id="login-password"
                type={showPw ? 'text' : 'password'}
                className="input-field input-with-icon input-with-action"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Your password"
                autoComplete="current-password"
                required
                aria-required="true"
              />
              <button
                type="button"
                className="input-action-btn"
                onClick={() => setShowPw(!showPw)}
                aria-label={showPw ? 'Hide password' : 'Show password'}
              >
                {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn-pill login-submit"
            disabled={loading}
            aria-busy={loading}
          >
            {loading
              ? <><div className="spin" style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%' }} />Signing in...</>
              : 'Sign In to Fleet'}
          </button>
        </form>

        {/* Demo accounts */}
        <div className="login-demo">
          <p className="login-demo-title">Demo Accounts</p>
          <div className="login-demo-chips">
            {demoAccounts.map((acc) => (
              <button
                key={acc.email}
                className="demo-chip"
                type="button"
                onClick={() => { setEmail(acc.email); setPassword(acc.password); }}
              >
                {acc.role}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
