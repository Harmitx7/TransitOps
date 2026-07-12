import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Route, Plus, Eye, MapPin, Activity } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '../../lib/api';
import './TripListPage.css';

type TripStatus = 'DRAFT' | 'SCHEDULED' | 'DISPATCHED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

interface Trip {
  id: string; tripNumber: string; source: string; destination: string;
  status: TripStatus; scheduledStart?: string; actualStart?: string; actualEnd?: string;
  distancePlanned?: number; revenue?: number;
  vehicle: { registrationNumber: string; make: string; model: string };
  driver: { firstName: string; lastName: string };
}

const STATUS_CONFIG: Record<TripStatus, { label: string; css: string; color: string }> = {
  DRAFT:       { label: 'Draft',       css: 'draft',       color: 'var(--text-muted)' },
  SCHEDULED:   { label: 'Scheduled',   css: 'scheduled',   color: 'var(--accent-info)' },
  DISPATCHED:  { label: 'Dispatched',  css: 'dispatched',  color: 'var(--accent-warning)' },
  IN_PROGRESS: { label: 'In Progress', css: 'in-progress', color: 'var(--accent-success)' },
  COMPLETED:   { label: 'Completed',   css: 'completed',   color: 'var(--accent-success)' },
  CANCELLED:   { label: 'Cancelled',   css: 'cancelled',   color: 'var(--accent-danger)' },
};

const ALL_STATUSES = ['ALL', 'DRAFT', 'SCHEDULED', 'DISPATCHED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'] as const;
type FilterStatus = typeof ALL_STATUSES[number];

function LifecycleBar({ status }: { status: TripStatus }) {
  const steps: TripStatus[] = ['DRAFT', 'SCHEDULED', 'DISPATCHED', 'IN_PROGRESS', 'COMPLETED'];
  const currentIdx = steps.indexOf(status);
  if (status === 'CANCELLED') return null;
  return (
    <div className="lifecycle-bar">
      {steps.map((s, i) => (
        <div key={s} className={`lifecycle-step ${i <= currentIdx ? 'done' : ''} ${i === currentIdx ? 'current' : ''}`}>
          <div className="lifecycle-dot" />
          {i < steps.length - 1 && <div className="lifecycle-line" />}
        </div>
      ))}
    </div>
  );
}

function TripRow({ t, onClick }: { t: Trip; onClick: () => void }) {
  const cfg = STATUS_CONFIG[t.status];
  const isActive = t.status === 'IN_PROGRESS';
  return (
    <tr className={`trip-row ${isActive ? 'trip-active' : ''}`} onClick={onClick}>
      <td>
        <span className="trip-number text-mono">{t.tripNumber}</span>
        {isActive && <span className="trip-live-dot" title="Live" />}
      </td>
      <td>
        <div className="trip-route">
          <span className="trip-src">{t.source}</span>
          <Route size={12} className="trip-arrow" aria-hidden="true" />
          <span className="trip-dest">{t.destination}</span>
        </div>
      </td>
      <td className="text-mono text-sm">{t.vehicle.registrationNumber}</td>
      <td>{t.driver.firstName} {t.driver.lastName}</td>
      <td><span className={`badge ${cfg.css}`}>{cfg.label}</span></td>
      <td className="text-mono text-sm">{t.distancePlanned ? `${t.distancePlanned} km` : '--'}</td>
      <td className="text-mono text-sm">{t.revenue ? `₹${(t.revenue / 1000).toFixed(0)}K` : '--'}</td>
      <td>
        <button className="btn btn-ghost btn-pill sm" onClick={e => { e.stopPropagation(); onClick(); }}>
          <Eye size={13} /> View
        </button>
      </td>
    </tr>
  );
}

