import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Truck, Plus, Filter, Search, Edit2, Eye, MoreHorizontal, X } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import './VehicleListPage.css';

type VehicleStatus = 'AVAILABLE' | 'ON_TRIP' | 'IN_SHOP' | 'RETIRED';

interface Vehicle {
  id: string; registrationNumber: string; make: string; model: string; year: number;
  type: string; fuelType: string; maxLoadCapacity: number; currentOdometer: number;
  acquisitionCost: number; status: VehicleStatus; healthScore: number;
  insuranceExpiry?: string; registrationExpiry?: string;
}

const STATUS_CONFIG: Record<VehicleStatus, { label: string; css: string }> = {
  AVAILABLE: { label: 'Available', css: 'available' },
  ON_TRIP:   { label: 'On Trip',   css: 'on-trip' },
  IN_SHOP:   { label: 'In Shop',   css: 'in-shop' },
  RETIRED:   { label: 'Retired',   css: 'retired' },
};

const TYPE_ICONS: Record<string, string> = { Truck: '🚛', Bus: '🚌', Van: '🚐', Car: '🚗' };

function HealthBar({ score }: { score: number }) {
  const color = score >= 80 ? 'var(--accent-success)' : score >= 60 ? 'var(--accent-warning)' : 'var(--accent-danger)';
  return (
    <div className="health-bar-wrap">
      <div className="progress-track thin">
        <div className="progress-fill" style={{ width: `${score}%`, background: color }} />
      </div>
      <span className="health-val text-mono" style={{ color }}>{score}</span>
    </div>
  );
}

function VehicleCard({ v, onView, onEdit }: { v: Vehicle; onView: () => void; onEdit: () => void }) {
  const cfg = STATUS_CONFIG[v.status];
  return (
    <article className="vehicle-card neu-card no-hover slide-up">
      <div className="vc-screw vc-screw-tl" /><div className="vc-screw vc-screw-tr" />
      <div className="vc-header">
        <span className={`badge ${cfg.css}`}>{cfg.label}</span>
        <span className="vc-type-icon" title={v.type}>{TYPE_ICONS[v.type] ?? '🚗'}</span>
      </div>
      <div className="vc-reg text-mono">{v.registrationNumber}</div>
      <div className="vc-model">{v.make} {v.model}</div>
      <div className="vc-meta">
        <span className="vc-meta-item">{v.year}</span>
        <span className="vc-meta-sep">·</span>
        <span className="vc-meta-item">{v.fuelType}</span>
        <span className="vc-meta-sep">·</span>
        <span className="vc-meta-item">{v.maxLoadCapacity}T</span>
      </div>
      <HealthBar score={v.healthScore} />
      <div className="vc-odometer text-mono">{v.currentOdometer.toLocaleString()} km</div>
      <div className="vc-actions">
        <button className="btn btn-ghost btn-pill sm" onClick={onView}><Eye size={13} /> View</button>
        <button className="btn-round" onClick={onEdit} aria-label="Edit vehicle"><Edit2 size={14} /></button>
      </div>
    </article>
  );
}

