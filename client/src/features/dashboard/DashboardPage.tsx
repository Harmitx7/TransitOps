import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PieChart, Pie, Cell, AreaChart, Area, LineChart, Line,
  XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, CartesianGrid, Legend
} from 'recharts';
import { Truck, Users, Route, Plus, Fuel, FileBarChart, Wrench, TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, Clock, Camera, MapPin, Play } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '../../lib/api';
import './DashboardPage.css';

/* ── Types ── */
interface DashboardStats {
  totalVehicles: number; activeVehicles: number; inMaintenance: number; availableVehicles: number;
  totalDrivers: number; onDutyDrivers: number; availableDrivers: number;
  activeTrips: number; pendingTrips: number; completedTripsToday: number;
  fleetUtilization: number; totalRevenue: number; totalExpenses: number;
  fuelEfficiency: number; avgHealthScore: number; avgSafetyScore: number;
}

/* ── CountUp hook ── */
function useCountUp(target: number, duration = 1200) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!target) return;
    const start = performance.now();
    const step = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(ease * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration]);
  return count;
}

/* ── GaugeRing ── */
function GaugeRing({ pct, size = 80, color = 'var(--accent-primary)' }: { pct: number; size?: number; color?: string }) {
  const r = (size - 12) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', flexShrink: 0 }} aria-hidden="true">
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--bg-sunken)" strokeWidth="8" />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="8"
        strokeDasharray={`${dash} ${circ - dash}`} strokeLinecap="round"
        style={{ transition: 'stroke-dasharray 1s cubic-bezier(0.34,1.56,0.64,1)' }} />
    </svg>
  );
}

/* ── KpiCard ── */
function KpiCard({ label, value, subtitle, pct, icon: Icon, color, trend, onClick }:
  { label: string; value: number | string; subtitle?: string; pct?: number; icon: React.ElementType; color: string; trend?: 'up' | 'down'; onClick: () => void }) {
  const numVal = typeof value === 'number' ? value : 0;
  const displayed = useCountUp(numVal);
  return (
    <div className="kpi-card panel-plate glow-hover" onClick={onClick} style={{ cursor: 'pointer' }}>
      <div className="kpi-top">
        <div className="kpi-icon-wrap" style={{ '--icon-color': color } as React.CSSProperties}>
          <Icon size={22} aria-hidden="true" className="kpi-icon" />
        </div>
        {pct !== undefined && <GaugeRing pct={pct} size={64} color={color} />}
      </div>
      <div className="kpi-value odo-value" style={{ color }}>
        {typeof value === 'string' ? value : displayed}
        {trend === 'up' && <TrendingUp size={14} className="kpi-trend up" />}
        {trend === 'down' && <TrendingDown size={14} className="kpi-trend down" />}
      </div>
      <div className="kpi-label mech-label">{label}</div>
      {subtitle && <div className="kpi-subtitle text-secondary">{subtitle}</div>}
    </div>
  );
}

/* ── Embedded Map Component ── */
function DashboardMapPreview() {
  const [vehicles, setVehicles] = useState([
    { id: 1, x: 20, y: 30, type: 'truck', angle: 45 },
    { id: 2, x: 70, y: 60, type: 'car', angle: 120 },
    { id: 3, x: 40, y: 80, type: 'truck', angle: -20 },
  ]);

  useEffect(() => {
    const int = setInterval(() => {
      setVehicles(prev => prev.map(v => ({
        ...v,
        x: (v.x + (Math.cos(v.angle * Math.PI / 180) * 2) + 100) % 100,
        y: (v.y + (Math.sin(v.angle * Math.PI / 180) * 2) + 100) % 100,
      })));
    }, 1000);
    return () => clearInterval(int);
  }, []);

  return (
    <div className="dash-map-container">
      <svg width="100%" height="100%" preserveAspectRatio="none">
        {/* Simple grid / roads */}
        <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="var(--neu-dark)" strokeWidth="1" opacity="0.3"/>
        </pattern>
        <rect width="100%" height="100%" fill="url(#grid)" />
        
        {vehicles.map(v => (
          <g key={v.id} style={{ transition: 'all 1s linear', transform: `translate(${v.x}%, ${v.y}%) rotate(${v.angle}deg)` }}>
            {v.type === 'truck' ? (
              <rect x="-10" y="-5" width="20" height="10" fill="var(--accent-primary)" rx="2" />
            ) : (
              <circle cx="0" cy="0" r="5" fill="var(--accent-info)" />
            )}
            <circle cx="0" cy="0" r="1.5" fill="#fff" />
          </g>
        ))}
      </svg>
    </div>
  );
}

