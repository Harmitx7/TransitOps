import { useState } from 'react';
import { Brain, Zap, Route, Fuel, Navigation, TrendingUp, CheckCircle2, Truck } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '../../lib/api';
import './AiDispatchPage.css';

/* ── Types ── */
interface Vehicle { id: string; registrationNumber: string; make: string; model: string; type: string; healthScore: number; maxLoadCapacity: number; status: string; }
interface Driver  { id: string; firstName: string; lastName: string; safetyScore: number; status: string; }
interface Trip    { id: string; tripNumber: string; source: string; destination: string; status: string; }

/* ── Scoring algorithms ── */
const BASE_FUEL_RATE: Record<string, number> = { Truck: 0.25, Bus: 0.20, Van: 0.12, Car: 0.08 };

function scoreVehicle(v: Vehicle, driver: Driver | undefined): number {
  const proximity   = Math.random() * 100 | 0;   // mock GPS proximity
  const health      = v.healthScore;
  const fuelEff     = 100 - ((BASE_FUEL_RATE[v.type] ?? 0.15) * 400);
  const driverSafe  = driver?.safetyScore ?? 50;
  const available   = v.status === 'AVAILABLE' ? 100 : 0;
  return Math.round(proximity * 0.25 + health * 0.20 + fuelEff * 0.20 + driverSafe * 0.20 + available * 0.15);
}

function predictFuel(vType: string, distance: number, load: number, year: number): number {
  const base = BASE_FUEL_RATE[vType] ?? 0.15;
  const loadFactor = 1 + (load / 100) * 0.3;
  const ageFactor  = 1 + ((2024 - year) * 0.01);
  return base * distance * loadFactor * ageFactor;
}

/* ── Score bar ── */
function ScoreBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="score-bar-row">
      <span className="score-bar-label">{label}</span>
      <div className="progress-track thin" style={{ flex: 1 }}>
        <div className="progress-fill" style={{ width: `${value}%`, background: color }} />
      </div>
      <span className="score-bar-val text-mono">{value}</span>
    </div>
  );
}

/* ── Recommendation Card ── */
function RecommendationCard({ rank, v, driver, score, selected, onSelect }:
  { rank: number; v: Vehicle; driver?: Driver; score: number; selected: boolean; onSelect: () => void }) {
  const color = score >= 80 ? 'var(--accent-success)' : score >= 60 ? 'var(--accent-warning)' : 'var(--accent-danger)';
  const r = 26; const circ = 2 * Math.PI * r;
  return (
    <div className={`rec-card neu-card no-hover ${selected ? 'rec-selected' : ''}`} onClick={onSelect}>
      <div className="rec-rank">#{rank}</div>
      <div className="rec-header">
        <div>
          <div className="rec-reg text-mono">{v.registrationNumber}</div>
          <div className="rec-model">{v.make} {v.model} · {v.type}</div>
        </div>
        {/* Score ring */}
        <div style={{ position: 'relative', width: 60, height: 60, flexShrink: 0 }}>
          <svg width={60} height={60} style={{ transform: 'rotate(-90deg)' }}>
            <circle cx={30} cy={30} r={r} fill="none" stroke="var(--bg-sunken)" strokeWidth={7} />
            <circle cx={30} cy={30} r={r} fill="none" stroke={color} strokeWidth={7}
              strokeDasharray={`${(score / 100) * circ} ${circ}`} strokeLinecap="round"
              style={{ transition: 'stroke-dasharray 1s cubic-bezier(0.34,1.56,0.64,1)' }} />
          </svg>
          <span style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', fontSize: 'var(--text-xs)', fontWeight: 700, fontFamily: 'var(--font-mono)', color }} >{score}</span>
        </div>
      </div>
      <div className="rec-factors">
        <ScoreBar label="Health" value={v.healthScore} color="var(--accent-success)" />
        <ScoreBar label="Fuel Eff." value={Math.round(100 - (BASE_FUEL_RATE[v.type] ?? 0.15) * 400)} color="var(--accent-info)" />
        <ScoreBar label="Safety" value={driver?.safetyScore ?? 50} color="var(--accent-primary)" />
      </div>
      {driver && <div className="rec-driver">Driver: <strong>{driver.firstName} {driver.lastName}</strong></div>}
      {selected && (
        <div className="rec-assign-bar">
          <CheckCircle2 size={14} color="var(--accent-success)" /> Selected for assignment
        </div>
      )}
    </div>
  );
}

