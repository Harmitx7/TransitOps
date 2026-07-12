import { useState, useEffect } from 'react';
import { MapPin, Truck, Navigation, X, ChevronLeft, ChevronRight, Zap } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '../../lib/api';
import './LiveMapPage.css';

interface Vehicle {
  id: string; registrationNumber: string; make: string; model: string;
  type: string; status: string; healthScore: number;
}
interface ActiveVehicle extends Vehicle {
  lat: number; lng: number; speed: number; heading: number;
  driver?: { firstName: string; lastName: string };
  trip?: { tripNumber: string; destination: string };
}

/* ── Simulated GPS data ── */
// Based on Gujarat/India coordinates for realism
const BASE_COORDS: [number,number][] = [
  [23.0225, 72.5714],  // Ahmedabad
  [21.1702, 72.8311],  // Surat
  [22.3039, 70.8022],  // Rajkot
  [23.2156, 72.6369],  // Gandhinagar
  [20.9042, 74.7749],  // Nandurbar
  [19.9975, 73.7898],  // Nashik
];

function useSimulatedFleet(vehicles: Vehicle[]): ActiveVehicle[] {
  const [positions, setPositions] = useState<ActiveVehicle[]>(() =>
    vehicles.slice(0,6).map((v, i) => ({
      ...v,
      lat: BASE_COORDS[i % BASE_COORDS.length][0] + (Math.random() - 0.5) * 0.5,
      lng: BASE_COORDS[i % BASE_COORDS.length][1] + (Math.random() - 0.5) * 0.5,
      speed: v.status === 'ON_TRIP' ? Math.floor(40 + Math.random() * 60) : 0,
      heading: Math.random() * 360,
    }))
  );

  useEffect(() => {
    if (vehicles.length === 0) return;
    const id = setInterval(() => {
      setPositions(prev => prev.map(v => ({
        ...v,
        lat: v.status === 'ON_TRIP' ? v.lat + (Math.random() - 0.5) * 0.003 : v.lat,
        lng: v.status === 'ON_TRIP' ? v.lng + (Math.random() - 0.5) * 0.003 : v.lng,
        speed: v.status === 'ON_TRIP' ? Math.floor(40 + Math.random() * 60) : 0,
      })));
    }, 3000);
    return () => clearInterval(id);
  }, [vehicles.length]);

  return positions;
}

const STATUS_DOT: Record<string, string> = {
  AVAILABLE:  'var(--accent-info)',
  ON_TRIP:    'var(--accent-success)',
  IN_SHOP:    'var(--accent-warning)',
  RETIRED:    'var(--text-muted)',
};

/* ── Custom Map SVG Marker ── */
function VehicleMarker({ vehicle, selected, onClick }: {
  vehicle: ActiveVehicle; selected: boolean; onClick: () => void
}) {
  const color = STATUS_DOT[vehicle.status] ?? 'var(--text-muted)';
  // Convert lat/lng to approximate SVG coords in a 800x500 viewport
  // Simple linear mapping from India bounding box
  const svgX = ((vehicle.lng - 68) / (80 - 68)) * 780 + 10;
  const svgY = ((28 - vehicle.lat) / (28 - 18)) * 480 + 10;

  return (
    <g transform={`translate(${svgX},${svgY})`} onClick={onClick} style={{ cursor: 'pointer' }}>
      {selected && <circle r={18} fill={color} opacity={0.25} style={{ animation: 'pulse-ring 1.5s infinite' }}/>}
      <circle r={10} fill={color} stroke="white" strokeWidth={2} style={{ filter: `drop-shadow(0 2px 4px ${color}80)` }}/>
      <foreignObject x={-6} y={-6} width={12} height={12} style={{ overflow: 'visible', pointerEvents: 'none' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 12, height: 12 }}>
          <Truck size={8} color="white"/>
        </div>
      </foreignObject>
      {vehicle.status === 'ON_TRIP' && (
        <text y={-14} textAnchor="middle" fill="white" fontSize={9} fontFamily="monospace"
          style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.5))' }}>
          {vehicle.registrationNumber}
        </text>
      )}
    </g>
  );
}

