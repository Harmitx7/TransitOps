import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, XCircle, ClipboardList } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import './InspectionFormPage.css';

type ItemResult = 'PASS' | 'FAIL' | null;

const CHECKLIST_ITEMS = [
  'Engine Oil Level', 'Brake System', 'Tire Condition (all wheels)',
  'Headlights & Taillights', 'Turn Signals', 'Windshield & Wipers',
  'Horn', 'Mirrors', 'Seatbelts', 'Fire Extinguisher',
  'First Aid Kit', 'Reflective Triangles', 'Fluid Leaks', 'Body Damage',
];

export default function InspectionFormPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [vehicleId, setVehicleId] = useState('');
  const [inspectorName, setInspectorName] = useState('');
  const [results, setResults] = useState<Record<string, { result: ItemResult; notes: string }>>(
    Object.fromEntries(CHECKLIST_ITEMS.map(item => [item, { result: null, notes: '' }]))
  );
  const [error, setError] = useState('');

  const { data: vData } = useQuery<{ data: Array<{ id: string; registrationNumber: string; make: string; model: string }> }>({
    queryKey: ['vehicles-short'], queryFn: async () => { const { data } = await api.get('/vehicles?limit=100'); return data; },
  });

  const passedItems = Object.values(results).filter(r => r.result === 'PASS').length;
  const totalAnswered = Object.values(results).filter(r => r.result !== null).length;
  const allAnswered = totalAnswered === CHECKLIST_ITEMS.length;
  const anyFailed = Object.values(results).some(r => r.result === 'FAIL');
  const finalStatus = allAnswered ? (anyFailed ? 'FAILED' : 'PASSED') : null;

  const setResult = (item: string, result: ItemResult) =>
    setResults(r => ({ ...r, [item]: { ...r[item], result } }));
  const setNotes = (item: string, notes: string) =>
    setResults(r => ({ ...r, [item]: { ...r[item], notes } }));

  const mutation = useMutation({
    mutationFn: async () => api.post('/inspections', {
      vehicleId, inspectorName,
      passedItems, totalItems: CHECKLIST_ITEMS.length,
      status: finalStatus,
      items: Object.entries(results).map(([name, r]) => ({ name, result: r.result, notes: r.notes })),
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['inspections'] }); navigate('/inspections'); },
    onError: (e: any) => setError(e?.response?.data?.message ?? 'Failed to submit inspection'),
  });

  return (
    <div className="if-page page-enter">
      <div className="if-header">
        <button className="btn btn-ghost btn-pill sm" onClick={() => navigate('/inspections')}><ArrowLeft size={14}/> Back</button>
        <h1 className="text-h1"><ClipboardList size={20}/> Vehicle Inspection</h1>
      </div>

      {/* Setup */}
      <div className="if-setup neu-card no-hover">
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Vehicle</label>
            <select className="input-field" value={vehicleId} onChange={e => setVehicleId(e.target.value)} required>
              <option value="">Select vehicle...</option>
              {vData?.data.map(v => <option key={v.id} value={v.id}>{v.registrationNumber} — {v.make} {v.model}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Inspector Name</label>
            <input className="input-field" value={inspectorName} onChange={e => setInspectorName(e.target.value)} placeholder="Your name" />
          </div>
        </div>
      </div>

      {/* Progress */}
      <div className="if-progress-bar-wrap neu-card no-hover">
        <div className="if-progress-header">
          <span className="if-progress-label">Completion</span>
          <span className="if-progress-count text-mono">{totalAnswered}/{CHECKLIST_ITEMS.length} items</span>
          {finalStatus && (
            <span className={`badge ${finalStatus === 'PASSED' ? 'available' : 'cancelled'}`}>
              {finalStatus === 'PASSED' ? <CheckCircle2 size={11}/> : <XCircle size={11}/>} {finalStatus}
            </span>
          )}
        </div>
        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${(totalAnswered/CHECKLIST_ITEMS.length)*100}%`, background: anyFailed ? 'var(--accent-danger)' : 'var(--accent-success)' }}/>
        </div>
        <div className="if-pass-count">{passedItems} passed · {Object.values(results).filter(r=>r.result==='FAIL').length} failed · {CHECKLIST_ITEMS.length - totalAnswered} remaining</div>
      </div>

      {/* Checklist */}
      <div className="if-checklist neu-card no-hover">
        {CHECKLIST_ITEMS.map((item, i) => {
          const r = results[item];
          return (
            <div key={item} className={`if-item ${r.result === 'FAIL' ? 'failed' : r.result === 'PASS' ? 'passed' : ''}`}>
              <div className="if-item-header">
                <div className="if-item-num">{String(i+1).padStart(2,'0')}</div>
                <div className="if-item-name">{item}</div>
                <div className="if-item-btns">
                  <button
                    className={`if-result-btn pass ${r.result === 'PASS' ? 'active' : ''}`}
                    onClick={() => setResult(item, r.result === 'PASS' ? null : 'PASS')}>
                    <CheckCircle2 size={14}/> Pass
                  </button>
                  <button
                    className={`if-result-btn fail ${r.result === 'FAIL' ? 'active' : ''}`}
                    onClick={() => setResult(item, r.result === 'FAIL' ? null : 'FAIL')}>
                    <XCircle size={14}/> Fail
                  </button>
                </div>
              </div>
              {r.result === 'FAIL' && (
                <div className="if-notes-row">
                  <input className="input-field if-notes-input" value={r.notes}
                    onChange={e => setNotes(item, e.target.value)} placeholder="Describe the issue..." />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Submit */}
      {error && <div className="form-error">{error}</div>}
      <div className="if-submit-row">
        <div className="if-submit-summary">
          {allAnswered && (
            <span className={`badge ${finalStatus === 'PASSED' ? 'available' : 'cancelled'} badge-lg`}>
              {finalStatus === 'PASSED' ? '✓ All Clear — PASSED' : `⚠ ${Object.values(results).filter(r=>r.result==='FAIL').length} Failures — FAILED`}
            </span>
          )}
        </div>
        <button className="btn btn-pill" disabled={!vehicleId || !inspectorName || !allAnswered || mutation.isPending}
          onClick={() => mutation.mutate()}>
          {mutation.isPending ? 'Submitting...' : 'Submit Inspection'}
        </button>
      </div>
    </div>
  );
}
