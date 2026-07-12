import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Plus, Filter, Search, Edit2, Eye, X, Shield, AlertTriangle } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import './DriverListPage.css';

type DriverStatus = 'AVAILABLE' | 'ON_TRIP' | 'ON_LEAVE' | 'SUSPENDED';

interface Driver {
  id: string; firstName: string; lastName: string; phone: string; email?: string;
  licenseNumber: string; licenseCategory: string; licenseExpiry: string;
  status: DriverStatus; safetyScore: number;
}

const STATUS_CONFIG: Record<DriverStatus, { label: string; css: string }> = {
  AVAILABLE:  { label: 'Available',  css: 'available' },
  ON_TRIP:    { label: 'On Trip',    css: 'on-trip' },
  ON_LEAVE:   { label: 'On Leave',   css: 'in-shop' },
  SUSPENDED:  { label: 'Suspended',  css: 'suspended' },
};

function LicenseExpiryBadge({ expiry }: { expiry: string }) {
  const days = Math.floor((new Date(expiry).getTime() - Date.now()) / 86400000);
  if (days < 0) return <span className="expiry-badge expiry-expired">Expired</span>;
  if (days < 7) return <span className="expiry-badge expiry-critical">{days}d left</span>;
  if (days < 30) return <span className="expiry-badge expiry-warning">{days}d left</span>;
  return <span className="expiry-badge expiry-ok">{days}d left</span>;
}

function SafetyGauge({ score }: { score: number }) {
  const color = score >= 80 ? 'var(--accent-success)' : score >= 60 ? 'var(--accent-warning)' : 'var(--accent-danger)';
  const r = 22;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  return (
    <div className="safety-gauge-wrap" title={`Safety Score: ${score}`}>
      <svg width={54} height={54} style={{ transform: 'rotate(-90deg)' }} aria-hidden="true">
        <circle cx={27} cy={27} r={r} fill="none" stroke="var(--bg-sunken)" strokeWidth={6} />
        <circle cx={27} cy={27} r={r} fill="none" stroke={color} strokeWidth={6}
          strokeDasharray={`${dash} ${circ - dash}`} strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 1s cubic-bezier(0.34,1.56,0.64,1)' }} />
      </svg>
      <span className="safety-val text-mono" style={{ color }}>{score}</span>
    </div>
  );
}

function DriverAvatar({ driver }: { driver: Driver }) {
  const score = driver.safetyScore;
  const bg = score >= 80 ? 'var(--accent-success)' : score >= 60 ? 'var(--accent-warning)' : 'var(--accent-danger)';
  return (
    <div className="driver-avatar" style={{ background: bg }}>
      {driver.firstName[0]}{driver.lastName[0]}
    </div>
  );
}

function DriverCard({ d, onView, onEdit }: { d: Driver; onView: () => void; onEdit: () => void }) {
  const cfg = STATUS_CONFIG[d.status];
  return (
    <article className="driver-card neu-card no-hover slide-up">
      <div className="dc-screw dc-screw-tl" /><div className="dc-screw dc-screw-tr" />
      <div className="dc-header">
        <DriverAvatar driver={d} />
        <SafetyGauge score={d.safetyScore} />
      </div>
      <div className="dc-name">{d.firstName} {d.lastName}</div>
      <div className="dc-license text-mono">{d.licenseNumber} · {d.licenseCategory}</div>
      <div className="dc-row">
        <span className={`badge ${cfg.css}`}>{cfg.label}</span>
        <LicenseExpiryBadge expiry={d.licenseExpiry} />
      </div>
      <div className="dc-phone">{d.phone}</div>
      <div className="dc-actions">
        <button className="btn btn-ghost btn-pill sm" onClick={onView}><Eye size={13} /> View</button>
        <button className="btn-round" onClick={onEdit} aria-label="Edit driver"><Edit2 size={14} /></button>
      </div>
    </article>
  );
}

