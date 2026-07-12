import { useState, useEffect, useMemo } from 'react';
import { Brain, Zap, Route as RouteIcon, Fuel, Navigation, TrendingUp, CheckCircle2, Truck, Leaf, Coins, Search, MapPin } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { MapContainer, TileLayer, GeoJSON, useMap, Marker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import api from '../../lib/api';
import './AiDispatchPage.css';

/* ── Types ── */
interface Vehicle { id: string; registrationNumber: string; make: string; model: string; type: string; healthScore: number; maxLoadCapacity: number; status: string; }
interface Driver  { id: string; firstName: string; lastName: string; safetyScore: number; status: string; }
interface Trip    { id: string; tripNumber: string; source: string; destination: string; status: string; }

/* ── Scoring algorithms ── */
const BASE_FUEL_RATE: Record<string, number> = { Truck: 0.25, Bus: 0.20, Van: 0.12, Car: 0.08 };

function scoreVehicle(v: Vehicle, driver: Driver | undefined): number {
  let hash = 0;
  for (let i = 0; i < v.id.length; i++) {
    hash = v.id.charCodeAt(i) + ((hash << 5) - hash);
  }
  const proximity = 10 + (Math.abs(hash) % 86);   // stable mock GPS proximity (10-95)
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
    <div className={`rec-card ${selected ? 'rec-selected' : ''}`} onClick={onSelect}>
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
function RouteCard({ label, icon: Icon, color, distance, duration, fuel, toll, selected, onSelect }:
  { label: string; icon: React.ElementType; color: string; distance: number; duration: number; fuel: number; toll: number; selected: boolean; onSelect: () => void }) {
  return (
    <div className={`route-card ${selected ? 'route-selected' : ''}`} onClick={onSelect}
      style={selected ? { borderColor: color, boxShadow: `0 0 0 1px ${color}` } : {}}>
      <div className="route-label flex items-center gap-2" style={{ color }}>
        <Icon size={16} /> {label}
      </div>
      <div className="route-stats">
        <div className="route-stat"><Navigation size={12} style={{ color }} /><span>{distance} km</span></div>
        <div className="route-stat"><RouteIcon size={12} style={{ color: 'var(--text-muted)' }} /><span>{duration} min</span></div>
        <div className="route-stat"><Fuel size={12} style={{ color: 'var(--accent-warning)' }} /><span>{fuel.toFixed(1)} L</span></div>
        <div className="route-stat"><span style={{ color: 'var(--text-muted)' }}>Toll</span><span>₹{toll}</span></div>
      </div>
    </div>
  );
}

/* ── Map Bounds Component ── */
function MapBounds({ geojson, origin, dest }: { geojson: any, origin?: [number, number], dest?: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    if (geojson) {
      const layer = L.geoJSON(geojson);
      map.fitBounds(layer.getBounds(), { padding: [50, 50] });
    } else if (origin && dest) {
      map.fitBounds([origin, dest], { padding: [50, 50] });
    } else if (origin) {
      map.setView(origin, 12);
    }
  }, [geojson, map, origin, dest]);
  return null;
}

/* ── Marker Icons ── */
const createMarkerIcon = (color: string) => L.divIcon({
  html: `<div style="background-color: ${color}; width: 14px; height: 14px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 4px rgba(0,0,0,0.5);"></div>`,
  className: '',
  iconSize: [14, 14],
  iconAnchor: [7, 7]
});

/* ── Main ── */
export default function AiDispatchPage() {
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [selectedRoute, setSelectedRoute] = useState(0);
  
  // Routing State
  const [originStr, setOriginStr] = useState('Ahmedabad');
  const [destStr, setDestStr] = useState('Surat');
  const [originCoords, setOriginCoords] = useState<[number, number] | null>([23.0225, 72.5714]);
  const [destCoords, setDestCoords] = useState<[number, number] | null>([21.1702, 72.8311]);
  const [routeGeojson, setRouteGeojson] = useState<any>(null);
  const [routeDetails, setRouteDetails] = useState<{distance: number, duration: number} | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);

  const { data: vData } = useQuery<{ data: Vehicle[] }>({ queryKey: ['vehicles-ai'], queryFn: async () => { const { data } = await api.get('/vehicles?status=AVAILABLE&limit=20'); return data; } });
  const { data: dData } = useQuery<{ data: Driver[] }>({ queryKey: ['drivers-ai'], queryFn: async () => { const { data } = await api.get('/drivers?status=AVAILABLE&limit=20'); return data; } });

  const vehicles = vData?.data ?? [];
  const drivers  = dData?.data ?? [];

  // Top 3 recommendations
  const recommendations = useMemo(() => {
    if (vehicles.length === 0) return [];
    return vehicles
      .map((v, i) => {
        const driver = drivers[i % Math.max(drivers.length, 1)];
        return { v, driver, score: scoreVehicle(v, driver) };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);
  }, [vehicles, drivers]);

  // Dynamic route options based on OSRM details (or fallback to mock)
  const baseDist = routeDetails?.distance ?? 264;
  const baseDur  = routeDetails?.duration ?? 220;

  const mockRoutes = [
    { label: 'Fastest',       icon: Zap, color: 'var(--accent-info)',    distance: Math.round(baseDist), duration: Math.round(baseDur), fuel: baseDist * 0.2, toll: 180 },
    { label: 'Eco-Friendly',  icon: Leaf, color: 'var(--accent-success)', distance: Math.round(baseDist * 1.05), duration: Math.round(baseDur * 1.15), fuel: baseDist * 0.17, toll: 120 },
    { label: 'Lowest Toll',   icon: Coins, color: 'var(--accent-warning)',  distance: Math.round(baseDist * 1.1), duration: Math.round(baseDur * 1.25), fuel: baseDist * 0.22, toll: 60 },
  ];

  async function fetchRoute() {
    if (!originStr || !destStr) return;
    setRouteLoading(true);
    try {
      const headers = { 'User-Agent': 'TransitOps-Control-Center/1.0 (contact: admin@transitops.local)' };
      // 1. Geocode Origin
      const oRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(originStr)}`, { headers });
      const oData = await oRes.json();
      // 2. Geocode Dest
      const dRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(destStr)}`, { headers });
      const dData = await dRes.json();
      
      if (oData.length > 0 && dData.length > 0) {
        const o = oData[0];
        const d = dData[0];
        setOriginCoords([parseFloat(o.lat), parseFloat(o.lon)]);
        setDestCoords([parseFloat(d.lat), parseFloat(d.lon)]);
        
        // 3. OSRM Route
        const routeRes = await fetch(`https://router.project-osrm.org/route/v1/driving/${o.lon},${o.lat};${d.lon},${d.lat}?overview=full&geometries=geojson`);
        const routeData = await routeRes.json();
        
        if (routeData.routes && routeData.routes.length > 0) {
          const route = routeData.routes[0];
          setRouteGeojson(route.geometry);
          setRouteDetails({ distance: route.distance / 1000, duration: route.duration / 60 });
        }
      } else {
        alert('Could not find one of the locations.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setRouteLoading(false);
    }
  }

  // Fetch initial route
  useEffect(() => { fetchRoute(); }, []);

  return (
    <div className="ai-page page-enter">
      <div className="page-header">
        <div>
          <h1 className="text-h1 flex items-center gap-3">
            <Brain size={24} className="text-accent" /> Smart Routing
          </h1>
        </div>
      </div>

      <div className="ai-grid">
        
        {/* Left: Booking Panel (Uber-like) */}
        <div className="ai-left">
          
          <div className="ai-panel">
            <div className="ai-panel-header">
              <h2 className="ai-panel-title">Plan Route</h2>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', background: 'var(--neu-light)', padding: '2px', borderRadius: 'calc(var(--r-inner) + 2px)' }}>
              {/* Origin */}
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: 16, top: 0, bottom: 0, display: 'flex', alignItems: 'center', zIndex: 2 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--text-primary)' }} />
                </div>
                <input className="input-field" style={{ paddingLeft: 40, border: 'none', background: 'var(--bg-surface)', borderRadius: 'var(--r-inner) var(--r-inner) 4px 4px', boxShadow: 'none' }} placeholder="Pickup location" value={originStr} onChange={e => setOriginStr(e.target.value)} onKeyDown={e => e.key === 'Enter' && fetchRoute()} />
              </div>
              {/* Destination */}
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: 16, top: 0, bottom: 0, display: 'flex', alignItems: 'center', zIndex: 2 }}>
                  <div style={{ width: 8, height: 8, background: 'var(--accent-primary)' }} />
                </div>
                <div style={{ position: 'absolute', left: 19, top: -14, height: 14, width: 2, background: 'var(--text-muted)', opacity: 0.4, zIndex: 2 }} />
                <input className="input-field" style={{ paddingLeft: 40, border: 'none', background: 'var(--bg-surface)', borderRadius: '4px 4px var(--r-inner) var(--r-inner)', boxShadow: 'none' }} placeholder="Dropoff location" value={destStr} onChange={e => setDestStr(e.target.value)} onKeyDown={e => e.key === 'Enter' && fetchRoute()} />
              </div>
            </div>
            {/* Quick Actions */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '4px' }}>
              {['Warehouse A', 'Port Terminal', 'City Center', 'Airport'].map(place => (
                <button key={place} className="btn-ghost" style={{ fontSize: '11px', padding: '6px 12px', borderRadius: 'var(--r-pill)', flex: '1 1 auto', border: '1px solid var(--neu-light)' }}
                  onClick={() => setDestStr(place)}>
                  {place}
                </button>
              ))}
            </div>
            <button className="btn btn-pill" style={{ width: '100%', marginTop: 'auto', padding: '16px', fontSize: '1.1rem', background: 'var(--text-primary)', color: 'var(--bg-base)' }} onClick={fetchRoute} disabled={routeLoading}>
              {routeLoading ? 'Calculating...' : <><Search size={18} /> Find Routes</>}
            </button>
          </div>

          <div className="ai-panel">
            <div className="ai-panel-header">
              <h2 className="ai-panel-title">Route Selection</h2>
            </div>
            <div className="route-list">
              {mockRoutes.map((r, i) => (
                <RouteCard key={i} {...r} selected={selectedRoute === i} onSelect={() => setSelectedRoute(i)} />
              ))}
            </div>
          </div>

          <div className="ai-panel ai-panel-full" style={{ display: 'flex', flexDirection: 'column' }}>
            <div className="ai-panel-header">
              <h2 className="ai-panel-title">Vehicle Assignment</h2>
            </div>
            <div className="rec-list" style={{ flex: 1 }}>
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
            {selectedVehicle && (
              <div style={{ marginTop: 'auto', paddingTop: 'var(--sp-4)' }}>
                <button className="btn btn-pill" style={{ width: '100%', padding: '16px', fontSize: '1.1rem', background: 'var(--text-primary)', color: 'var(--bg-base)' }}>
                  <CheckCircle2 size={18} /> Confirm Dispatch
                </button>
              </div>
            )}
          </div>

        </div>

        {/* Right: Interactive Map */}
        <div className="ai-map-panel">
          <MapContainer center={[22.3, 71.8]} zoom={6} style={{ width: '100%', height: '100%' }} zoomControl={true}>
            <TileLayer
              attribution='&copy; Google Maps'
              url="https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
            />
            {routeGeojson && <GeoJSON data={routeGeojson} style={{ color: mockRoutes[selectedRoute].color, weight: 5, opacity: 0.8 }} key={`${selectedRoute}-${routeGeojson.coordinates.length}`} />}
            {originCoords && <Marker position={originCoords} icon={createMarkerIcon('#737373')} />}
            {destCoords && <Marker position={destCoords} icon={createMarkerIcon('var(--accent-primary)')} />}
            <MapBounds geojson={routeGeojson} origin={originCoords ?? undefined} dest={destCoords ?? undefined} />
          </MapContainer>
        </div>

      </div>
    </div>
  );
}
