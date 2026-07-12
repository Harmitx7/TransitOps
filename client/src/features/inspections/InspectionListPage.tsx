import { useState } from 'react';
import { Plus, CheckCircle2, XCircle, Clock, ClipboardList } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '../../lib/api';
import { useNavigate } from 'react-router-dom';
import './InspectionListPage.css';

type IStatus = 'PENDING' | 'PASSED' | 'FAILED';

interface Inspection {
  id: string; vehicleId: string; inspectorName: string; status: IStatus;
  passedItems: number; totalItems: number; createdAt: string;
  vehicle?: { registrationNumber: string };
}

const STATUS_CFG: Record<IStatus, { icon: React.ElementType; css: string; color: string }> = {
  PENDING: { icon: Clock,         css: 'scheduled', color: 'var(--accent-warning)' },
  PASSED:  { icon: CheckCircle2,  css: 'available', color: 'var(--accent-success)' },
  FAILED:  { icon: XCircle,       css: 'cancelled', color: 'var(--accent-danger)' },
};

// Checklist items per the spec
const CHECKLIST_ITEMS = [
  'Engine Oil Level', 'Brake System', 'Tire Condition (all wheels)',
  'Headlights & Taillights', 'Turn Signals', 'Windshield & Wipers',
  'Horn', 'Mirrors', 'Seatbelts', 'Fire Extinguisher',
  'First Aid Kit', 'Reflective Triangles', 'Fluid Leaks', 'Body Damage',
];

export default function InspectionListPage() {
  const navigate = useNavigate();
  const [filterStatus, setFilterStatus] = useState<IStatus | 'ALL'>('ALL');

  const { data, isLoading } = useQuery<{ data: Inspection[]; total: number }>({
    queryKey: ['inspections'],
    queryFn: async () => {
      try { const { data } = await api.get('/inspections?limit=100'); return data; }
      catch { return { data: [], total: 0 }; }
    },
  });

  const records = (data?.data ?? []).filter(r => filterStatus === 'ALL' || r.status === filterStatus);
  const counts: Record<string, number> = {
    PENDING: data?.data.filter(i => i.status === 'PENDING').length ?? 0,
    PASSED:  data?.data.filter(i => i.status === 'PASSED').length ?? 0,
    FAILED:  data?.data.filter(i => i.status === 'FAILED').length ?? 0,
  };

  return (
    <div className="insp-page page-enter">
      <div className="page-header">
        <div>
          <h1 className="text-h1"><ClipboardList size={24} className="text-accent" /> VEHICLE INSPECTIONS</h1>
          <p className="text-secondary">{data?.total ?? 0} total inspections</p>
        </div>
        <button className="btn btn-pill" onClick={() => navigate('/inspections/new')}><Plus size={14}/> NEW INSPECTION</button>
      </div>

      {/* Status chips */}
      <div className="vl-status-chips">
        {(['PENDING','PASSED','FAILED'] as IStatus[]).map(s => {
          const c = STATUS_CFG[s]; const Icon = c.icon;
          return (
            <div key={s} className={`status-chip badge ${c.css}`} onClick={() => setFilterStatus(s)}>
              <Icon size={11}/> {s}: <strong>{counts[s]}</strong>
            </div>
          );
        })}
      </div>

      {/* Filter pills */}
      <div style={{ display: 'flex', gap: 'var(--sp-2)', flexWrap: 'wrap' }}>
        {(['ALL','PENDING','PASSED','FAILED'] as const).map(s => (
          <button key={s} className={`btn btn-pill sm ${filterStatus === s ? '' : 'btn-ghost'}`}
            onClick={() => setFilterStatus(s)}>{s === 'ALL' ? 'All' : s}</button>
        ))}
      </div>

      {isLoading ? (
        <div className="insp-grid">
          {Array.from({length:4}).map((_,i) => <div key={i} className="skeleton" style={{ height: 180, borderRadius: 'var(--r-card)' }}/>)}
        </div>
      ) : records.length === 0 ? (
        <div className="empty-state neu-card no-hover">
          <ClipboardList size={48} color="var(--text-muted)"/>
          <p>No inspections found</p>
          <button className="btn btn-pill sm" onClick={() => navigate('/inspections/new')}><Plus size={13}/> Start Inspection</button>
        </div>
      ) : (
        <div className="insp-grid">
          {records.map(insp => {
            const cfg = STATUS_CFG[insp.status]; const Icon = cfg.icon;
            const pct = insp.totalItems > 0 ? Math.round((insp.passedItems / insp.totalItems) * 100) : 0;
            return (
              <div key={insp.id} className="insp-card neu-card" onClick={() => navigate(`/inspections/${insp.id}`)}>
                <div className="insp-top">
                  <div className="insp-reg text-mono">{insp.vehicle?.registrationNumber ?? insp.vehicleId}</div>
                  <Icon size={24} color={cfg.color}/>
                </div>
                <div className="insp-inspector">{insp.inspectorName}</div>
                <div className="insp-date">{new Date(insp.createdAt).toLocaleDateString()}</div>
                <div className={`insp-status-badge badge ${cfg.css}`}><Icon size={11}/> {insp.status}</div>
                <div className="insp-progress-row">
                  <span>{insp.passedItems}/{insp.totalItems} items passed</span>
                  <span className="text-mono" style={{ color: cfg.color }}>{pct}%</span>
                </div>
                <div className="progress-track"><div className="progress-fill" style={{ width: `${pct}%`, background: cfg.color }}/></div>
                <button className="btn btn-ghost btn-pill sm" style={{ marginTop: 4, alignSelf: 'flex-start' }}>View Details</button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
