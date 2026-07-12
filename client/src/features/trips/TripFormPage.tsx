import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, X } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';

export default function TripFormPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [form, setForm] = useState({
    source: '', destination: '', scheduledStart: '',
    vehicleId: '', driverId: '', cargoType: '', cargoWeight: '',
    distancePlanned: '', revenue: '', notes: '',
  });
  const [error, setError] = useState('');

  const { data: vData } = useQuery<{ data: Array<{ id: string; registrationNumber: string; make: string; model: string }> }>({
    queryKey: ['vehicles-short'], queryFn: async () => { const { data } = await api.get('/vehicles?status=AVAILABLE&limit=100'); return data; },
  });
  const { data: dData } = useQuery<{ data: Array<{ id: string; firstName: string; lastName: string }> }>({
    queryKey: ['drivers-short'], queryFn: async () => { const { data } = await api.get('/drivers?status=AVAILABLE&limit=100'); return data; },
  });

  const mutation = useMutation({
    mutationFn: async () => api.post('/trips', {
      source: form.source, destination: form.destination,
      scheduledStart: form.scheduledStart || undefined,
      vehicleId: form.vehicleId || undefined,
      driverId: form.driverId || undefined,
      cargoType: form.cargoType || undefined,
      cargoWeight: form.cargoWeight ? Number(form.cargoWeight) : undefined,
      distancePlanned: form.distancePlanned ? Number(form.distancePlanned) : undefined,
      revenue: form.revenue ? Number(form.revenue) : undefined,
      notes: form.notes || undefined,
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['trips'] }); navigate('/trips'); },
    onError: (e: any) => setError(e?.response?.data?.message ?? 'Failed to create trip'),
  });

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  return (
    <div className="page-enter" style={{ padding: 'var(--sp-5)', maxWidth: 700 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-3)', marginBottom: 'var(--sp-5)' }}>
        <button className="btn btn-ghost btn-pill sm" onClick={() => navigate('/trips')}><ArrowLeft size={14}/> Back</button>
        <h1 className="text-h1">New Trip</h1>
      </div>

      <form className="modal-form" style={{ background: 'var(--bg-surface)', borderRadius: 'var(--r-card)', boxShadow: 'var(--neu-raised)', padding: 'var(--sp-5)' }}
        onSubmit={e => { e.preventDefault(); mutation.mutate(); }}>
        {error && <div className="form-error">{error}</div>}

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Origin</label>
            <input className="input-field" value={form.source} onChange={set('source')} required placeholder="Ahmedabad" />
          </div>
          <div className="form-group">
            <label className="form-label">Destination</label>
            <input className="input-field" value={form.destination} onChange={set('destination')} required placeholder="Mumbai" />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Vehicle</label>
            <select className="input-field" value={form.vehicleId} onChange={set('vehicleId')}>
              <option value="">Unassigned</option>
              {vData?.data.map(v => <option key={v.id} value={v.id}>{v.registrationNumber} — {v.make} {v.model}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Driver</label>
            <select className="input-field" value={form.driverId} onChange={set('driverId')}>
              <option value="">Unassigned</option>
              {dData?.data.map(d => <option key={d.id} value={d.id}>{d.firstName} {d.lastName}</option>)}
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Scheduled Start</label>
            <input className="input-field" type="datetime-local" value={form.scheduledStart} onChange={set('scheduledStart')} />
          </div>
          <div className="form-group">
            <label className="form-label">Distance (km)</label>
            <input className="input-field" type="number" value={form.distancePlanned} onChange={set('distancePlanned')} placeholder="450" />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Cargo Type</label>
            <input className="input-field" value={form.cargoType} onChange={set('cargoType')} placeholder="General goods" />
          </div>
          <div className="form-group">
            <label className="form-label">Cargo Weight (T)</label>
            <input className="input-field" type="number" step="0.1" value={form.cargoWeight} onChange={set('cargoWeight')} placeholder="8.5" />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Revenue (₹)</label>
          <input className="input-field" type="number" value={form.revenue} onChange={set('revenue')} placeholder="25000" />
        </div>

        <div className="form-group">
          <label className="form-label">Notes</label>
          <textarea className="input-field" style={{ height: 80, resize: 'vertical' }} value={form.notes} onChange={set('notes')} placeholder="Special instructions..." />
        </div>

        <div style={{ display: 'flex', gap: 'var(--sp-2)', justifyContent: 'flex-end', paddingTop: 'var(--sp-3)', borderTop: '1px solid var(--neu-dark)' }}>
          <button type="button" className="btn btn-ghost btn-pill" onClick={() => navigate('/trips')}>Cancel</button>
          <button type="submit" className="btn btn-pill" disabled={mutation.isPending}>
            {mutation.isPending ? 'Creating...' : 'Create Trip'}
          </button>
        </div>
      </form>
    </div>
  );
}