/* Mobile Trip Card */
function TripCard({ t, onClick }: { t: Trip; onClick: () => void }) {
  const cfg = STATUS_CONFIG[t.status];
  const isActive = t.status === 'IN_PROGRESS';
  return (
    <div className={`trip-card neu-card no-hover ${isActive ? 'trip-card-active' : ''}`} onClick={onClick}>
      <div className="tc-header">
        <span className="trip-number text-mono">{t.tripNumber}</span>
        <span className={`badge ${cfg.css}`}>{cfg.label}</span>
      </div>
      <div className="tc-route">
        <MapPin size={12} style={{ color: 'var(--accent-success)', flexShrink: 0 }} />
        <span>{t.source}</span>
        <Route size={12} style={{ color: 'var(--text-muted)' }} />
        <span>{t.destination}</span>
        <MapPin size={12} style={{ color: 'var(--accent-danger)', flexShrink: 0 }} />
      </div>
      <div className="tc-meta">
        <span>{t.vehicle.registrationNumber}</span>
        <span>·</span>
        <span>{t.driver.firstName} {t.driver.lastName}</span>
        {t.distancePlanned && <><span>·</span><span>{t.distancePlanned} km</span></>}
      </div>
      {isActive && <LifecycleBar status={t.status} />}
    </div>
  );
}

export default function TripListPage() {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState<FilterStatus>('ALL');

  const { data, isLoading } = useQuery<{ data: Trip[]; total: number }>({
    queryKey: ['trips'],
    queryFn: async () => { const { data } = await api.get('/trips?limit=100'); return data; },
    refetchInterval: 15000,
  });

  const counts = ALL_STATUSES.reduce((acc, s) => {
    acc[s] = s === 'ALL'
      ? (data?.data.length ?? 0)
      : (data?.data.filter(t => t.status === s).length ?? 0);
    return acc;
  }, {} as Record<FilterStatus, number>);

  const trips = (data?.data ?? []).filter(t =>
    activeFilter === 'ALL' || t.status === activeFilter
  );

  const activeCount = data?.data.filter(t => t.status === 'IN_PROGRESS').length ?? 0;

  return (
    <div className="tl-page page-enter">
      <div className="page-header">
        <div>
          <h1 className="text-h1">Trip Operations</h1>
          <p className="text-secondary" style={{ fontSize: 'var(--text-sm)', marginTop: 4 }}>
            {activeCount > 0 && <><span className="live-badge"><Activity size={10} /> {activeCount} Live</span> · </>}
            {data?.total ?? '--'} total trips
          </p>
        </div>
        <button className="btn btn-pill" onClick={() => navigate('/trips/new')}>
          <Plus size={14} /> New Trip
        </button>
      </div>

      {/* Status Tabs */}
      <div className="trip-status-tabs">
        {ALL_STATUSES.map(s => (
          <button key={s}
            className={`trip-tab ${activeFilter === s ? 'active' : ''}`}
            onClick={() => setActiveFilter(s)}>
            {s === 'ALL' ? 'All' : STATUS_CONFIG[s].label}
            <span className="trip-tab-count">{counts[s]}</span>
          </button>
        ))}
      </div>

      {/* Desktop Table */}
      {isLoading ? (
        <div className="trip-skeleton">
          {Array.from({ length: 5 }).map((_, i) => <div key={i} className="skeleton" style={{ height: 52 }} />)}
        </div>
      ) : trips.length === 0 ? (
        <div className="empty-state neu-card no-hover">
          <Route size={48} color="var(--text-muted)" />
          <p>No trips in this category</p>
          <button className="btn btn-pill sm" onClick={() => navigate('/trips/new')}><Plus size={14} /> Create Trip</button>
        </div>
      ) : (
        <>
          <div className="trip-table-wrap">
            <table className="trip-table">
              <thead>
                <tr>
                  <th>Trip #</th><th>Route</th><th>Vehicle</th><th>Driver</th>
                  <th>Status</th><th>Distance</th><th>Revenue</th><th></th>
                </tr>
              </thead>
              <tbody>
                {trips.map(t => <TripRow key={t.id} t={t} onClick={() => navigate(`/trips/${t.id}`)} />)}
              </tbody>
            </table>
          </div>
          {/* Mobile Cards */}
          <div className="trip-cards-mobile">
            {trips.map(t => <TripCard key={t.id} t={t} onClick={() => navigate(`/trips/${t.id}`)} />)}
          </div>
        </>
      )}
    </div>
  );
}