/* ── Driver Form Modal ── */
function DriverFormModal({ driver, onClose }: { driver?: Driver; onClose: () => void }) {
  const qc = useQueryClient();
  const isEdit = !!driver;
  const [form, setForm] = useState({
    firstName: driver?.firstName ?? '', lastName: driver?.lastName ?? '',
    phone: driver?.phone ?? '', email: driver?.email ?? '',
    licenseNumber: driver?.licenseNumber ?? '',
    licenseCategory: driver?.licenseCategory ?? 'LMV',
    licenseExpiry: driver?.licenseExpiry ? driver.licenseExpiry.split('T')[0] : '',
    status: driver?.status ?? 'AVAILABLE',
  });
  const [error, setError] = useState('');

  const mutation = useMutation({
    mutationFn: async (data: typeof form) => {
      if (isEdit) return api.patch(`/drivers/${driver!.id}`, data);
      return api.post('/drivers', data);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['drivers'] }); onClose(); },
    onError: (e: any) => setError(e?.response?.data?.message ?? 'Save failed'),
  });

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel slide-up" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{isEdit ? 'Edit Driver' : 'Add Driver'}</h2>
          <button className="btn-round" onClick={onClose}><X size={16} /></button>
        </div>
        <form className="modal-form" onSubmit={e => { e.preventDefault(); mutation.mutate(form); }}>
          {error && <div className="form-error" style={{ padding: '10px', background: 'hsl(4,70%,95%)', borderRadius: 8 }}>{error}</div>}
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">First Name</label>
              <input className="input-field" value={form.firstName} onChange={set('firstName')} required />
            </div>
            <div className="form-group">
              <label className="form-label">Last Name</label>
              <input className="input-field" value={form.lastName} onChange={set('lastName')} required />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Phone</label>
              <input className="input-field" value={form.phone} onChange={set('phone')} required placeholder="+91 98765 43210" />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input className="input-field" type="email" value={form.email} onChange={set('email')} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">License No.</label>
              <input className="input-field" value={form.licenseNumber} onChange={set('licenseNumber')} required placeholder="GJ0120210012345" />
            </div>
            <div className="form-group">
              <label className="form-label">Category</label>
              <select className="input-field" value={form.licenseCategory} onChange={set('licenseCategory')}>
                {['LMV','HMV','TRANS','PSV','HGV'].map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">License Expiry</label>
              <input className="input-field" type="date" value={form.licenseExpiry} onChange={set('licenseExpiry')} required />
            </div>
            {isEdit && (
              <div className="form-group">
                <label className="form-label">Status</label>
                <select className="input-field" value={form.status} onChange={set('status')}>
                  {Object.keys(STATUS_CONFIG).map(s => <option key={s} value={s}>{STATUS_CONFIG[s as DriverStatus].label}</option>)}
                </select>
              </div>
            )}
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-ghost btn-pill" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-pill" disabled={mutation.isPending}>
              {mutation.isPending ? 'Saving...' : isEdit ? 'Save Changes' : 'Add Driver'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── Main Page ── */
export default function DriverListPage() {
  const navigate = useNavigate();
  const [filterStatus, setFilterStatus] = useState<DriverStatus | 'ALL'>('ALL');
  const [search, setSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [modal, setModal] = useState<{ open: boolean; driver?: Driver }>({ open: false });

  const { data, isLoading } = useQuery<{ data: Driver[]; total: number }>({
    queryKey: ['drivers'],
    queryFn: async () => { const { data } = await api.get('/drivers?limit=100'); return data; },
  });

  const expiringSoon = data?.data.filter(d => {
    const days = Math.floor((new Date(d.licenseExpiry).getTime() - Date.now()) / 86400000);
    return days >= 0 && days < 30;
  }).length ?? 0;

  const drivers = (data?.data ?? []).filter(d => {
    if (filterStatus !== 'ALL' && d.status !== filterStatus) return false;
    if (search && !`${d.firstName} ${d.lastName} ${d.licenseNumber}`.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="dl-page page-enter">
      <div className="page-header">
        <div>
          <h1 className="text-h1">Driver Management</h1>
          <p className="text-secondary" style={{ fontSize: 'var(--text-sm)', marginTop: 4 }}>
            {data?.total ?? '--'} drivers registered
          </p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--sp-2)' }}>
          <button className="btn btn-ghost btn-pill sm" onClick={() => setShowFilters(f => !f)}>
            <Filter size={14} /> Filters
          </button>
          <button className="btn btn-pill" onClick={() => setModal({ open: true })}>
            <Plus size={14} /> Add Driver
          </button>
        </div>
      </div>

      {expiringSoon > 0 && (
        <div className="dl-alert">
          <AlertTriangle size={16} />
          <span>{expiringSoon} driver license{expiringSoon > 1 ? 's' : ''} expiring within 30 days</span>
        </div>
      )}

      {showFilters && (
        <div className="filter-bar neu-well">
          <div className="filter-search">
            <Search size={16} className="filter-search-icon" />
            <input className="filter-input" placeholder="Search name, license..."
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="filter-pills">
            {(['ALL', 'AVAILABLE', 'ON_TRIP', 'ON_LEAVE', 'SUSPENDED'] as const).map(s => (
              <button key={s} className={`btn btn-pill sm ${filterStatus === s ? '' : 'btn-ghost'}`}
                onClick={() => setFilterStatus(s)}>
                {s === 'ALL' ? 'All' : STATUS_CONFIG[s].label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="vl-status-chips">
        {Object.entries(STATUS_CONFIG).map(([k, v]) => {
          const count = data?.data.filter(x => x.status === k).length ?? 0;
          return (
            <div key={k} className={`status-chip badge ${v.css}`} onClick={() => setFilterStatus(k as DriverStatus)}>
              {v.label}: <strong>{count}</strong>
            </div>
          );
        })}
      </div>

      {isLoading ? (
        <div className="driver-grid">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton" style={{ height: 240, borderRadius: 'var(--r-card)' }} />)}
        </div>
      ) : drivers.length === 0 ? (
        <div className="empty-state neu-card no-hover">
          <Users size={48} color="var(--text-muted)" />
          <p>No drivers match your filters</p>
        </div>
      ) : (
        <div className="driver-grid">
          {drivers.map(d => (
            <DriverCard key={d.id} d={d}
              onView={() => navigate(`/drivers/${d.id}`)}
              onEdit={() => setModal({ open: true, driver: d })} />
          ))}
        </div>
      )}

      {modal.open && <DriverFormModal driver={modal.driver} onClose={() => setModal({ open: false })} />}
    </div>
  );
}
