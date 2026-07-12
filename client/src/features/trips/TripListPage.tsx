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

function TicketCard({ t, onClick }: { t: Trip; onClick: () => void }) {
  const cfg = STATUS_CONFIG[t.status];
  const isActive = t.status === 'IN_PROGRESS';
  
  // Fake airport-like codes from city names
  const srcCode = t.source.substring(0, 3).toUpperCase();
  const destCode = t.destination.substring(0, 3).toUpperCase();

  return (
    <div className={`ticket-card ${isActive ? 'ticket-active' : ''}`} onClick={onClick}>
      
      {/* Left side: Main Ticket Body */}
      <div className="ticket-body">
        <div className="ticket-route-grid">
          <div className="ticket-city text-left">
            <div className="city-code text-mono">{srcCode}</div>
            <div className="city-name">{t.source}</div>
          </div>
          
          <div className="ticket-flight-path">
            <span className="flight-dot left" />
            <div className="flight-line" />
            <Route size={16} className="flight-icon" />
            <div className="flight-line" />
            <span className="flight-dot right" />
            <div className="flight-distance text-mono">{t.distancePlanned ? `${t.distancePlanned} km` : 'TBD'}</div>
          </div>
          
          <div className="ticket-city text-right">
            <div className="city-code text-mono">{destCode}</div>
            <div className="city-name">{t.destination}</div>
          </div>
        </div>
        
        <div className="ticket-meta">
          <div className="meta-group">
            <span className="meta-label">VEHICLE</span>
            <span className="meta-val text-mono">{t.vehicle.registrationNumber}</span>
          </div>
          <div className="meta-group">
            <span className="meta-label">DRIVER</span>
            <span className="meta-val">{t.driver.firstName} {t.driver.lastName}</span>
          </div>
          {t.scheduledStart && (
            <div className="meta-group">
              <span className="meta-label">SCHEDULED</span>
              <span className="meta-val">{new Date(t.scheduledStart).toLocaleDateString()}</span>
            </div>
          )}
        </div>
        {isActive && <LifecycleBar status={t.status} />}
      </div>
      
      {/* Dashed divider with cutouts */}
      <div className="ticket-divider" />
      
      {/* Right side: Ticket Stub */}
      <div className="ticket-stub">
        <div className="stub-header">
          <span className="meta-label">TRIP ID</span>
          <span className="stub-val text-mono">{t.tripNumber}</span>
        </div>
        
        <div className="stub-status">
          <span className={`badge ${cfg.css}`}>{cfg.label}</span>
          {isActive && <span className="trip-live-dot" title="Live" />}
        </div>
        
        <div className="stub-action">
          <button className="btn btn-ghost btn-pill sm" onClick={e => { e.stopPropagation(); onClick(); }}>
            <Eye size={13} /> View
          </button>
        </div>
      </div>
      
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
          <h1 className="text-h1"><Route size={24} className="text-accent" /> TRIP OPERATIONS</h1>
          <p className="text-secondary">
            {activeCount > 0 && <><span className="live-badge"><Activity size={10} /> {activeCount} Live</span> · </>}
            {data?.total ?? '--'} total trips
          </p>
        </div>
        <button className="btn btn-pill" onClick={() => navigate('/trips/new')}>
          <Plus size={14} /> NEW TRIP
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

      {/* Ticket List */}
      {isLoading ? (
        <div className="trip-skeleton">
          {Array.from({ length: 5 }).map((_, i) => <div key={i} className="skeleton" style={{ height: 140, borderRadius: 12 }} />)}
        </div>
      ) : trips.length === 0 ? (
        <div className="empty-state neu-card no-hover">
          <Route size={48} color="var(--text-muted)" />
          <p>No trips in this category</p>
          <button className="btn btn-pill sm" onClick={() => navigate('/trips/new')}><Plus size={14} /> Create Trip</button>
        </div>
      ) : (
        <div className="ticket-list-wrap">
          {trips.map(t => <TicketCard key={t.id} t={t} onClick={() => navigate(`/trips/${t.id}`)} />)}
        </div>
      )}
    </div>
  );
}