/* ── Route Card ── */
function RouteCard({ label, color, distance, duration, fuel, toll, selected, onSelect }:
  { label: string; color: string; distance: number; duration: number; fuel: number; toll: number; selected: boolean; onSelect: () => void }) {
  return (
    <div className={`route-card neu-card no-hover ${selected ? 'route-selected' : ''}`} onClick={onSelect}
      style={selected ? { borderLeft: `3px solid ${color}` } : {}}>
      <div className="route-label" style={{ color }}>{label}</div>
      <div className="route-stats">
        <div className="route-stat"><Navigation size={12} style={{ color }} /><span>{distance} km</span></div>
        <div className="route-stat"><Route size={12} style={{ color: 'var(--text-muted)' }} /><span>{duration} min</span></div>
        <div className="route-stat"><Fuel size={12} style={{ color: 'var(--accent-warning)' }} /><span>{fuel.toFixed(1)} L</span></div>
        <div className="route-stat"><span style={{ color: 'var(--text-muted)' }}>Toll</span><span>₹{toll}</span></div>
      </div>
    </div>
  );
}

/* ── Main ── */
export default function AiDispatchPage() {
  const [selectedTrip, setSelectedTrip] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [selectedRoute, setSelectedRoute] = useState(0);
  const [fuelInput, setFuelInput] = useState({ type: 'Truck', distance: 200, load: 50, year: 2020 });
  const [fuelResult, setFuelResult] = useState<number | null>(null);

  const { data: vData } = useQuery<{ data: Vehicle[] }>({ queryKey: ['vehicles-ai'], queryFn: async () => { const { data } = await api.get('/vehicles?status=AVAILABLE&limit=20'); return data; } });
  const { data: dData } = useQuery<{ data: Driver[] }>({ queryKey: ['drivers-ai'], queryFn: async () => { const { data } = await api.get('/drivers?status=AVAILABLE&limit=20'); return data; } });
  const { data: tData } = useQuery<{ data: Trip[] }>({ queryKey: ['trips-pending'], queryFn: async () => { const { data } = await api.get('/trips?status=SCHEDULED&limit=20'); return data; } });

  const vehicles = vData?.data ?? [];
  const drivers  = dData?.data ?? [];
  const trips    = tData?.data ?? [];

  // Top 3 recommendations
  const recommendations = vehicles
    .map(v => ({ v, driver: drivers[Math.floor(Math.random() * Math.max(drivers.length, 1))], score: scoreVehicle(v, drivers[0]) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  // Mock routes
  const mockRoutes = [
    { label: '⚡ Fastest',       color: 'var(--accent-info)',    distance: 214, duration: 195, fuel: 42.8, toll: 180 },
    { label: '🌿 Fuel Efficient', color: 'var(--accent-success)', distance: 228, duration: 225, fuel: 37.2, toll: 120 },
    { label: '💰 Lowest Toll',   color: 'var(--accent-warning)',  distance: 241, duration: 240, fuel: 44.1, toll: 60 },
  ];

  return (
    <div className="ai-page page-enter">
      <div className="page-header">
        <div>
          <h1 className="text-h1" style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
            <Brain size={24} color="var(--accent-primary)" /> AI Operations Center
          </h1>
          <p className="text-secondary" style={{ fontSize: 'var(--text-sm)', marginTop: 4 }}>
            Intelligent dispatch recommendations and route optimization
          </p>
        </div>
      </div>

      <div className="ai-grid">
        {/* Left: Dispatch Recommendations */}
        <div className="ai-panel">
          <div className="ai-panel-header">
            <Zap size={16} color="var(--accent-primary)" />
            <h2 className="ai-panel-title">Dispatch Recommendations</h2>
          </div>

          <div className="form-group">
            <label className="form-label">Select Pending Trip</label>
            <select className="input-field" value={selectedTrip} onChange={e => setSelectedTrip(e.target.value)}>
              <option value="">Choose a scheduled trip...</option>
              {trips.map(t => <option key={t.id} value={t.id}>{t.tripNumber} — {t.source} → {t.destination}</option>)}
              {trips.length === 0 && <option disabled>No scheduled trips available</option>}
            </select>
          </div>

          <div className="rec-list">
            {recommendations.map((r, i) => (
              <RecommendationCard key={r.v.id} rank={i + 1} v={r.v} driver={r.driver}
                score={r.score} selected={selectedVehicle === r.v.id}
                onSelect={() => setSelectedVehicle(v => v === r.v.id ? '' : r.v.id)} />
            ))}
            {recommendations.length === 0 && (
              <div className="empty-state-sm">
                <Truck size={32} color="var(--text-muted)" />
                <p>No available vehicles found</p>
              </div>
            )}
          </div>

          {selectedVehicle && selectedTrip && (
            <button className="btn btn-pill" style={{ width: '100%', marginTop: 'var(--sp-3)' }}>
              <CheckCircle2 size={15} /> Confirm Assignment
            </button>
          )}
        </div>

        {/* Right: Route Optimization + Fuel Predictor */}
        <div className="ai-right">
          <div className="ai-panel">
            <div className="ai-panel-header">
              <Route size={16} color="var(--accent-info)" />
              <h2 className="ai-panel-title">Route Optimization</h2>
            </div>
            <div className="form-row" style={{ marginBottom: 'var(--sp-3)' }}>
              <div className="form-group">
                <label className="form-label">Origin</label>
                <input className="input-field" placeholder="Ahmedabad" />
              </div>
              <div className="form-group">
                <label className="form-label">Destination</label>
                <input className="input-field" placeholder="Mumbai" />
              </div>
            </div>
            <div className="route-list">
              {mockRoutes.map((r, i) => (
                <RouteCard key={i} {...r} selected={selectedRoute === i} onSelect={() => setSelectedRoute(i)} />
              ))}
            </div>
            <div className="selected-route-summary" style={{ background: `${mockRoutes[selectedRoute].color}15`, borderLeft: `3px solid ${mockRoutes[selectedRoute].color}` }}>
              <TrendingUp size={14} color={mockRoutes[selectedRoute].color} />
              <span>Selected: <strong>{mockRoutes[selectedRoute].label}</strong> · {mockRoutes[selectedRoute].distance} km · Est. ₹{(mockRoutes[selectedRoute].fuel * 92 + mockRoutes[selectedRoute].toll).toFixed(0)} total cost</span>
            </div>
          </div>

          {/* Fuel Predictor */}
          <div className="ai-panel">
            <div className="ai-panel-header">
              <Fuel size={16} color="var(--accent-warning)" />
              <h2 className="ai-panel-title">Fuel Consumption Predictor</h2>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Vehicle Type</label>
                <select className="input-field" value={fuelInput.type} onChange={e => setFuelInput(f => ({ ...f, type: e.target.value }))}>
                  {['Truck','Bus','Van','Car'].map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Distance (km)</label>
                <input className="input-field" type="number" value={fuelInput.distance}
                  onChange={e => setFuelInput(f => ({ ...f, distance: Number(e.target.value) }))} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Load % of Capacity</label>
                <input className="input-field" type="number" value={fuelInput.load} min={0} max={100}
                  onChange={e => setFuelInput(f => ({ ...f, load: Number(e.target.value) }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Vehicle Year</label>
                <input className="input-field" type="number" value={fuelInput.year} min={2000} max={2025}
                  onChange={e => setFuelInput(f => ({ ...f, year: Number(e.target.value) }))} />
              </div>
            </div>
            <button className="btn btn-pill" style={{ width: '100%' }}
              onClick={() => setFuelResult(predictFuel(fuelInput.type, fuelInput.distance, fuelInput.load, fuelInput.year))}>
              <Brain size={14} /> Predict Consumption
            </button>
            {fuelResult !== null && (
              <div className="fuel-predict-result slide-up">
                <div className="fpr-label">Predicted Fuel</div>
                <div className="fpr-value text-mono">{fuelResult.toFixed(1)} L</div>
                <div className="fpr-cost">≈ ₹{(fuelResult * 92).toFixed(0)} at ₹92/L</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