/* ── Camera Feeds ── */
function CameraFeedGrid() {
  return (
    <div className="cam-grid">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="cam-feed" style={{ backgroundImage: `url('/assets/cam${i}.png')`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
          <div className="cam-overlay" style={{ background: 'rgba(0,0,0,0.5)', padding: '2px 6px', borderRadius: '4px' }}>
            <span className="live-dot" /> <span className="mech-label text-xs">CAM 0{i} - LIVE</span>
          </div>
          {/* Faux scan line animation applied in CSS */}
          <div className="cam-scanline" />
        </div>
      ))}
    </div>
  );
}

/* ── Mock Chart Data ── */
const FLEET_STATUS_DATA = [
  { name: 'Available', value: 6, color: 'var(--accent-success)' },
  { name: 'On Trip', value: 5, color: 'var(--accent-primary)' },
  { name: 'In Shop', value: 3, color: 'var(--accent-warning)' },
  { name: 'Retired', value: 1, color: 'var(--text-muted)' },
];
const FUEL_TREND_DATA = Array.from({ length: 12 }, (_, i) => ({
  week: `W${i + 1}`, liters: 800 + Math.random() * 400 | 0, cost: 70000 + Math.random() * 30000 | 0,
}));
const REVENUE_DATA = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map(m => ({
  month: m, revenue: 400000 + Math.random() * 200000 | 0, cost: 250000 + Math.random() * 100000 | 0,
}));
const HEALTH_DATA = [
  { name: 'GJ-01-AB-1234', score: 94 }, { name: 'GJ-01-CD-5678', score: 87 },
  { name: 'MH-02-EF-9012', score: 76 }, { name: 'DL-03-GH-3456', score: 65 }, { name: 'GJ-05-IJ-7890', score: 52 },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip panel-plate" style={{ padding: '8px 12px', minWidth: '120px' }}>
      <div className="chart-tooltip-label mech-label">{label}</div>
      {payload.map((p: any) => (
        <div key={p.name} className="chart-tooltip-row text-sm mt-1">
          <span style={{ color: p.color }}>{p.name}</span>
          <span className="text-mono">{typeof p.value === 'number' && p.value > 1000 ? `₹${(p.value/1000).toFixed(0)}K` : p.value}</span>
        </div>
      ))}
    </div>
  );
};

