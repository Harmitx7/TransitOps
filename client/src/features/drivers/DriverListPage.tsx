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
      <svg viewBox="0 0 54 54" style={{ transform: 'rotate(-90deg)', width: '100%', height: '100%', filter: `drop-shadow(0 0 2px ${color})` }} aria-hidden="true">
        <circle cx={27} cy={27} r={r} fill="none" stroke="var(--bg-sunken)" strokeWidth={6} />
        <circle cx={27} cy={27} r={r} fill="none" stroke={color} strokeWidth={6}
          strokeDasharray={`${dash} ${circ - dash}`} strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 1s cubic-bezier(0.34,1.56,0.64,1)' }} />
      </svg>
      <span className="safety-val text-mono" style={{ color }}>{score}</span>
    </div>
  );
}

// High-quality avatars selected from randomuser.me that look like Indian/South-Asian men
const INDIAN_AVATAR_IDS = [3, 8, 11, 18, 22, 27, 33, 38, 41, 43, 46, 51, 55, 59, 61, 66, 71, 75, 83, 86, 90, 93, 96];

function DriverAvatar({ driver }: { driver: Driver }) {
  const score = driver.safetyScore;
  const ringColor = score >= 80 ? 'var(--accent-success)' : score >= 60 ? 'var(--accent-warning)' : 'var(--accent-danger)';
  
  // Consistent pseudo-random hash based on name
  const hash = (driver.firstName.charCodeAt(0) + (driver.lastName.charCodeAt(0) || 0)) || 0;
  const avatarId = INDIAN_AVATAR_IDS[hash % INDIAN_AVATAR_IDS.length];
  
  return (
    <div className="driver-avatar" style={{ border: `2px solid ${ringColor}`, padding: '2px', background: 'var(--bg-sunken)' }}>
      <img 
        src={`https://randomuser.me/api/portraits/men/${avatarId}.jpg`} 
        alt={`${driver.firstName} ${driver.lastName}`} 
      />
    </div>
  );
}

function DriverCard({ d, onView, onEdit }: { d: Driver; onView: () => void; onEdit: () => void }) {
  const cfg = STATUS_CONFIG[d.status];
  return (
    <article className="driver-card slide-up">
      <div className="id-lanyard-hole"></div>
      <div className="id-header">
        <div className="id-brand">TransitOps</div>
        <div className="id-type">CREW ID</div>
      </div>
      <div className="id-body">
        <div className="id-photo-section">
          <DriverAvatar driver={d} />
          <div className="id-safety">
            <SafetyGauge score={d.safetyScore} />
          </div>
        </div>
        <div className="id-details">
          <div className="id-name">{d.firstName} {d.lastName}</div>
          <div className="id-field">
            <span className="id-label">LICENSE NO.</span>
            <span className="id-value text-mono">{d.licenseNumber}</span>
          </div>
          <div className="id-field-group">
            <div className="id-field">
              <span className="id-label">CAT</span>
              <span className="id-value">{d.licenseCategory}</span>
            </div>
            <div className="id-field">
              <span className="id-label">EXPIRY</span>
              <LicenseExpiryBadge expiry={d.licenseExpiry} />
            </div>
            <div className="id-field">
              <span className="id-label">STATUS</span>
              <span className={`badge ${cfg.css}`}>{cfg.label}</span>
            </div>
          </div>
          <div className="id-field">
            <span className="id-label">PHONE</span>
            <span className="id-value">{d.phone}</span>
          </div>
        </div>
      </div>
      <div className="id-footer">
        <div className="id-barcode-wrap">
          <div className="id-barcode"></div>
        </div>
        <div className="dc-actions">
          <button className="btn btn-ghost btn-pill sm" onClick={onView}><Eye size={13} /> View</button>
          <button className="btn-round" onClick={onEdit} aria-label="Edit driver"><Edit2 size={14} /></button>
        </div>
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
          <h1 className="text-h1"><Users size={24} className="text-accent" /> Driver Registry</h1>
          <p className="text-secondary">
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
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="panel-plate" style={{ height: 260, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', gap: 16 }}>
                <div className="skeleton" style={{ width: 48, height: 48, borderRadius: 8 }} />
                <div className="skeleton" style={{ width: 48, height: 48, borderRadius: '50%' }} />
              </div>
              <div className="skeleton" style={{ height: 24, width: '60%' }} />
              <div className="skeleton" style={{ height: 16, width: '80%' }} />
              <div className="skeleton" style={{ flex: 1, width: '100%' }} />
              <div className="skeleton" style={{ height: 32, width: '100%' }} />
            </div>
          ))}
        </div>
      ) : drivers.length === 0 ? (
        <div className="empty-state panel-plate">
          <Users size={48} color="var(--text-muted)" />
          <p className="mech-label mt-2">NO DRIVERS MATCH YOUR FILTERS</p>
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
