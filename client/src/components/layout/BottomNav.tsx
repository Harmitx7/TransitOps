import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Gauge, Truck, Route, MapPin, Ellipsis, Plus, Camera, Fuel } from 'lucide-react';
import { useLprStore } from '../../store/useLprStore';
import './BottomNav.css';

export default function BottomNav() {
  const [fabOpen, setFabOpen] = useState(false);
  const navigate = useNavigate();
  const { openLpr } = useLprStore();

  return (
    <>
      {/* FAB Menu Overlay */}
      {fabOpen && (
        <div className="bottom-nav-fab-overlay" onClick={() => setFabOpen(false)}>
          <div className="bottom-nav-fab-menu" onClick={e => e.stopPropagation()}>
            <div className="fab-action-wrap">
              <button className="fab-action circular orange" onClick={() => { setFabOpen(false); openLpr(); }}>
                <Camera size={24} />
              </button>
              <span className="fab-label">Scan Plate</span>
            </div>
            <div className="fab-action-wrap">
              <button className="fab-action circular light" onClick={() => { setFabOpen(false); navigate('/trips'); }}>
                <Route size={24} />
              </button>
              <span className="fab-label">New Trip</span>
            </div>
            <div className="fab-action-wrap">
              <button className="fab-action circular light" onClick={() => { setFabOpen(false); navigate('/fuel'); }}>
                <Fuel size={24} />
              </button>
              <span className="fab-label">Log Fuel</span>
            </div>
          </div>
        </div>
      )}

      <nav className="bottom-nav" aria-label="Mobile navigation">
        <NavLink to="/" end className={({ isActive }) => `bottom-nav-item${isActive ? ' active' : ''}`}>
          <Gauge size={20} aria-hidden="true" />
          <span>Dashboard</span>
        </NavLink>
        
        <NavLink to="/vehicles" className={({ isActive }) => `bottom-nav-item${isActive ? ' active' : ''}`}>
          <Truck size={20} aria-hidden="true" />
          <span>Fleet</span>
        </NavLink>
        
        <div className="bottom-nav-fab-container">
          <button className={`bottom-nav-fab ${fabOpen ? 'open' : ''}`} onClick={() => setFabOpen(!fabOpen)}>
            <Plus size={24} />
          </button>
        </div>

        <NavLink to="/trips" className={({ isActive }) => `bottom-nav-item${isActive ? ' active' : ''}`}>
          <Route size={20} aria-hidden="true" />
          <span>Trips</span>
        </NavLink>

        <NavLink to="/map" className={({ isActive }) => `bottom-nav-item${isActive ? ' active' : ''}`}>
          <MapPin size={20} aria-hidden="true" />
          <span>Map</span>
        </NavLink>
      </nav>
    </>
  );
}
