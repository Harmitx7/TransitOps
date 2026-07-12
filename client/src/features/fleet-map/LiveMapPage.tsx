import { useState, useEffect, useRef } from 'react';
import { MapPin, Truck, Navigation, X, ChevronLeft, ChevronRight, Zap } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
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
  AVAILABLE:  '#0EA5E9',
  ON_TRIP:    '#22C55E',
  IN_SHOP:    '#F59E0B',
  RETIRED:    '#737373',
};

const TRUCK_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="3" width="15" height="13"></rect><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon><circle cx="5.5" cy="18.5" r="2.5"></circle><circle cx="18.5" cy="18.5" r="2.5"></circle></svg>`;

function getMarkerIcon(status: string) {
  const color = STATUS_DOT[status] || '#737373';
  return L.divIcon({
    html: `<div style="background-color: ${color}; width: 26px; height: 26px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2px solid #fff; box-shadow: 0 2px 6px rgba(0,0,0,0.4);">${TRUCK_SVG}</div>`,
    className: '',
    iconSize: [26, 26],
    iconAnchor: [13, 13]
  });
}

function getGoogleMapsLayerUrl(type: 'roadmap' | 'satellite' | 'hybrid') {
  if (type === 'satellite') return 'https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}';
  if (type === 'hybrid') return 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}';
  return 'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}';
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

        {/* Google Maps via react-leaflet */}
        <div className="map-canvas-wrap">
          <MapContainer center={[22.3, 71.8]} zoom={7} style={{ width: '100%', height: '100%' }} zoomControl={false}>
            <TileLayer
              attribution='&copy; Google Maps'
              url={getGoogleMapsLayerUrl('roadmap')}
            />
            {fleet.map(v => (
              <Marker 
                key={v.id} 
                position={[v.lat, v.lng]} 
                icon={getMarkerIcon(v.status)}
                eventHandlers={{ click: () => setSelected(id => id === v.id ? null : v.id) }}
              >
                {selected === v.id && (
                  <Popup>
                    <div style={{ fontSize: '13px', fontWeight: 'bold' }}>{v.registrationNumber}</div>
                    <div style={{ fontSize: '11px', color: '#555' }}>{v.make} {v.model} - {v.speed} km/h</div>
                  </Popup>
                )}
              </Marker>
            ))}
          </MapContainer>

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
