import { useState } from 'react';
import { FileBarChart, Download, Calendar, FileText, Truck, Users, Route, Fuel, CreditCard, Wrench, TrendingUp, X } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '../../lib/api';
import './ReportsPage.css';

interface ReportType {
  id: string; title: string; description: string;
  icon: React.ElementType; color: string;
}

const REPORTS: ReportType[] = [
  { id: 'fleet',       title: 'Fleet Summary',       description: 'All vehicles stats, utilization, and health scores',  icon: Truck,        color: 'var(--accent-primary)' },
  { id: 'vehicle',     title: 'Vehicle Report',       description: 'Deep dive on a single vehicle with full history',      icon: FileText,     color: 'var(--accent-info)' },
  { id: 'driver',      title: 'Driver Performance',   description: 'Safety scores, trip counts, and alert history',         icon: Users,        color: 'var(--accent-success)' },
  { id: 'trip',        title: 'Trip Report',          description: 'Trip details with route map and financial summary',     icon: Route,        color: 'var(--accent-warning)' },
  { id: 'fuel',        title: 'Fuel Consumption',     description: 'Fuel trends, anomalies, and cost breakdown',           icon: Fuel,         color: 'var(--accent-danger)' },
  { id: 'expense',     title: 'Expense Report',       description: 'Expenses by category and period',                      icon: CreditCard,   color: 'hsl(280,60%,55%)' },
  { id: 'maintenance', title: 'Maintenance History',  description: 'All maintenance records by vehicle or fleet-wide',     icon: Wrench,       color: 'hsl(200,60%,48%)' },
  { id: 'roi',         title: 'ROI Analysis',         description: 'Revenue vs cost per vehicle profitability report',      icon: TrendingUp,   color: 'var(--accent-success)' },
];

function GenerateModal({ report, onClose }: { report: ReportType; onClose: () => void }) {
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [generating, setGenerating] = useState(false);
  const [done, setDone] = useState(false);

  const { data: vData } = useQuery<{ data: Array<{ id: string; registrationNumber: string }> }>({
    queryKey: ['vehicles-short'], queryFn: async () => { const { data } = await api.get('/vehicles?limit=100'); return data; },
    enabled: report.id === 'vehicle',
  });

  const generate = async () => {
    setGenerating(true);
    await new Promise(r => setTimeout(r, 1800));
    setGenerating(false);
    setDone(true);
  };

  const downloadCSV = () => {
    const csvData = [
      ['Report', 'Generated', 'Period'],
      [report.title, new Date().toLocaleString(), `${dateFrom} to ${dateTo}`],
    ].map(r => r.join(',')).join('\n');
    const blob = new Blob([csvData], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `${report.id}-report.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel slide-up" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
            <div className="report-icon-sm" style={{ background: `${report.color}20` }}>
              <report.icon size={16} color={report.color} />
            </div>
            <h2>{report.title}</h2>
          </div>
          <button className="btn-round" onClick={onClose}><X size={16} /></button>
        </div>
        <div className="modal-form">
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">From Date</label>
              <input className="input-field" type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">To Date</label>
              <input className="input-field" type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} />
            </div>
          </div>
          {report.id === 'vehicle' && (
            <div className="form-group">
              <label className="form-label">Vehicle</label>
              <select className="input-field">
                <option value="">All vehicles</option>
                {vData?.data.map(v => <option key={v.id}>{v.registrationNumber}</option>)}
              </select>
            </div>
          )}
        </div>

        {done ? (
          <div className="report-done-area slide-up">
            <div className="report-preview-stub">
              <FileBarChart size={40} color={report.color} />
              <div className="rp-title">{report.title}</div>
              <div className="rp-meta">Generated {new Date().toLocaleString()}</div>
              <div className="rp-row">Period: {dateFrom || 'All time'} → {dateTo || 'Now'}</div>
            </div>
            <div style={{ display: 'flex', gap: 'var(--sp-2)', justifyContent: 'center' }}>
              <button className="btn btn-ghost btn-pill" onClick={downloadCSV}><Download size={14} /> Download CSV</button>
              <button className="btn btn-pill" onClick={downloadCSV}><Download size={14} /> Download PDF</button>
            </div>
          </div>
        ) : (
          <div className="modal-footer">
            <button type="button" className="btn btn-ghost btn-pill" onClick={onClose}>Cancel</button>
            <button className="btn btn-pill" onClick={generate} disabled={generating}>
              {generating ? <><div className="btn-spinner" /> Generating...</> : <><FileBarChart size={14} /> Generate Report</>}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ReportsPage() {
  const [activeReport, setActiveReport] = useState<ReportType | null>(null);

  return (
    <div className="reports-page page-enter">
      <div className="page-header">
        <div>
          <h1 className="text-h1"><FileBarChart size={24} className="text-accent" /> REPORTS CENTER</h1>
          <p className="text-secondary">
            Generate and export fleet intelligence reports
          </p>
        </div>
      </div>

      <div className="reports-grid">
        {REPORTS.map(r => (
          <div key={r.id} className="report-card neu-card slide-up" onClick={() => setActiveReport(r)}>
            <div className="report-icon-wrap" style={{ background: `${r.color}15` }}>
              <r.icon size={28} color={r.color} />
            </div>
            <div className="report-info">
              <div className="report-title">{r.title}</div>
              <div className="report-desc">{r.description}</div>
            </div>
            <button className="btn btn-ghost btn-pill sm" style={{ marginTop: 'auto', alignSelf: 'flex-start' }}>
              <FileBarChart size={13} /> Generate
            </button>
          </div>
        ))}
      </div>

      {activeReport && <GenerateModal report={activeReport} onClose={() => setActiveReport(null)} />}
    </div>
  );
}
