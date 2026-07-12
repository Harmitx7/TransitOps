import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit2, Truck, Wrench, Fuel, Route, Calendar, TrendingUp, TrendingDown, X, AlertTriangle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '../../lib/api';
import './VehicleDetailPage.css';

interface Vehicle {
  id: string; registrationNumber: string; make: string; model: string; year: number;
  type: string; fuelType: string; maxLoadCapacity: number; currentOdometer: number;
  acquisitionCost: number; status: string; healthScore: number;
  insuranceExpiry?: string; registrationExpiry?: string; fitnessExpiry?: string;
  trips?: Array<{ id: string; tripNumber: string; source: string; destination: string; status: string; createdAt: string }>;
  maintenance?: Array<{ id: string; type: string; description: string; status: string; cost?: number; scheduledDate?: string }>;
  fuelLogs?: Array<{ id: string; quantity: number; totalCost: number; createdAt: string }>;
  timeline?: Array<{ id: string; eventType: string; title: string; description?: string; createdAt: string }>;
}

const STATUS_CSS: Record<string, string> = {
  AVAILABLE: 'available', ON_TRIP: 'on-trip', IN_SHOP: 'in-shop', RETIRED: 'retired',
};

function InfoCard({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div className="vd-info-card neu-card no-hover">
      <div className="vd-info-label">{label}</div>
      <div className="vd-info-val" style={{ color: color ?? 'var(--text-primary)' }}>{value}</div>
      {sub && <div className="vd-info-sub">{sub}</div>}
    </div>
  );
}

function ExpiryWarning({ label, date }: { label: string; date?: string }) {
  if (!date) return null;
  const days = Math.floor((new Date(date).getTime() - Date.now()) / 86400000);
  if (days > 30) return null;
  return (
    <div className={`vd-expiry-warn ${days < 0 ? 'expired' : days < 7 ? 'critical' : 'warning'}`}>
      <AlertTriangle size={14} />
      <span>{label}: {days < 0 ? 'Expired' : `${days} days left`} ({new Date(date).toLocaleDateString()})</span>
    </div>
  );
}

