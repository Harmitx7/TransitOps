import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Route, Truck, Users, DollarSign, Calendar } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import './TripDetailPage.css';

type TripStatus = 'DRAFT' | 'SCHEDULED' | 'DISPATCHED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

interface Trip {
  id: string; tripNumber: string; source: string; destination: string;
  status: TripStatus; scheduledStart?: string; actualStart?: string; actualEnd?: string;
  distancePlanned?: number; revenue?: number; cargoType?: string;
  cargoWeight?: number; maxCargoCapacity?: number; notes?: string;
  vehicle?: { id: string; registrationNumber: string; make: string; model: string; healthScore: number };
  driver?:  { id: string; firstName: string; lastName: string; safetyScore: number };
  fuelLogs?: Array<{ quantity: number; totalCost: number }>;
  expenses?: Array<{ category: string; amount: number }>;
}

const STATUS_CFG: Record<TripStatus, { css: string; label: string }> = {
  DRAFT:       { css: 'draft',       label: 'Draft' },
  SCHEDULED:   { css: 'scheduled',   label: 'Scheduled' },
  DISPATCHED:  { css: 'dispatched',  label: 'Dispatched' },
  IN_PROGRESS: { css: 'in-progress', label: 'In Progress' },
  COMPLETED:   { css: 'completed',   label: 'Completed' },
  CANCELLED:   { css: 'cancelled',   label: 'Cancelled' },
};

const LIFECYCLE: TripStatus[] = ['DRAFT', 'SCHEDULED', 'DISPATCHED', 'IN_PROGRESS', 'COMPLETED'];
const NEXT_STATUS: Partial<Record<TripStatus, TripStatus>> = {
  DRAFT: 'SCHEDULED', SCHEDULED: 'DISPATCHED', DISPATCHED: 'IN_PROGRESS', IN_PROGRESS: 'COMPLETED',
};
const ACTION_LABEL: Partial<Record<TripStatus, string>> = {
  DRAFT: 'Schedule', SCHEDULED: 'Dispatch', DISPATCHED: 'Start Trip', IN_PROGRESS: 'Complete Trip',
};

function LifecycleProgress({ status }: { status: TripStatus }) {
  const currentIdx = LIFECYCLE.indexOf(status);
  return (
    <div className="td-lifecycle">
      {LIFECYCLE.map((s, i) => (
        <div key={s} className="td-lc-step">
          <div className={`td-lc-dot ${i <= currentIdx ? 'done' : ''} ${i === currentIdx ? 'current' : ''}`}/>
          <div className={`td-lc-label ${i === currentIdx ? 'active' : ''}`}>{STATUS_CFG[s].label}</div>
          {i < LIFECYCLE.length - 1 && <div className={`td-lc-line ${i < currentIdx ? 'done' : ''}`}/>}
        </div>
      ))}
    </div>
  );
}

