import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Route, AlertTriangle, Shield, Calendar, Phone, Mail } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '../../lib/api';
import './DriverDetailPage.css';

interface Driver {
  id: string; firstName: string; lastName: string; phone: string; email?: string;
  licenseNumber: string; licenseCategory: string; licenseExpiry: string;
  status: string; safetyScore: number;
  trips?: Array<{ id: string; tripNumber: string; source: string; destination: string; status: string; createdAt: string; vehicle?: { registrationNumber: string } }>;
}

const STATUS_CSS: Record<string, string> = { AVAILABLE: 'available', ON_TRIP: 'on-trip', ON_LEAVE: 'in-shop', SUSPENDED: 'cancelled' };

export default function DriverDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: driver, isLoading } = useQuery<Driver>({
    queryKey: ['driver', id],
    queryFn: async () => { const { data } = await api.get(`/drivers/${id}`); return data; },
    enabled: !!id,
  });

  if (isLoading) return (
    <div className="dd-page page-enter" style={{ padding: 'var(--sp-5)' }}>
      <div className="skeleton" style={{ height: 200, borderRadius: 'var(--r-card)' }} />
    </div>
  );

  if (!driver) return (
    <div className="dd-page page-enter" style={{ padding: 'var(--sp-5)' }}>
      <div className="empty-state neu-card no-hover"><Shield size={40} color="var(--text-muted)"/><p>Driver not found</p></div>
    </div>
  );

  const daysToExpiry = Math.floor((new Date(driver.licenseExpiry).getTime() - Date.now()) / 86400000);
  const safetyColor = driver.safetyScore >= 80 ? 'var(--accent-success)' : driver.safetyScore >= 60 ? 'var(--accent-warning)' : 'var(--accent-danger)';
  const r = 40; const circ = 2 * Math.PI * r;
  const totalTrips = driver.trips?.length ?? 0;
  const completedTrips = driver.trips?.filter(t => t.status === 'COMPLETED').length ?? 0;

  return (
    <div className="dd-page page-enter">
      {/* Hero */}
      <div className="dd-hero neu-card no-hover" style={{ margin: 'var(--sp-5) var(--sp-5) 0', borderRadius: 'var(--r-card)' }}>
        <div className="dd-hero-left">
          <button className="btn btn-ghost btn-pill sm" onClick={() => navigate('/drivers')}><ArrowLeft size={14}/> Back</button>
          <div className="dd-avatar" style={{ background: safetyColor }}>
            {driver.firstName[0]}{driver.lastName[0]}
          </div>
          <div className="dd-name">{driver.firstName} {driver.lastName}</div>
          <div className="dd-meta-row">
            <span className={`badge ${STATUS_CSS[driver.status] ?? ''}`}>{driver.status.replace(/_/g,' ')}</span>
            <span className="badge">{driver.licenseCategory}</span>
          </div>
          <div className="dd-contact">
            <span><Phone size={13}/> {driver.phone}</span>
            {driver.email && <span><Mail size={13}/> {driver.email}</span>}
          </div>
        </div>

        <div className="dd-hero-right">
          {/* Safety Ring */}
          <div className="dd-ring-wrap">
            <svg width={100} height={100} style={{ transform: 'rotate(-90deg)' }}>
              <circle cx={50} cy={50} r={r} fill="none" stroke="var(--bg-sunken)" strokeWidth={10}/>
              <circle cx={50} cy={50} r={r} fill="none" stroke={safetyColor} strokeWidth={10}
                strokeDasharray={`${(driver.safetyScore/100)*circ} ${circ}`} strokeLinecap="round"
                style={{ transition: 'stroke-dasharray 1.2s cubic-bezier(0.34,1.56,0.64,1)' }}/>
            </svg>
            <div className="dd-ring-center">
              <span className="dd-ring-val text-mono" style={{ color: safetyColor }}>{driver.safetyScore}</span>
              <span className="dd-ring-label">Safety</span>
            </div>
          </div>

          {/* Stats */}
          <div className="dd-stat-col">
            <div className="dd-stat">
              <div className="dd-stat-val text-mono">{totalTrips}</div>
              <div className="dd-stat-label">Total Trips</div>
            </div>
            <div className="dd-stat">
              <div className="dd-stat-val text-mono">{completedTrips}</div>
              <div className="dd-stat-label">Completed</div>
            </div>
            <div className="dd-stat">
              <div className="dd-stat-val text-mono" style={{ color: daysToExpiry < 30 ? 'var(--accent-danger)' : 'var(--accent-success)' }}>
                {daysToExpiry < 0 ? 'Expired' : `${daysToExpiry}d`}
              </div>
              <div className="dd-stat-label">License</div>
            </div>
          </div>
        </div>
      </div>

      {/* License info */}
      {daysToExpiry < 30 && (
        <div style={{ padding: '0 var(--sp-5)' }}>
          <div className={`dd-license-warn ${daysToExpiry < 0 ? 'expired' : daysToExpiry < 7 ? 'critical' : 'warning'}`}>
            <AlertTriangle size={14}/> License {daysToExpiry < 0 ? 'EXPIRED' : `expires in ${daysToExpiry} days`} — {new Date(driver.licenseExpiry).toLocaleDateString()}
          </div>
        </div>
      )}

      {/* Info cards */}
      <div className="dd-kpis">
        <div className="dd-info-card neu-card no-hover"><div className="dd-ik-label">License No.</div><div className="dd-ik-val text-mono">{driver.licenseNumber}</div></div>
        <div className="dd-info-card neu-card no-hover"><div className="dd-ik-label">Category</div><div className="dd-ik-val">{driver.licenseCategory}</div></div>
        <div className="dd-info-card neu-card no-hover"><div className="dd-ik-label">Expiry</div><div className="dd-ik-val" style={{ color: daysToExpiry < 30 ? 'var(--accent-danger)' : 'inherit' }}>{new Date(driver.licenseExpiry).toLocaleDateString()}</div></div>
        <div className="dd-info-card neu-card no-hover"><div className="dd-ik-label">Completion Rate</div><div className="dd-ik-val text-mono" style={{ color: 'var(--accent-success)' }}>{totalTrips > 0 ? Math.round((completedTrips/totalTrips)*100) : 0}%</div></div>
      </div>

      {/* Trip history */}
      <div style={{ padding: '0 var(--sp-5) var(--sp-5)' }}>
        <div className="neu-card no-hover">
          <div className="dd-section-title"><Route size={14}/> Trip History</div>
          {driver.trips?.length ? (
            <table className="dd-table">
              <thead><tr><th>Trip #</th><th>Route</th><th>Vehicle</th><th>Status</th><th>Date</th></tr></thead>
              <tbody>
                {driver.trips.map(t => (
                  <tr key={t.id}>
                    <td className="text-mono" style={{ color: 'var(--accent-primary)' }}>{t.tripNumber}</td>
                    <td style={{ fontSize: 'var(--text-xs)' }}>{t.source} → {t.destination}</td>
                    <td className="text-mono">{t.vehicle?.registrationNumber ?? '—'}</td>
                    <td><span className={`badge ${t.status.toLowerCase().replace(/_/g,'-')}`}>{t.status}</span></td>
                    <td style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>{new Date(t.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : <div className="dd-empty">No trips recorded for this driver</div>}
        </div>
      </div>
    </div>
  );
}