export default function LiveMapPage() {
  const [selected, setSelected] = useState<string | null>(null);
  const [panelOpen, setPanelOpen] = useState(true);

  const { data } = useQuery<{ data: Vehicle[] }>({
    queryKey: ['vehicles-map'],
    queryFn: async () => { const { data } = await api.get('/vehicles?limit=50'); return data; },
    refetchInterval: 30000,
  });

  const vehicles = data?.data ?? [];
  const fleet = useSimulatedFleet(vehicles);
  const selectedVehicle = fleet.find(v => v.id === selected);

  const onTrip  = fleet.filter(v => v.status === 'ON_TRIP').length;
  const available = fleet.filter(v => v.status === 'AVAILABLE').length;

  return (
    <div className="map-page">
      {/* Status bar */}
      <div className="map-statusbar">
        <div className="map-sb-item"><span className="map-sb-dot" style={{ background: 'var(--accent-success)' }}/> {onTrip} On Trip</div>
        <div className="map-sb-item"><span className="map-sb-dot" style={{ background: 'var(--accent-info)' }}/> {available} Available</div>
        <div className="map-sb-item"><Zap size={12} color="var(--accent-primary)"/> Live</div>
      </div>

      <div className="map-layout">
        {/* Vehicle list panel */}
        <div className={`map-panel ${panelOpen ? 'open' : 'closed'}`}>
          <button className="map-panel-toggle" onClick={() => setPanelOpen(o => !o)}>
            {panelOpen ? <ChevronLeft size={16}/> : <ChevronRight size={16}/>}
          </button>
          {panelOpen && (
            <>
              <div className="map-panel-header">Fleet ({fleet.length})</div>
              <div className="map-vehicle-list">
                {fleet.map(v => (
                  <div key={v.id} className={`map-vehicle-item ${selected === v.id ? 'active' : ''}`}
                    onClick={() => setSelected(id => id === v.id ? null : v.id)}>
                    <div className="map-v-dot" style={{ background: STATUS_DOT[v.status] ?? 'var(--text-muted)' }}/>
                    <div className="map-v-info">
                      <div className="map-v-reg text-mono">{v.registrationNumber}</div>
                      <div className="map-v-sub">{v.make} {v.model}</div>
                      {v.status === 'ON_TRIP' && (
                        <div className="map-v-speed text-mono">{v.speed} km/h</div>
                      )}
                    </div>
                    <span className="map-v-status" style={{ color: STATUS_DOT[v.status] }}>{v.status.replace(/_/g,' ')}</span>
                  </div>
                ))}
                {fleet.length === 0 && (
                  <div style={{ padding: 'var(--sp-4)', textAlign: 'center', color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>No vehicles in fleet</div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Map area — SVG mock map (no external dependency) */}
        <div className="map-canvas-wrap">
          <svg className="map-svg" viewBox="0 0 800 500" preserveAspectRatio="xMidYMid meet">
            {/* Background */}
            <rect width="800" height="500" fill="var(--bg-sunken)"/>
            {/* Grid lines */}
            {Array.from({length:9}).map((_,i)=>(
              <g key={i}>
                <line x1={i*100} y1={0} x2={i*100} y2={500} stroke="var(--neu-dark)" strokeWidth={0.5} opacity={0.5}/>
                <line x1={0} y1={i*60} x2={800} y2={i*60} stroke="var(--neu-dark)" strokeWidth={0.5} opacity={0.5}/>
              </g>
            ))}
            {/* Route paths between cities */}
            <path d="M 100,200 Q 300,150 500,200" stroke="var(--accent-primary)" strokeWidth={1.5} fill="none" opacity={0.3} strokeDasharray="6 4"/>
            <path d="M 200,350 Q 400,300 650,280" stroke="var(--accent-success)" strokeWidth={1.5} fill="none" opacity={0.3} strokeDasharray="6 4"/>
            <path d="M 100,200 Q 200,280 200,350" stroke="var(--accent-info)" strokeWidth={1.5} fill="none" opacity={0.3} strokeDasharray="6 4"/>
            {/* City labels */}
            {[
              {x:100,y:200,name:'Ahmedabad'},{x:500,y:200,name:'Surat'},
              {x:200,y:350,name:'Rajkot'},{x:650,y:280,name:'Nashik'},
            ].map(c=>(
              <g key={c.name}>
                <circle cx={c.x} cy={c.y} r={5} fill="var(--bg-surface)" stroke="var(--text-muted)" strokeWidth={1.5}/>
                <text x={c.x+8} y={c.y+4} fill="var(--text-secondary)" fontSize={11} fontFamily="sans-serif">{c.name}</text>
              </g>
            ))}
            {/* Vehicle markers */}
            {fleet.map(v => (
              <VehicleMarker key={v.id} vehicle={v} selected={selected===v.id} onClick={() => setSelected(id => id===v.id ? null : v.id)}/>
            ))}
          </svg>

          {/* Map legend */}
          <div className="map-legend">
            {Object.entries(STATUS_DOT).slice(0,3).map(([s,c]) => (
              <div key={s} className="map-legend-item">
                <span className="map-sb-dot" style={{ background: c }}/>
                <span>{s.replace(/_/g,' ')}</span>
              </div>
            ))}
          </div>

          {/* Selected vehicle detail panel */}
          {selectedVehicle && (
            <div className="map-detail-card slide-up">
              <button className="btn-round map-detail-close" onClick={() => setSelected(null)}><X size={14}/></button>
              <div className="mdc-reg text-mono">{selectedVehicle.registrationNumber}</div>
              <div className="mdc-make">{selectedVehicle.make} {selectedVehicle.model} · {selectedVehicle.type}</div>
              <div className="mdc-rows">
                <div className="mdc-row"><MapPin size={12}/> {selectedVehicle.lat.toFixed(4)}, {selectedVehicle.lng.toFixed(4)}</div>
                <div className="mdc-row"><Navigation size={12}/> {selectedVehicle.speed} km/h</div>
                <div className="mdc-row" style={{ color: STATUS_DOT[selectedVehicle.status] }}>
                  <span className="map-sb-dot" style={{ background: STATUS_DOT[selectedVehicle.status] }}/>
                  {selectedVehicle.status.replace(/_/g,' ')}
                </div>
              </div>
              {selectedVehicle.status === 'ON_TRIP' && (
                <div className="progress-track thin" style={{ marginTop: 8 }}>
                  <div className="progress-fill" style={{ width: `${selectedVehicle.healthScore}%`, background: 'var(--accent-success)' }}/>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