/* ── Vehicle Form Modal ── */
function VehicleFormModal({ vehicle, onClose }: { vehicle?: Vehicle; onClose: () => void }) {
  const qc = useQueryClient();
  const isEdit = !!vehicle;
  const [form, setForm] = useState({
    registrationNumber: vehicle?.registrationNumber ?? '',
    make: vehicle?.make ?? '', model: vehicle?.model ?? '',
    year: vehicle?.year ?? new Date().getFullYear(),
    type: vehicle?.type ?? 'Truck', fuelType: vehicle?.fuelType ?? 'DIESEL',
    maxLoadCapacity: vehicle?.maxLoadCapacity ?? 10,
    currentOdometer: vehicle?.currentOdometer ?? 0,
    acquisitionCost: vehicle?.acquisitionCost ?? 0,
    status: vehicle?.status ?? 'AVAILABLE',
  });
  const [error, setError] = useState('');

  const mutation = useMutation({
    mutationFn: async (data: typeof form) => {
      if (isEdit) return api.patch(`/vehicles/${vehicle!.id}`, data);
      return api.post('/vehicles', data);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['vehicles'] }); onClose(); },
    onError: (e: any) => setError(e?.response?.data?.message ?? 'Save failed'),
  });

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel slide-up" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{isEdit ? 'Edit Vehicle' : 'Add Vehicle'}</h2>
          <button className="btn-round" onClick={onClose}><X size={16} /></button>
        </div>
        <form className="modal-form" onSubmit={e => { e.preventDefault(); mutation.mutate(form); }}>
          {error && <div className="form-error" style={{ padding: '10px', background: 'hsl(4,70%,95%)', borderRadius: 8 }}>{error}</div>}
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Registration No.</label>
              <input className="input-field" value={form.registrationNumber} onChange={set('registrationNumber')} required placeholder="GJ-01-AB-1234" />
            </div>
            <div className="form-group">
              <label className="form-label">Type</label>
              <select className="input-field" value={form.type} onChange={set('type')}>
                {['Truck','Bus','Van','Car'].map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Make</label>
              <input className="input-field" value={form.make} onChange={set('make')} required placeholder="Tata" />
            </div>
            <div className="form-group">
              <label className="form-label">Model</label>
              <input className="input-field" value={form.model} onChange={set('model')} required placeholder="Ace" />
            </div>
            <div className="form-group">
              <label className="form-label">Year</label>
              <input className="input-field" type="number" value={form.year} onChange={set('year')} required min={2000} max={2030} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Fuel Type</label>
              <select className="input-field" value={form.fuelType} onChange={set('fuelType')}>
                {['DIESEL','PETROL','CNG','ELECTRIC'].map(f => <option key={f}>{f}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Max Load (T)</label>
              <input className="input-field" type="number" value={form.maxLoadCapacity} onChange={set('maxLoadCapacity')} required min={0} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Odometer (km)</label>
              <input className="input-field" type="number" value={form.currentOdometer} onChange={set('currentOdometer')} min={0} />
            </div>
            <div className="form-group">
              <label className="form-label">Acquisition Cost (₹)</label>
              <input className="input-field" type="number" value={form.acquisitionCost} onChange={set('acquisitionCost')} min={0} />
            </div>
          </div>
          {isEdit && (
            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="input-field" value={form.status} onChange={set('status')}>
                {Object.keys(STATUS_CONFIG).map(s => <option key={s} value={s}>{STATUS_CONFIG[s as VehicleStatus].label}</option>)}
              </select>
            </div>
          )}
          <div className="modal-footer">
            <button type="button" className="btn btn-ghost btn-pill" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-pill" disabled={mutation.isPending}>
              {mutation.isPending ? 'Saving...' : isEdit ? 'Save Changes' : 'Add Vehicle'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── Main Page ── */
export default function VehicleListPage() {
  const navigate = useNavigate();
  const [filterStatus, setFilterStatus] = useState<VehicleStatus | 'ALL'>('ALL');
  const [filterType, setFilterType] = useState('ALL');
  const [search, setSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [modal, setModal] = useState<{ open: boolean; vehicle?: Vehicle }>({ open: false });

  const { data, isLoading } = useQuery<{ data: Vehicle[]; total: number }>({
    queryKey: ['vehicles'],
    queryFn: async () => { const { data } = await api.get('/vehicles?limit=100'); return data; },
  });

  const vehicles = (data?.data ?? []).filter(v => {
    if (filterStatus !== 'ALL' && v.status !== filterStatus) return false;
    if (filterType !== 'ALL' && v.type !== filterType) return false;
    if (search && !`${v.registrationNumber} ${v.make} ${v.model}`.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="vl-page page-enter">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="text-h1">Fleet Registry</h1>
          <p className="text-secondary" style={{ fontSize: 'var(--text-sm)', marginTop: 4 }}>
            {data?.total ?? '--'} vehicles total
          </p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--sp-2)' }}>
          <button className="btn btn-ghost btn-pill sm" onClick={() => setShowFilters(f => !f)}>
            <Filter size={14} /> Filters
          </button>
          <button className="btn btn-pill" onClick={() => setModal({ open: true })}>
            <Plus size={14} /> Add Vehicle
          </button>
        </div>
      </div>

      {/* Filter bar */}
      {showFilters && (
        <div className="filter-bar neu-well">
          <div className="filter-search">
            <Search size={16} className="filter-search-icon" />
            <input className="filter-input" placeholder="Search registration, make, model..."
              value={search} onChange={e => setSearch(e.target.value)} />
            {search && <button className="btn-round" style={{ width: 24, height: 24 }} onClick={() => setSearch('')}><X size={12} /></button>}
          </div>
          <div className="filter-pills">
            {(['ALL', 'AVAILABLE', 'ON_TRIP', 'IN_SHOP', 'RETIRED'] as const).map(s => (
              <button key={s} className={`btn btn-pill sm ${filterStatus === s ? '' : 'btn-ghost'}`}
                onClick={() => setFilterStatus(s)}>
                {s === 'ALL' ? 'All' : STATUS_CONFIG[s].label}
              </button>
            ))}
          </div>
          <div className="filter-pills">
            {['ALL', 'Truck', 'Bus', 'Van', 'Car'].map(t => (
              <button key={t} className={`btn btn-pill sm ${filterType === t ? '' : 'btn-ghost'}`}
                onClick={() => setFilterType(t)}>{t}</button>
            ))}
          </div>
        </div>
      )}

      {/* Status summary chips */}
      <div className="vl-status-chips">
        {Object.entries(STATUS_CONFIG).map(([k, v]) => {
          const count = data?.data.filter(x => x.status === k).length ?? 0;
          return (
            <div key={k} className={`status-chip badge ${v.css}`} onClick={() => setFilterStatus(k as VehicleStatus)}>
              {v.label}: <strong>{count}</strong>
            </div>
          );
        })}
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="vehicle-grid">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton" style={{ height: 220, borderRadius: 'var(--r-card)' }} />)}
        </div>
      ) : vehicles.length === 0 ? (
        <div className="empty-state neu-card no-hover">
          <Truck size={48} color="var(--text-muted)" />
          <p>No vehicles match your filters</p>
        </div>
      ) : (
        <div className="vehicle-grid">
          {vehicles.map(v => (
            <VehicleCard key={v.id} v={v}
              onView={() => navigate(`/vehicles/${v.id}`)}
              onEdit={() => setModal({ open: true, vehicle: v })} />
          ))}
        </div>
      )}

      {modal.open && <VehicleFormModal vehicle={modal.vehicle} onClose={() => setModal({ open: false })} />}
    </div>
  );
}