/* ── Main Dashboard ── */
export default function DashboardPage() {
  const navigate = useNavigate();
  const { data: stats, isLoading, error } = useQuery<DashboardStats>({
    queryKey: ['dashboard-stats'],
    queryFn: async () => { const { data } = await api.get('/dashboard/stats'); return data; },
    refetchInterval: 30000,
    retry: 1,
  });

  const { data: recentNotifs } = useQuery({
    queryKey: ['dashboard-notifs'],
    queryFn: async () => {
      const { data } = await api.get('/notifications?limit=4');
      return data.data || [];
    },
    refetchInterval: 30000,
  });

  const s = stats ?? {
    totalVehicles: 15, activeVehicles: 5, inMaintenance: 3, availableVehicles: 6,
    totalDrivers: 10, onDutyDrivers: 5, availableDrivers: 4,
    activeTrips: 5, pendingTrips: 3, completedTripsToday: 4,
    fleetUtilization: 72, totalRevenue: 420000, totalExpenses: 280000,
    fuelEfficiency: 8.4, avgHealthScore: 82, avgSafetyScore: 88,
  };

  const profit = s.totalRevenue - s.totalExpenses;
  const profitPct = s.totalRevenue > 0 ? ((profit / s.totalRevenue) * 100).toFixed(1) : '0';

  return (
    <div className="dashboard-page page-enter">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="text-h1">System Overview</h1>
          <p className="text-secondary">Real-time fleet intelligence and operations control</p>
        </div>
        <div className="dashboard-quick-actions">
          <button className="btn btn-ghost sm" onClick={() => navigate('/trips/new')}>
            <Plus size={14} /> NEW TRIP
          </button>
          <button className="btn btn-ghost sm" onClick={() => navigate('/fuel')}>
            <Fuel size={14} /> LOG FUEL
          </button>
          <button className="btn btn-ghost sm" onClick={() => navigate('/reports')}>
            <FileBarChart size={14} /> REPORTS
          </button>
        </div>
      </div>

      {/* Status bar */}
      {isLoading && <div className="dashboard-status-bar"><Clock size={14} className="spin" /> SYNCHRONIZING TELEMETRY...</div>}
      {error && <div className="dashboard-status-bar danger"><AlertTriangle size={14} className="shake" /> TELEMETRY OFFLINE - CACHED DATA</div>}

      {/* Bento Grid Command Center */}
      <div className="bento-grid mt-4">
        
        {/* Row 1: Top KPIs */}
        <KpiCard label="FLEET CAPACITY" value={s.totalVehicles} subtitle={`${s.availableVehicles} AVAIL`}
          pct={Math.round((s.availableVehicles / s.totalVehicles) * 100)} icon={Truck} color="var(--accent-primary)" trend="up" onClick={() => navigate('/vehicles')} />
        <KpiCard label="ACTIVE TRIPS" value={s.activeTrips} subtitle={`${s.pendingTrips} PEND`}
          pct={Math.round((s.activeTrips / Math.max(s.totalVehicles, 1)) * 100)} icon={Route} color="var(--accent-info)" onClick={() => navigate('/trips')} />
        <KpiCard label="DRIVER AVAILABILITY" value={s.onDutyDrivers} subtitle={`${s.availableDrivers} AVAIL`}
          pct={Math.round((s.onDutyDrivers / Math.max(s.totalDrivers, 1)) * 100)} icon={Users} color="var(--accent-success)" trend="up" onClick={() => navigate('/drivers')} />
        <KpiCard label="SYSTEM UTILIZATION" value={`${s.fleetUtilization}%`} subtitle="LOAD FACTOR"
          pct={s.fleetUtilization} icon={TrendingUp} color="var(--accent-warning)" onClick={() => navigate('/reports')} />

        {/* Row 2/3: Live Modules (Map and Cameras) */}
        <div className="bento-tile bento-map panel-plate glow-hover map-panel" onClick={() => navigate('/map')}>
          <h3 className="chart-title mech-label flex items-center gap-2"><MapPin size={16} className="text-info" /> GPS TELEMETRY</h3>
          <DashboardMapPreview />
        </div>

        <div className="bento-tile bento-cams panel-plate glow-hover cam-panel" onClick={() => navigate('/cv')}>
          <h3 className="chart-title mech-label flex items-center gap-2"><Camera size={16} className="text-accent" /> CABIN CAMS (LIVE)</h3>
          <CameraFeedGrid />
        </div>

        {/* Row 4: Secondary KPIs */}
        <KpiCard label="SHOP / MAINTENANCE" value={s.inMaintenance} subtitle="IN BAY"
          icon={Wrench} color="var(--accent-danger)" onClick={() => navigate('/maintenance')} />
        <KpiCard label="AVG HEALTH INDEX" value={s.avgHealthScore} subtitle={`${s.avgSafetyScore}% SFTY`}
          pct={s.avgHealthScore} icon={CheckCircle2} color="var(--accent-success)" trend="up" onClick={() => navigate('/vehicles')} />
        <KpiCard label="REVENUE YTD" value={`₹${Math.round(s.totalRevenue / 1000)}K`}
          subtitle={`EXP: ₹${Math.round(s.totalExpenses / 1000)}K`} icon={TrendingUp}
          color="var(--accent-primary)" trend="up" onClick={() => navigate('/reports')} />
        <KpiCard label="NET PROFIT" value={`₹${Math.round(profit / 1000)}K`}
          subtitle={`MRG: ${profitPct}%`} icon={profit >= 0 ? TrendingUp : TrendingDown}
          color={profit >= 0 ? 'var(--accent-success)' : 'var(--accent-danger)'} trend={profit >= 0 ? 'up' : 'down'} onClick={() => navigate('/reports')} />

        {/* Row 5: Charts & Alerts */}
        <div className="bento-tile bento-donut chart-card panel-plate">
          <h3 className="chart-title mech-label">FLEET STATUS</h3>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={FLEET_STATUS_DATA} cx="50%" cy="50%" innerRadius={45} outerRadius={70}
                paddingAngle={3} dataKey="value" stroke="none">
                {FLEET_STATUS_DATA.map((e, i) => <Cell key={i} fill={e.color} />)}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="chart-legend">
            {FLEET_STATUS_DATA.map(d => (
              <div key={d.name} className="legend-item text-xs mech-label">
                <span className="legend-dot" style={{ background: d.color }} />
                <span>{d.name}</span>
                <span className="legend-val text-mono text-primary">{d.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bento-tile bento-trend chart-card panel-plate glow-hover" onClick={() => navigate('/fuel')}>
          <h3 className="chart-title mech-label">FUEL CONSUMPTION METRICS</h3>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={FUEL_TREND_DATA} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="fuelGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--accent-primary)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="var(--accent-primary)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--neu-dark)" opacity={0.5} />
              <XAxis dataKey="week" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
              <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="liters" name="Liters" stroke="var(--accent-primary)"
                fill="url(#fuelGrad)" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bento-tile bento-alerts dashboard-alerts panel-plate glow-hover" onClick={() => navigate('/events')}>
          <h3 className="chart-title mech-label"><AlertTriangle size={16} color="var(--accent-warning)" className="shake" /> SYSTEM INCIDENTS</h3>
          <div className="alerts-list mt-3">
            {recentNotifs?.slice(0, 4).map((a: any, i: number) => {
              let colorType = 'info';
              if (a.type === 'CV_ALERT' || a.type === 'FUEL_ANOMALY') colorType = 'danger';
              else if (a.type === 'MAINTENANCE_DUE' || a.type === 'LICENSE_EXPIRY') colorType = 'warning';
              else if (a.type === 'TRIP_UPDATE' || a.type === 'SYSTEM') colorType = 'success';
              
              const diff = Date.now() - new Date(a.createdAt).getTime();
              const hrs = Math.floor(diff / 3600000);
              const timeStr = hrs < 1 ? 'JUST NOW' : hrs > 24 ? `${Math.floor(hrs/24)}D AGO` : `${hrs}H AGO`;

              return (
                <div key={i} className={`alert-item alert-${colorType}`} style={{ padding: '8px', borderBottom: '1px solid var(--neu-dark)' }}>
                  <span className={`live-dot ${colorType}`} />
                  <span className="alert-text mech-label text-primary" style={{ flex: 1, marginLeft: 12 }}>{a.message.substring(0, 45)}{a.message.length > 45 ? '...' : ''}</span>
                  <span className="alert-time text-mono text-muted text-xs">{timeStr}</span>
                </div>
              );
            })}
            {!recentNotifs?.length && (
              <div className="empty-state text-sm" style={{ minHeight: '100px' }}>No active incidents</div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