export default function VehicleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: vehicle, isLoading, error } = useQuery<Vehicle>({
    queryKey: ['vehicle', id],
    queryFn: async () => { const { data } = await api.get(`/vehicles/${id}`); return data; },
    enabled: !!id,
  });

  if (isLoading) return (
    <div className="vd-page page-enter">
      <div className="skeleton" style={{ height: 180, borderRadius: 'var(--r-card)', margin: 'var(--sp-5)' }} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 'var(--sp-3)', margin: '0 var(--sp-5)' }}>
        {Array.from({length:4}).map((_,i)=><div key={i} className="skeleton" style={{height:100,borderRadius:'var(--r-card)'}}/>)}
      </div>
    </div>
  );

  if (error || !vehicle) return (
    <div className="vd-page page-enter" style={{ padding: 'var(--sp-5)' }}>
      <div className="empty-state neu-card no-hover"><Truck size={40} color="var(--text-muted)" /><p>Vehicle not found</p></div>
    </div>
  );

  const healthColor = vehicle.healthScore >= 80 ? 'var(--accent-success)' : vehicle.healthScore >= 60 ? 'var(--accent-warning)' : 'var(--accent-danger)';
  const totalFuelCost = vehicle.fuelLogs?.reduce((s, f) => s + f.totalCost, 0) ?? 0;

  return (
    <div className="vd-page page-enter">
      {/* Hero */}
      <div className="vd-hero">
        <div className="vd-hero-screw vd-hs-tl"/><div className="vd-hero-screw vd-hs-tr"/>
        <div className="vd-hero-left">
          <button className="btn btn-ghost btn-pill sm" onClick={() => navigate('/vehicles')}>
            <ArrowLeft size={14} /> Back
          </button>
          <div className="vd-reg text-mono">{vehicle.registrationNumber}</div>
          <div className="vd-make-model">{vehicle.make} {vehicle.model} · {vehicle.year}</div>
          <div className="vd-meta-row">
            <span className={`badge ${STATUS_CSS[vehicle.status] ?? ''}`}>{vehicle.status}</span>
            <span className="badge">{vehicle.type}</span>
            <span className="badge">{vehicle.fuelType}</span>
          </div>
        </div>
        <div className="vd-hero-right">
          {/* Health Ring */}
          <div className="vd-health-ring">
            <svg width={100} height={100} style={{ transform: 'rotate(-90deg)' }}>
              <circle cx={50} cy={50} r={40} fill="none" stroke="var(--bg-sunken)" strokeWidth={10}/>
              <circle cx={50} cy={50} r={40} fill="none" stroke={healthColor} strokeWidth={10}
                strokeDasharray={`${(vehicle.healthScore/100)*251} 251`} strokeLinecap="round"
                style={{transition:'stroke-dasharray 1.2s cubic-bezier(0.34,1.56,0.64,1)'}}/>
            </svg>
            <div className="vd-health-center">
              <span className="vd-health-val text-mono" style={{color:healthColor}}>{vehicle.healthScore}</span>
              <span className="vd-health-label">Health</span>
            </div>
          </div>
          <button className="btn btn-pill" onClick={() => navigate('/vehicles')}>
            <Edit2 size={14}/> Edit
          </button>
        </div>
      </div>

      {/* Expiry warnings */}
      <div className="vd-warnings" style={{padding:'0 var(--sp-5)'}}>
        <ExpiryWarning label="Insurance" date={vehicle.insuranceExpiry}/>
        <ExpiryWarning label="Registration" date={vehicle.registrationExpiry}/>
        <ExpiryWarning label="Fitness" date={vehicle.fitnessExpiry}/>
      </div>

      {/* KPIs */}
      <div className="vd-kpis">
        <InfoCard label="Odometer" value={`${vehicle.currentOdometer.toLocaleString()} km`} />
        <InfoCard label="Max Load" value={`${vehicle.maxLoadCapacity} T`} />
        <InfoCard label="Acquisition" value={`₹${(vehicle.acquisitionCost/100000).toFixed(1)}L`} />
        <InfoCard label="Fuel Cost (Total)" value={`₹${(totalFuelCost/1000).toFixed(1)}K`} color="var(--accent-warning)"/>
        <InfoCard label="Insurance" value={vehicle.insuranceExpiry ? new Date(vehicle.insuranceExpiry).toLocaleDateString() : '—'} />
        <InfoCard label="Registration" value={vehicle.registrationExpiry ? new Date(vehicle.registrationExpiry).toLocaleDateString() : '—'} />
        <InfoCard label="Fitness" value={vehicle.fitnessExpiry ? new Date(vehicle.fitnessExpiry).toLocaleDateString() : '—'} />
        <InfoCard label="Trips" value={vehicle.trips?.length ?? 0} />
      </div>

      <div className="vd-grid">
        {/* Recent Trips */}
        <div className="vd-section neu-card no-hover">
          <div className="vd-section-title"><Route size={14}/> Recent Trips</div>
          {vehicle.trips?.length ? (
            <table className="vd-table">
              <thead><tr><th>Trip #</th><th>Route</th><th>Status</th><th>Date</th></tr></thead>
              <tbody>
                {vehicle.trips.slice(0,8).map(t=>(
                  <tr key={t.id}>
                    <td className="text-mono" style={{color:'var(--accent-primary)'}}>{t.tripNumber}</td>
                    <td style={{fontSize:'var(--text-xs)'}}>{t.source} → {t.destination}</td>
                    <td><span className={`badge ${t.status.toLowerCase().replace('_','-')}`}>{t.status}</span></td>
                    <td style={{fontSize:'var(--text-xs)',color:'var(--text-muted)'}}>{new Date(t.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : <div className="vd-empty">No trips recorded</div>}
        </div>

        {/* Maintenance */}
        <div className="vd-section neu-card no-hover">
          <div className="vd-section-title"><Wrench size={14}/> Maintenance History</div>
          {vehicle.maintenance?.length ? (
            <div className="vd-maint-list">
              {vehicle.maintenance.slice(0,6).map(m=>(
                <div key={m.id} className="vd-maint-item">
                  <div>
                    <div style={{fontSize:'var(--text-sm)',fontWeight:600}}>{m.type}</div>
                    <div style={{fontSize:'var(--text-xs)',color:'var(--text-secondary)'}}>{m.description}</div>
                  </div>
                  <div style={{textAlign:'right',flexShrink:0}}>
                    <span className={`badge ${m.status.toLowerCase().replace('_','-')}`}>{m.status}</span>
                    {m.cost && <div style={{fontSize:'var(--text-xs)',color:'var(--text-muted)',marginTop:3}}>₹{m.cost.toLocaleString()}</div>}
                  </div>
                </div>
              ))}
            </div>
          ) : <div className="vd-empty">No maintenance records</div>}
        </div>

        {/* Timeline */}
        <div className="vd-section neu-card no-hover vd-timeline-section">
          <div className="vd-section-title"><Calendar size={14}/> Activity Timeline</div>
          {vehicle.timeline?.length ? (
            <div className="vd-timeline">
              {vehicle.timeline.slice(0,10).map((e,i)=>(
                <div key={e.id} className="vd-timeline-item">
                  <div className="vd-tl-dot"/>
                  {i < (vehicle.timeline?.length ?? 0)-1 && <div className="vd-tl-line"/>}
                  <div className="vd-tl-content">
                    <div className="vd-tl-title">{e.title}</div>
                    {e.description && <div className="vd-tl-desc">{e.description}</div>}
                    <div className="vd-tl-time">{new Date(e.createdAt).toLocaleString()}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : <div className="vd-empty">No timeline events</div>}
        </div>
      </div>
    </div>
  );
}
