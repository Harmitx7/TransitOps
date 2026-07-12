import { useState } from 'react';
import { Fuel, CreditCard, Plus, X, AlertTriangle } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import api from '../../lib/api';
import './FuelPage.css';

interface FuelLog {
  id: string; vehicleId: string; quantity: number; costPerUnit: number;
  totalCost: number; odometer: number; station?: string; isAnomaly: boolean; createdAt: string;
  vehicle?: { registrationNumber: string };
  trip?: { tripNumber: string };
}
interface Expense {
  id: string; category: string; amount: number; description?: string; createdAt: string;
  trip?: { tripNumber: string };
}

const EXPENSE_COLORS: Record<string, string> = {
  FUEL: 'var(--accent-info)', TOLL: 'var(--accent-warning)',
  MAINTENANCE: 'var(--accent-danger)', INSURANCE: 'var(--accent-success)',
  REGISTRATION: 'hsl(280,60%,55%)', SALARY: 'var(--accent-primary)', OTHER: 'var(--text-muted)',
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <div className="chart-tooltip-label">{label}</div>
      {payload.map((p: any) => (
        <div key={p.name} className="chart-tooltip-row">
          <span style={{ color: p.color }}>{p.name}</span>
          <span>{typeof p.value === 'number' && p.value > 999 ? `₹${(p.value/1000).toFixed(1)}K` : p.value}</span>
        </div>
      ))}
    </div>
  );
};

// ── Fuel Log Modal ──
function FuelLogModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({ vehicleId: '', quantity: '', costPerUnit: '', odometer: '', station: '', tripId: '' });
  const { data: vData } = useQuery<{ data: Array<{ id: string; registrationNumber: string }> }>({
    queryKey: ['vehicles-short'], queryFn: async () => { const { data } = await api.get('/vehicles?limit=100'); return data; },
  });
  const mutation = useMutation({
    mutationFn: async () => api.post('/fuel', {
      vehicleId: form.vehicleId, quantity: Number(form.quantity),
      costPerUnit: Number(form.costPerUnit), odometer: Number(form.odometer),
      station: form.station || undefined, tripId: form.tripId || undefined,
      totalCost: Number(form.quantity) * Number(form.costPerUnit),
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['fuel'] }); onClose(); },
  });
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel slide-up" onClick={e => e.stopPropagation()}>
        <div className="modal-header"><h2>Log Fuel</h2><button className="btn-round" onClick={onClose}><X size={16} /></button></div>
        <form className="modal-form" onSubmit={e => { e.preventDefault(); mutation.mutate(); }}>
          <div className="form-group">
            <label className="form-label">Vehicle</label>
            <select className="input-field" value={form.vehicleId} onChange={set('vehicleId')} required>
              <option value="">Select vehicle...</option>
              {vData?.data.map(v => <option key={v.id} value={v.id}>{v.registrationNumber}</option>)}
            </select>
          </div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Quantity (L)</label><input className="input-field" type="number" step="0.1" value={form.quantity} onChange={set('quantity')} required /></div>
            <div className="form-group"><label className="form-label">Cost/Liter (₹)</label><input className="input-field" type="number" step="0.01" value={form.costPerUnit} onChange={set('costPerUnit')} required /></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Odometer (km)</label><input className="input-field" type="number" value={form.odometer} onChange={set('odometer')} required /></div>
            <div className="form-group"><label className="form-label">Station</label><input className="input-field" value={form.station} onChange={set('station')} placeholder="HP Petrol, Anand" /></div>
          </div>
          {form.quantity && form.costPerUnit && (
            <div className="fuel-total-preview">
              Total: <strong className="text-mono" style={{ color: 'var(--accent-primary)' }}>
                ₹{(Number(form.quantity) * Number(form.costPerUnit)).toFixed(2)}
              </strong>
            </div>
          )}
          <div className="modal-footer">
            <button type="button" className="btn btn-ghost btn-pill" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-pill" disabled={mutation.isPending}>{mutation.isPending ? 'Saving...' : 'Log Fuel'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Expense Modal ──
function ExpenseModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({ category: 'FUEL', amount: '', description: '' });
  const mutation = useMutation({
    mutationFn: async () => api.post('/expenses', { ...form, amount: Number(form.amount) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['expenses'] }); onClose(); },
  });
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel slide-up" onClick={e => e.stopPropagation()}>
        <div className="modal-header"><h2>Log Expense</h2><button className="btn-round" onClick={onClose}><X size={16} /></button></div>
        <form className="modal-form" onSubmit={e => { e.preventDefault(); mutation.mutate(); }}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Category</label>
              <select className="input-field" value={form.category} onChange={set('category')}>
                {Object.keys(EXPENSE_COLORS).map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group"><label className="form-label">Amount (₹)</label><input className="input-field" type="number" value={form.amount} onChange={set('amount')} required /></div>
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="input-field" style={{ height: 70, resize: 'vertical' }} value={form.description} onChange={set('description')} placeholder="Brief description..." />
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-ghost btn-pill" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-pill" disabled={mutation.isPending}>{mutation.isPending ? 'Saving...' : 'Log Expense'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main Page ──
export default function FuelPage() {
  const [activeTab, setActiveTab] = useState<'fuel' | 'expenses'>('fuel');
  const [modal, setModal] = useState<'fuel' | 'expense' | null>(null);

  const { data: fuelData, isLoading: fuelLoading } = useQuery<{ data: FuelLog[]; total: number }>({
    queryKey: ['fuel'],
    queryFn: async () => { const { data } = await api.get('/fuel?limit=100'); return data; },
  });
  const { data: expData, isLoading: expLoading } = useQuery<{ data: Expense[]; total: number }>({
    queryKey: ['expenses'],
    queryFn: async () => { const { data } = await api.get('/expenses?limit=100'); return data; },
  });

  const fuels = fuelData?.data ?? [];
  const expenses = expData?.data ?? [];

  const totalFuelCost = fuels.reduce((s, f) => s + f.totalCost, 0);
  const totalLiters = fuels.reduce((s, f) => s + f.quantity, 0);
  const avgCostPerL = totalLiters > 0 ? totalFuelCost / totalLiters : 0;
  const anomalies = fuels.filter(f => f.isAnomaly).length;

  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const expByCategory = Object.entries(
    expenses.reduce((acc, e) => { acc[e.category] = (acc[e.category] ?? 0) + e.amount; return acc; }, {} as Record<string, number>)
  ).map(([name, value]) => ({ name, value }));

  // Fake trend data
  const fuelTrend = Array.from({ length: 8 }, (_, i) => ({
    week: `W${i + 1}`, cost: 60000 + Math.random() * 40000 | 0,
  }));

  return (
    <div className="fuel-page page-enter">
      <div className="page-header">
        <div>
          <h1 className="text-h1"><Fuel size={24} className="text-accent" /> FUEL &amp; EXPENSES</h1>
          <p className="text-secondary">
            Financial tracking center
          </p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--sp-2)' }}>
          <button className="btn btn-ghost btn-pill sm" onClick={() => setModal('expense')}><Plus size={13} /> Expense</button>
          <button className="btn btn-pill sm" onClick={() => setModal('fuel')}><Plus size={13} /> Log Fuel</button>
        </div>
      </div>

      {/* Tabs */}
      <div className="fuel-tabs">
        <button className={`fuel-tab ${activeTab === 'fuel' ? 'active' : ''}`} onClick={() => setActiveTab('fuel')}>
          <Fuel size={14} /> Fuel Logs
        </button>
        <button className={`fuel-tab ${activeTab === 'expenses' ? 'active' : ''}`} onClick={() => setActiveTab('expenses')}>
          <CreditCard size={14} /> Expenses
        </button>
      </div>

      {/* Fuel Tab */}
      {activeTab === 'fuel' && (
        <>
          <div className="fuel-kpi-row">
            <div className="fuel-kpi neu-card no-hover">
              <div className="fk-label">Total Volume</div>
              <div className="fk-value text-mono">{totalLiters.toFixed(0)} L</div>
              <div className="fk-sub">this month</div>
            </div>
            <div className="fuel-kpi neu-card no-hover">
              <div className="fk-label">Total Cost</div>
              <div className="fk-value text-mono">₹{(totalFuelCost / 1000).toFixed(1)}K</div>
              <div className="fk-sub">this month</div>
            </div>
            <div className="fuel-kpi neu-card no-hover">
              <div className="fk-label">Avg Cost/Liter</div>
              <div className="fk-value text-mono">₹{avgCostPerL.toFixed(2)}</div>
              <div className="fk-sub">average</div>
            </div>
            <div className="fuel-kpi neu-card no-hover" style={{ borderLeft: `3px solid ${anomalies > 0 ? 'var(--accent-danger)' : 'var(--accent-success)'}` }}>
              <div className="fk-label">Anomalies</div>
              <div className="fk-value text-mono" style={{ color: anomalies > 0 ? 'var(--accent-danger)' : 'var(--accent-success)' }}>{anomalies}</div>
              <div className="fk-sub">detected</div>
            </div>
          </div>

          <div className="fuel-table-wrap neu-card no-hover">
            <div className="chart-title" style={{ marginBottom: 'var(--sp-3)' }}>Fuel Log</div>
            {fuelLoading ? <div className="skeleton" style={{ height: 200 }} /> : (
              <table className="data-table">
                <thead><tr><th>Date</th><th>Vehicle</th><th>Quantity</th><th>Rate</th><th>Total</th><th>Odometer</th><th>Station</th><th>Flag</th></tr></thead>
                <tbody>
                  {fuels.map(f => (
                    <tr key={f.id} className={f.isAnomaly ? 'row-anomaly' : ''}>
                      <td>{new Date(f.createdAt).toLocaleDateString()}</td>
                      <td className="text-mono">{f.vehicle?.registrationNumber ?? '—'}</td>
                      <td className="text-mono">{f.quantity} L</td>
                      <td className="text-mono">₹{f.costPerUnit}</td>
                      <td className="text-mono">₹{f.totalCost.toFixed(0)}</td>
                      <td className="text-mono">{f.odometer.toLocaleString()}</td>
                      <td>{f.station ?? '—'}</td>
                      <td>{f.isAnomaly ? <span className="badge cancelled"><AlertTriangle size={10} /> Anomaly</span> : <span className="badge available">OK</span>}</td>
                    </tr>
                  ))}
                  {fuels.length === 0 && <tr><td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>No fuel logs yet</td></tr>}
                </tbody>
              </table>
            )}
          </div>

          <div className="fuel-chart-row">
            <div className="neu-card no-hover" style={{ flex: 1 }}>
              <div className="chart-title">Weekly Fuel Cost Trend</div>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={fuelTrend} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--neu-dark)" opacity={0.5} />
                  <XAxis dataKey="week" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                  <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} tickFormatter={v => `₹${v/1000}K`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="cost" name="Fuel Cost" stroke="var(--accent-primary)" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}

      {/* Expenses Tab */}
      {activeTab === 'expenses' && (
        <>
          <div className="fuel-kpi-row">
            <div className="fuel-kpi neu-card no-hover">
              <div className="fk-label">Total Expenses</div>
              <div className="fk-value text-mono">₹{(totalExpenses / 1000).toFixed(1)}K</div>
            </div>
            <div className="fuel-kpi neu-card no-hover">
              <div className="fk-label">Top Category</div>
              <div className="fk-value" style={{ fontSize: 'var(--text-h3)' }}>
                {expByCategory.sort((a,b) => b.value - a.value)[0]?.name ?? '—'}
              </div>
            </div>
            <div className="fuel-kpi neu-card no-hover">
              <div className="fk-label">Total Records</div>
              <div className="fk-value text-mono">{expData?.total ?? 0}</div>
            </div>
          </div>

          <div className="exp-layout">
            <div className="fuel-table-wrap neu-card no-hover" style={{ flex: 2 }}>
              <div className="chart-title" style={{ marginBottom: 'var(--sp-3)' }}>Expense Log</div>
              {expLoading ? <div className="skeleton" style={{ height: 200 }} /> : (
                <table className="data-table">
                  <thead><tr><th>Date</th><th>Category</th><th>Amount</th><th>Description</th><th>Trip</th></tr></thead>
                  <tbody>
                    {expenses.map(e => (
                      <tr key={e.id}>
                        <td>{new Date(e.createdAt).toLocaleDateString()}</td>
                        <td><span className="exp-cat-badge" style={{ background: `${EXPENSE_COLORS[e.category]}20`, color: EXPENSE_COLORS[e.category] }}>{e.category}</span></td>
                        <td className="text-mono">₹{e.amount.toLocaleString()}</td>
                        <td>{e.description ?? '—'}</td>
                        <td className="text-mono">{e.trip?.tripNumber ?? '—'}</td>
                      </tr>
                    ))}
                    {expenses.length === 0 && <tr><td colSpan={5} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>No expenses logged</td></tr>}
                  </tbody>
                </table>
              )}
            </div>

            {expByCategory.length > 0 && (
              <div className="neu-card no-hover" style={{ flex: 1, minWidth: 220 }}>
                <div className="chart-title">By Category</div>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={expByCategory} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                      {expByCategory.map((e, i) => <Cell key={i} fill={EXPENSE_COLORS[e.name] ?? 'var(--text-muted)'} />)}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="chart-legend" style={{ gridTemplateColumns: '1fr' }}>
                  {expByCategory.map(e => (
                    <div key={e.name} className="legend-item">
                      <span className="legend-dot" style={{ background: EXPENSE_COLORS[e.name] }} />
                      <span>{e.name}</span>
                      <span className="legend-val text-mono">₹{(e.value/1000).toFixed(1)}K</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {modal === 'fuel' && <FuelLogModal onClose={() => setModal(null)} />}
      {modal === 'expense' && <ExpenseModal onClose={() => setModal(null)} />}
    </div>
  );
}