export default function TripDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: trip, isLoading } = useQuery<Trip>({
    queryKey: ['trip', id],
    queryFn: async () => { const { data } = await api.get(`/trips/${id}`); return data; },
    enabled: !!id, refetchInterval: 10000,
  });

  const advance = useMutation({
    mutationFn: async (newStatus: TripStatus) => api.patch(`/trips/${id}/status`, { status: newStatus }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['trip', id] }),
  });
  const cancel = useMutation({
    mutationFn: async () => api.patch(`/trips/${id}/status`, { status: 'CANCELLED' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['trip', id] }),
  });

  if (isLoading) return (
    <div className="td-page page-enter" style={{ padding: 'var(--sp-5)' }}>
      <div className="skeleton" style={{ height: 200, borderRadius: 'var(--r-card)', marginBottom: 'var(--sp-4)' }}/>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-4)' }}>
        <div className="skeleton" style={{ height: 300, borderRadius: 'var(--r-card)' }}/>
        <div className="skeleton" style={{ height: 300, borderRadius: 'var(--r-card)' }}/>
      </div>
    </div>
  );

  if (!trip) return (
    <div className="td-page page-enter" style={{ padding: 'var(--sp-5)' }}>
      <div className="empty-state neu-card no-hover"><Route size={40} color="var(--text-muted)"/><p>Trip not found</p></div>
    </div>
  );

  const cfg = STATUS_CFG[trip.status];
  const nextStatus = NEXT_STATUS[trip.status];
  const canAct = trip.status !== 'COMPLETED' && trip.status !== 'CANCELLED';
  const totalFuelCost = trip.fuelLogs?.reduce((s,f) => s + f.totalCost, 0) ?? 0;
  const totalExpenses = trip.expenses?.reduce((s,e) => s + e.amount, 0) ?? 0;
  const netProfit = (trip.revenue ?? 0) - totalFuelCost - totalExpenses;

  return (
    <div className="td-page page-enter">
      {/* Header */}
      <div className="td-header neu-card no-hover" style={{ margin: 'var(--sp-5) var(--sp-5) 0' }}>
        <div className="td-header-top">
          <button className="btn btn-ghost btn-pill sm" onClick={() => navigate('/trips')}><ArrowLeft size={14}/> Back</button>
          <div className="td-trip-num text-mono">{trip.tripNumber}</div>
          <span className={`badge ${cfg.css} badge-lg`}>{cfg.label}</span>
        </div>
        <div className="td-route">
          <MapPin size={16} color="var(--accent-success)"/>
          <span className="td-src">{trip.source}</span>
          <Route size={16} color="var(--text-muted)"/>
          <span className="td-dest">{trip.destination}</span>
          <MapPin size={16} color="var(--accent-danger)"/>
        </div>
        {trip.status !== 'CANCELLED' && <LifecycleProgress status={trip.status}/>}
      </div>

      {/* Action bar */}
      {canAct && (
        <div className="td-actions" style={{ padding: '0 var(--sp-5)' }}>
          {nextStatus && (
            <button className="btn btn-pill" onClick={() => advance.mutate(nextStatus)} disabled={advance.isPending}>
              {ACTION_LABEL[trip.status]}
            </button>
          )}
          <button className="btn btn-ghost btn-pill" onClick={() => cancel.mutate()} disabled={cancel.isPending}>
            Cancel Trip
          </button>
        </div>
      )}

      {/* Main grid */}
      <div className="td-grid" style={{ padding: '0 var(--sp-5) var(--sp-5)' }}>
        {/* Left column */}
        <div className="td-col">
          {/* Schedule */}
          <div className="td-card neu-card no-hover">
            <div className="td-card-title"><Calendar size={14}/> Schedule</div>
            <div className="td-info-rows">
              <div className="td-info-row"><span>Planned Start</span><span className="text-mono">{trip.scheduledStart ? new Date(trip.scheduledStart).toLocaleString() : '—'}</span></div>
              <div className="td-info-row"><span>Actual Start</span><span className="text-mono">{trip.actualStart ? new Date(trip.actualStart).toLocaleString() : '—'}</span></div>
              <div className="td-info-row"><span>Actual End</span><span className="text-mono">{trip.actualEnd ? new Date(trip.actualEnd).toLocaleString() : '—'}</span></div>
              <div className="td-info-row"><span>Distance</span><span className="text-mono">{trip.distancePlanned ? `${trip.distancePlanned} km` : '—'}</span></div>
            </div>
          </div>

          {/* Cargo */}
          <div className="td-card neu-card no-hover">
            <div className="td-card-title"><Truck size={14}/> Cargo</div>
            <div className="td-info-rows">
              <div className="td-info-row"><span>Type</span><span>{trip.cargoType ?? '—'}</span></div>
              <div className="td-info-row"><span>Weight</span><span className="text-mono">{trip.cargoWeight ? `${trip.cargoWeight} T` : '—'}</span></div>
              <div className="td-info-row"><span>Max Capacity</span><span className="text-mono">{trip.maxCargoCapacity ? `${trip.maxCargoCapacity} T` : '—'}</span></div>
            </div>
            {trip.cargoWeight && trip.maxCargoCapacity && (
              <div style={{ marginTop: 'var(--sp-2)' }}>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginBottom: 4 }}>Load: {Math.round((trip.cargoWeight/trip.maxCargoCapacity)*100)}%</div>
                <div className="progress-track"><div className="progress-fill" style={{ width: `${Math.round((trip.cargoWeight/trip.maxCargoCapacity)*100)}%` }}/></div>
              </div>
            )}
          </div>
        </div>

        {/* Right column */}
        <div className="td-col">
          {/* Vehicle */}
          {trip.vehicle && (
            <div className="td-card neu-card no-hover">
              <div className="td-card-title"><Truck size={14}/> Vehicle</div>
              <div className="td-mini-entity">
                <div className="td-me-reg text-mono">{trip.vehicle.registrationNumber}</div>
                <div className="td-me-sub">{trip.vehicle.make} {trip.vehicle.model}</div>
                <div className="td-health-bar">
                  <div className="progress-track thin"><div className="progress-fill" style={{ width: `${trip.vehicle.healthScore}%`, background: trip.vehicle.healthScore >= 80 ? 'var(--accent-success)' : 'var(--accent-warning)' }}/></div>
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>{trip.vehicle.healthScore} Health</span>
                </div>
              </div>
            </div>
          )}

          {/* Driver */}
          {trip.driver && (
            <div className="td-card neu-card no-hover">
              <div className="td-card-title"><Users size={14}/> Driver</div>
              <div className="td-mini-entity">
                <div className="td-me-reg">{trip.driver.firstName} {trip.driver.lastName}</div>
                <div className="td-health-bar">
                  <div className="progress-track thin"><div className="progress-fill" style={{ width: `${trip.driver.safetyScore}%`, background: 'var(--accent-success)' }}/></div>
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>{trip.driver.safetyScore} Safety</span>
                </div>
              </div>
            </div>
          )}

          {/* Financial */}
          <div className="td-card neu-card no-hover">
            <div className="td-card-title"><DollarSign size={14}/> Financials</div>
            <div className="td-info-rows">
              <div className="td-info-row"><span>Revenue</span><span className="text-mono" style={{ color: 'var(--accent-success)' }}>₹{(trip.revenue ?? 0).toLocaleString()}</span></div>
              <div className="td-info-row"><span>Fuel Cost</span><span className="text-mono" style={{ color: 'var(--accent-warning)' }}>₹{totalFuelCost.toFixed(0)}</span></div>
              <div className="td-info-row"><span>Other Expenses</span><span className="text-mono">₹{totalExpenses.toFixed(0)}</span></div>
              <div className="td-info-row td-net"><span>Net Profit</span><span className="text-mono" style={{ color: netProfit >= 0 ? 'var(--accent-success)' : 'var(--accent-danger)' }}>₹{netProfit.toFixed(0)}</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
