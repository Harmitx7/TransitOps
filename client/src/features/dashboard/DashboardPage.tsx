import { useEffect, useState } from 'react';

import { useNavigate } from 'react-router-dom';
import {
  PieChart, Pie, Cell, AreaChart, Area, LineChart, Line,
  XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, CartesianGrid, Legend
} from 'recharts';
import { Truck, Users, Route, Plus, Fuel, FileBarChart, Wrench, TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';
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
function KpiCard({ label, value, subtitle, pct, icon: Icon, color, trend }:
  { label: string; value: number | string; subtitle?: string; pct?: number; icon: React.ElementType; color: string; trend?: 'up' | 'down' }) {
  const numVal = typeof value === 'number' ? value : 0;
  const displayed = useCountUp(numVal);
  return (
    <div className="kpi-card neu-card no-hover">
      <div className="kpi-card-screw kpi-screw-tl" /><div className="kpi-card-screw kpi-screw-tr" />
      <div className="kpi-top">
        <div className="kpi-icon-wrap" style={{ background: `${color}18` }}>
          <Icon size={20} color={color} aria-hidden="true" />
        </div>
        {pct !== undefined && <GaugeRing pct={pct} size={64} color={color} />}
      </div>
      <div className="kpi-value text-mono" style={{ color }}>
        {typeof value === 'string' ? value : displayed}
        {trend === 'up' && <TrendingUp size={14} className="kpi-trend up" />}
        {trend === 'down' && <TrendingDown size={14} className="kpi-trend down" />}
      </div>
      <div className="kpi-label">{label}</div>
      {subtitle && <div className="kpi-subtitle">{subtitle}</div>}
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
    <div className="chart-tooltip">
      <div className="chart-tooltip-label">{label}</div>
      {payload.map((p: any) => (
        <div key={p.name} className="chart-tooltip-row">
          <span style={{ color: p.color }}>{p.name}</span>
          <span>{typeof p.value === 'number' && p.value > 1000 ? `₹${(p.value/1000).toFixed(0)}K` : p.value}</span>
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
      <div className="dashboard-header">
        <div>
          <h1 className="text-h1">Operations Dashboard</h1>
          <p className="text-secondary" style={{ marginTop: 4, fontSize: 'var(--text-sm)' }}>
            Real-time fleet intelligence
          </p>
        </div>
        <div className="dashboard-quick-actions">
          <button className="btn btn-ghost btn-pill sm" onClick={() => navigate('/trips/new')}>
            <Plus size={14} /> New Trip
          </button>
          <button className="btn btn-ghost btn-pill sm" onClick={() => navigate('/vehicles')}>
            <Truck size={14} /> Add Vehicle
          </button>
          <button className="btn btn-ghost btn-pill sm" onClick={() => navigate('/fuel')}>
            <Fuel size={14} /> Log Fuel
          </button>
          <button className="btn btn-pill sm" onClick={() => navigate('/reports')}>
            <FileBarChart size={14} /> Reports
          </button>
        </div>
      </div>

      {/* Status bar */}
      {isLoading && <div className="dashboard-status-bar"><Clock size={14} /> Loading live data...</div>}
      {error && <div className="dashboard-status-bar danger"><AlertTriangle size={14} /> Using cached data</div>}

      {/* KPI Grid */}
      <div className="kpi-grid">
        <KpiCard label="Total Fleet" value={s.totalVehicles} subtitle={`${s.availableVehicles} available`}
          pct={Math.round((s.availableVehicles / s.totalVehicles) * 100)} icon={Truck} color="var(--accent-primary)" trend="up" />
        <KpiCard label="Active Trips" value={s.activeTrips} subtitle={`${s.pendingTrips} pending`}
          pct={Math.round((s.activeTrips / Math.max(s.totalVehicles, 1)) * 100)} icon={Route} color="var(--accent-info)" />
        <KpiCard label="Drivers On Duty" value={s.onDutyDrivers} subtitle={`${s.availableDrivers} available`}
          pct={Math.round((s.onDutyDrivers / Math.max(s.totalDrivers, 1)) * 100)} icon={Users} color="var(--accent-success)" trend="up" />
        <KpiCard label="Fleet Utilization" value={`${s.fleetUtilization}%`} subtitle="of total capacity"
          pct={s.fleetUtilization} icon={TrendingUp} color="var(--accent-warning)" />
        <KpiCard label="Vehicles in Shop" value={s.inMaintenance} subtitle="under maintenance"
          icon={Wrench} color="var(--accent-danger)" />
        <KpiCard label="Avg Health Score" value={s.avgHealthScore} subtitle={`${s.avgSafetyScore}% safety`}
          pct={s.avgHealthScore} icon={CheckCircle2} color="var(--accent-success)" trend="up" />
        <KpiCard label="Revenue (MTD)" value={`₹${Math.round(s.totalRevenue / 1000)}K`}
          subtitle={`₹${Math.round(s.totalExpenses / 1000)}K expenses`} icon={TrendingUp}
          color="var(--accent-primary)" trend="up" />
        <KpiCard label="Net Profit" value={`₹${Math.round(profit / 1000)}K`}
          subtitle={`${profitPct}% margin`} icon={profit >= 0 ? TrendingUp : TrendingDown}
          color={profit >= 0 ? 'var(--accent-success)' : 'var(--accent-danger)'} trend={profit >= 0 ? 'up' : 'down'} />
      </div>

      {/* Charts Grid */}
      <div className="charts-grid">

        {/* Fleet Status Donut */}
        <div className="chart-card neu-card no-hover">
          <div className="chart-card-screw chart-screw-tl" /><div className="chart-card-screw chart-screw-tr" />
          <h3 className="chart-title">Fleet Status</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={FLEET_STATUS_DATA} cx="50%" cy="50%" innerRadius={55} outerRadius={85}
                paddingAngle={3} dataKey="value">
                {FLEET_STATUS_DATA.map((e, i) => <Cell key={i} fill={e.color} />)}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="chart-legend">
            {FLEET_STATUS_DATA.map(d => (
              <div key={d.name} className="legend-item">
                <span className="legend-dot" style={{ background: d.color }} />
                <span>{d.name}</span>
                <span className="legend-val text-mono">{d.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Fuel Trend Area */}
        <div className="chart-card neu-card no-hover chart-wide">
          <div className="chart-card-screw chart-screw-tl" /><div className="chart-card-screw chart-screw-tr" />
          <h3 className="chart-title">Fuel Consumption Trend</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={FUEL_TREND_DATA} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="fuelGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--accent-primary)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="var(--accent-primary)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--neu-dark)" opacity={0.5} />
              <XAxis dataKey="week" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="liters" name="Liters" stroke="var(--accent-primary)"
                fill="url(#fuelGrad)" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Revenue vs Cost */}
        <div className="chart-card neu-card no-hover chart-wide">
          <div className="chart-card-screw chart-screw-tl" /><div className="chart-card-screw chart-screw-tr" />
          <h3 className="chart-title">Revenue vs Expenses</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={REVENUE_DATA} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--neu-dark)" opacity={0.5} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} tickFormatter={v => `₹${v/1000}K`} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12, color: 'var(--text-secondary)' }} />
              <Line type="monotone" dataKey="revenue" name="Revenue" stroke="var(--accent-success)"
                strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="cost" name="Expenses" stroke="var(--accent-danger)"
                strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Vehicle Health List */}
        <div className="chart-card neu-card no-hover">
          <div className="chart-card-screw chart-screw-tl" /><div className="chart-card-screw chart-screw-tr" />
          <h3 className="chart-title">Vehicle Health Scores</h3>
          <div className="health-list">
            {HEALTH_DATA.map(v => {
              const color = v.score >= 80 ? 'var(--accent-success)' : v.score >= 60 ? 'var(--accent-warning)' : 'var(--accent-danger)';
              return (
                <div key={v.name} className="health-item">
                  <span className="health-reg text-mono">{v.name}</span>
                  <div className="progress-track" style={{ flex: 1 }}>
                    <div className="progress-fill" style={{ width: `${v.score}%`, background: color }} />
                  </div>
                  <span className="health-score text-mono" style={{ color }}>{v.score}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Maintenance by Type */}
        <div className="chart-card neu-card no-hover">
          <div className="chart-card-screw chart-screw-tl" /><div className="chart-card-screw chart-screw-tr" />
          <h3 className="chart-title">Maintenance Breakdown</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart layout="vertical" data={[
              { type: 'Preventive', count: 3 }, { type: 'Corrective', count: 2 },
              { type: 'Emergency', count: 1 }, { type: 'Inspection', count: 4 },
            ]} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
              <XAxis type="number" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
              <YAxis type="category" dataKey="type" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} width={80} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" name="Jobs" fill="var(--accent-warning)" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

      </div>

      {/* Recent Alerts */}
      <div className="dashboard-alerts neu-card no-hover">
        <div className="chart-card-screw chart-screw-tl" /><div className="chart-card-screw chart-screw-tr" />
        <h3 className="chart-title"><AlertTriangle size={16} color="var(--accent-warning)" /> System Alerts</h3>
        <div className="alerts-list">
          {[
            { type: 'warning', text: 'Vehicle GJ-01-AB-1234 insurance expires in 12 days', time: '2h ago' },
            { type: 'danger', text: 'Driver Rajesh Yadav license expires in 5 days', time: '4h ago' },
            { type: 'info', text: 'Fuel anomaly detected on Trip #TRP-0042', time: '6h ago' },
            { type: 'success', text: 'Trip #TRP-0039 completed successfully', time: '8h ago' },
          ].map((a, i) => (
            <div key={i} className={`alert-item alert-${a.type}`}>
              <span className="alert-dot" />
              <span className="alert-text">{a.text}</span>
              <span className="alert-time">{a.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
