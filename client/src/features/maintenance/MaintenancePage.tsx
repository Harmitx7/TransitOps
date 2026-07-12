import { useState } from 'react';
import { Wrench, Plus, X, ChevronDown, ChevronUp, CheckCircle2, Clock, AlertTriangle, XCircle } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import './MaintenancePage.css';

type MStatus = 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
type MType   = 'PREVENTIVE' | 'CORRECTIVE' | 'EMERGENCY' | 'INSPECTION';

interface Maintenance {
  id: string; vehicleId: string; type: MType; description: string;
  status: MStatus; cost?: number; scheduledDate?: string;
  startedAt?: string; completedAt?: string; notes?: string;
  vehicle?: { registrationNumber: string; make: string; model: string };
}

const STATUS_CFG: Record<MStatus, { label: string; css: string; icon: React.ElementType }> = {
  SCHEDULED:   { label: 'Scheduled',   css: 'scheduled',   icon: Clock },
  IN_PROGRESS: { label: 'In Progress', css: 'in-shop',     icon: Wrench },
  COMPLETED:   { label: 'Completed',   css: 'completed',   icon: CheckCircle2 },
  CANCELLED:   { label: 'Cancelled',   css: 'cancelled',   icon: XCircle },
};

const TYPE_CFG: Record<MType, { label: string; color: string }> = {
  PREVENTIVE:  { label: 'Preventive',  color: 'var(--accent-info)' },
  CORRECTIVE:  { label: 'Corrective',  color: 'var(--accent-warning)' },
  EMERGENCY:   { label: 'Emergency',   color: 'var(--accent-danger)' },
  INSPECTION:  { label: 'Inspection',  color: 'var(--accent-success)' },
};

function MaintenanceCard({ m, onAction }: { m: Maintenance; onAction: (id: string, action: string) => void }) {
  const [expanded, setExpanded] = useState(false);
  const scfg = STATUS_CFG[m.status];
  const tcfg = TYPE_CFG[m.type];
  const Icon = scfg.icon;

  return (
    <div className="maint-card neu-card no-hover slide-up">
      <div className="mc-screw mc-screw-tl" /><div className="mc-screw mc-screw-tr" />
      <div className="mc-header">
        <div className="mc-vehicle">
          <span className="mc-reg text-mono">{m.vehicle?.registrationNumber ?? m.vehicleId}</span>
          <span className="mc-model">{m.vehicle?.make} {m.vehicle?.model}</span>
        </div>
        <div className="mc-badges">
          <span className="mc-type-badge" style={{ background: `${tcfg.color}20`, color: tcfg.color }}>
            {tcfg.label}
          </span>
          <span className={`badge ${scfg.css}`}>
            <Icon size={11} /> {scfg.label}
          </span>
        </div>
      </div>

      <p className="mc-desc">{m.description}</p>

      <div className="mc-meta">
        {m.scheduledDate && <span>Scheduled: <strong>{new Date(m.scheduledDate).toLocaleDateString()}</strong></span>}
        {m.cost != null && <span>Cost: <strong className="text-mono">₹{m.cost.toLocaleString()}</strong></span>}
      </div>

      <div className="mc-actions-row">
        {m.status === 'SCHEDULED'   && <button className="btn btn-pill sm" onClick={() => onAction(m.id, 'start')}>Start</button>}
        {m.status === 'IN_PROGRESS' && <button className="btn btn-pill sm" style={{ background: 'linear-gradient(145deg,var(--accent-success),hsl(152,55%,32%))' }} onClick={() => onAction(m.id, 'complete')}>Complete</button>}
        {(m.status === 'SCHEDULED' || m.status === 'IN_PROGRESS') &&
          <button className="btn btn-ghost btn-pill sm" onClick={() => onAction(m.id, 'cancel')}>Cancel</button>}
        <button className="btn btn-ghost btn-pill sm" style={{ marginLeft: 'auto' }} onClick={() => setExpanded(e => !e)}>
          {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />} Details
        </button>
      </div>

      {expanded && m.notes && (
        <div className="mc-notes neu-well">
          <strong>Notes:</strong> {m.notes}
        </div>
      )}
    </div>
  );
}

function MaintenanceFormModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    vehicleId: '', type: 'PREVENTIVE' as MType,
    description: '', scheduledDate: '', cost: '', notes: '',
  });
  const [error, setError] = useState('');

  const { data: vData } = useQuery<{ data: Array<{ id: string; registrationNumber: string; make: string; model: string }> }>({
    queryKey: ['vehicles-short'],
    queryFn: async () => { const { data } = await api.get('/vehicles?limit=100'); return data; },
  });

  const mutation = useMutation({
    mutationFn: async () => api.post('/maintenance', {
      ...form,
      cost: form.cost ? Number(form.cost) : undefined,
      scheduledDate: form.scheduledDate || undefined,
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['maintenance'] }); onClose(); },
    onError: (e: any) => setError(e?.response?.data?.message ?? 'Save failed'),
  });

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel slide-up" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Schedule Maintenance</h2>
          <button className="btn-round" onClick={onClose}><X size={16} /></button>
        </div>
        <form className="modal-form" onSubmit={e => { e.preventDefault(); mutation.mutate(); }}>
          {error && <div className="form-error">{error}</div>}
          <div className="form-group">
            <label className="form-label">Vehicle</label>
            <select className="input-field" value={form.vehicleId} onChange={set('vehicleId')} required>
              <option value="">Select vehicle...</option>
              {vData?.data.map(v => <option key={v.id} value={v.id}>{v.registrationNumber} — {v.make} {v.model}</option>)}
            </select>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Type</label>
              <div className="type-radio-group">
                {(['PREVENTIVE','CORRECTIVE','EMERGENCY','INSPECTION'] as MType[]).map(t => (
                  <button key={t} type="button"
                    className={`type-radio-btn ${form.type === t ? 'active' : ''}`}
                    style={form.type === t ? { background: TYPE_CFG[t].color, color: '#fff' } : {}}
                    onClick={() => setForm(f => ({ ...f, type: t }))}>
                    {TYPE_CFG[t].label}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="input-field" style={{ height: 80, resize: 'vertical' }}
              value={form.description} onChange={set('description')} required placeholder="Describe the maintenance work..." />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Scheduled Date</label>
              <input className="input-field" type="date" value={form.scheduledDate} onChange={set('scheduledDate')} />
            </div>
            <div className="form-group">
              <label className="form-label">Estimated Cost (₹)</label>
              <input className="input-field" type="number" value={form.cost} onChange={set('cost')} min={0} placeholder="5000" />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Notes</label>
            <textarea className="input-field" style={{ height: 60, resize: 'vertical' }}
              value={form.notes} onChange={set('notes')} placeholder="Optional notes..." />
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-ghost btn-pill" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-pill" disabled={mutation.isPending}>
              {mutation.isPending ? 'Scheduling...' : 'Schedule Maintenance'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function MaintenancePage() {
  const qc = useQueryClient();
  const [filterStatus, setFilterStatus] = useState<MStatus | 'ALL'>('ALL');
  const [filterType, setFilterType] = useState<MType | 'ALL'>('ALL');
  const [showModal, setShowModal] = useState(false);

  const { data, isLoading } = useQuery<{ data: Maintenance[]; total: number }>({
    queryKey: ['maintenance'],
    queryFn: async () => { const { data } = await api.get('/maintenance?limit=100'); return data; },
  });

  const actionMutation = useMutation({
    mutationFn: async ({ id, action }: { id: string; action: string }) => {
      const statusMap: Record<string, string> = { start: 'IN_PROGRESS', complete: 'COMPLETED', cancel: 'CANCELLED' };
      return api.patch(`/maintenance/${id}`, {
        status: statusMap[action],
        ...(action === 'start' ? { startedAt: new Date().toISOString() } : {}),
        ...(action === 'complete' ? { completedAt: new Date().toISOString() } : {}),
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['maintenance'] }),
  });

  const records = (data?.data ?? []).filter(m => {
    if (filterStatus !== 'ALL' && m.status !== filterStatus) return false;
    if (filterType !== 'ALL' && m.type !== filterType) return false;
    return true;
  });

  const counts = (['SCHEDULED','IN_PROGRESS','COMPLETED','CANCELLED'] as MStatus[]).reduce((acc, s) => {
    acc[s] = data?.data.filter(m => m.status === s).length ?? 0;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="maint-page page-enter">
      <div className="page-header">
        <div>
          <h1 className="text-h1">Maintenance Center</h1>
          <p className="text-secondary" style={{ fontSize: 'var(--text-sm)', marginTop: 4 }}>
            {data?.total ?? '--'} total records
          </p>
        </div>
        <button className="btn btn-pill" onClick={() => setShowModal(true)}>
          <Plus size={14} /> Schedule Maintenance
        </button>
      </div>

      {/* Summary chips */}
      <div className="vl-status-chips">
        {Object.entries(STATUS_CFG).map(([k, v]) => (
          <div key={k} className={`status-chip badge ${v.css}`} onClick={() => setFilterStatus(k as MStatus)}>
            {v.label}: <strong>{counts[k] ?? 0}</strong>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="maint-filters">
        <div className="filter-pills">
          {(['ALL','SCHEDULED','IN_PROGRESS','COMPLETED','CANCELLED'] as const).map(s => (
            <button key={s} className={`btn btn-pill sm ${filterStatus === s ? '' : 'btn-ghost'}`}
              onClick={() => setFilterStatus(s)}>{s === 'ALL' ? 'All Status' : STATUS_CFG[s].label}</button>
          ))}
        </div>
        <div className="filter-pills">
          {(['ALL','PREVENTIVE','CORRECTIVE','EMERGENCY','INSPECTION'] as const).map(t => (
            <button key={t} className={`btn btn-pill sm ${filterType === t ? '' : 'btn-ghost'}`}
              style={filterType === t && t !== 'ALL' ? { background: TYPE_CFG[t].color } : {}}
              onClick={() => setFilterType(t)}>{t === 'ALL' ? 'All Types' : TYPE_CFG[t].label}</button>
          ))}
        </div>
      </div>

      {/* Cards */}
      {isLoading ? (
        <div className="maint-grid">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton" style={{ height: 180, borderRadius: 'var(--r-card)' }} />)}
        </div>
      ) : records.length === 0 ? (
        <div className="empty-state neu-card no-hover">
          <Wrench size={48} color="var(--text-muted)" />
          <p>No maintenance records match your filters</p>
          <button className="btn btn-pill sm" onClick={() => setShowModal(true)}><Plus size={14} /> Schedule One</button>
        </div>
      ) : (
        <div className="maint-grid">
          {records.map(m => (
            <MaintenanceCard key={m.id} m={m}
              onAction={(id, action) => actionMutation.mutate({ id, action })} />
          ))}
        </div>
      )}

      {showModal && <MaintenanceFormModal onClose={() => setShowModal(false)} />}
    </div>
  );
}
