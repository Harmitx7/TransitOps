import { useState, useRef, useEffect, useCallback } from 'react';
import { Eye, Camera, Zap, AlertTriangle, Play, Square, Plus, Minus } from 'lucide-react';
import './CvDashboardPage.css';

/* ── EAR calculation (Eye Aspect Ratio) ──────────────────────
   Using 6 landmark indices for each eye.
   EAR = (||p2-p6|| + ||p3-p5||) / (2 * ||p1-p4||)
   Threshold: 0.21 → < threshold for 60 frames = drowsy alert
───────────────────────────────────────────────────────────── */
function euclidean(a: { x: number; y: number }, b: { x: number; y: number }) {
  return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));
}

/* ── Mock EAR Simulator (demo mode, no real MediaPipe) ── */
function useMockEAR(): { ear: number; status: 'NORMAL' | 'DROWSY' | 'ALERT'; alertCount: number } {
  const [ear, setEar] = useState(0.28);
  const [alertCount, setAlertCount] = useState(0);
  const [status, setStatus] = useState<'NORMAL' | 'DROWSY' | 'ALERT'>('NORMAL');

  useEffect(() => {
    const id = setInterval(() => {
      const t = Date.now() / 1000;
      // Oscillating EAR with occasional dips
      const base = 0.28 + Math.sin(t * 0.8) * 0.04;
      const dip  = Math.sin(t * 0.25) < -0.8 ? 0.12 : 0;
      const newEar = Math.max(0.1, Math.min(0.4, base - dip + (Math.random() - 0.5) * 0.02));
      setEar(parseFloat(newEar.toFixed(3)));
      if (newEar < 0.18) {
        setStatus('ALERT');
        setAlertCount(c => c + 1);
      } else if (newEar < 0.21) {
        setStatus('DROWSY');
      } else {
        setStatus('NORMAL');
      }
    }, 100);
    return () => clearInterval(id);
  }, []);

  return { ear, status, alertCount };
}

/* ── Camera Feed (Demo Mode) ── */
function CameraFeed({ driverName, tripNumber, imgIndex, onRemove }: {
  driverName: string; tripNumber: string; imgIndex: number; onRemove: () => void;
}) {
  const { ear, status, alertCount } = useMockEAR();
  const r = 22; const circ = 2 * Math.PI * r;
  const safeScore = Math.max(0, 100 - alertCount * 5);
  const scoreColor = safeScore >= 80 ? 'var(--accent-success)' : safeScore >= 60 ? 'var(--accent-warning)' : 'var(--accent-danger)';

  const statusColor = status === 'ALERT' ? 'var(--accent-danger)' : status === 'DROWSY' ? 'var(--accent-warning)' : 'var(--accent-success)';

  return (
    <div className={`cam-feed neu-card no-hover ${status === 'ALERT' ? 'cam-alert' : status === 'DROWSY' ? 'cam-drowsy' : ''}`}
      style={{ '--status-color': statusColor } as React.CSSProperties}>
      {/* Header */}
      <div className="cam-header">
        <div className="cam-driver-info">
          <div className="cam-status-dot" style={{ background: statusColor, boxShadow: `0 0 8px ${statusColor}` }} />
          <span className="cam-driver-name">{driverName}</span>
          <span className="cam-trip text-mono">{tripNumber}</span>
        </div>
        <button className="btn-round cam-remove-btn" onClick={onRemove}><Minus size={12} /></button>
      </div>

      {/* Simulated video frame */}
      <div className="cam-video-area" style={{ position: 'relative' }}>
        <img src={`/assets/cam${(imgIndex % 4) + 1}.png`} alt="Live Feed" style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0, opacity: 0.8 }} />
        <div className="cam-face-sim">
          <div className="cam-face-oval" />
          {/* Eye indicators */}
          <div className="cam-eyes">
            <div className="cam-eye" style={{ height: Math.max(3, ear * 60), background: statusColor }} />
            <div className="cam-eye" style={{ height: Math.max(3, ear * 60), background: statusColor }} />
          </div>
          {/* Grid overlay */}
          <div className="cam-grid-overlay" />
        </div>
        {/* EAR readout */}
        <div className="cam-ear-overlay">
          <span className="cam-ear-label">EAR</span>
          <span className="cam-ear-val text-mono" style={{ color: statusColor }}>{ear.toFixed(3)}</span>
        </div>
        {/* Status banner */}
        {status !== 'NORMAL' && (
          <div className="cam-status-banner" style={{ background: statusColor }}>
            <AlertTriangle size={14} /> {status === 'ALERT' ? '⚠ DROWSINESS DETECTED' : '⚡ DROWSY'}
          </div>
        )}
      </div>

      {/* Bottom metrics */}
      <div className="cam-metrics">
        <div className="cam-metric">
          <span className="cam-metric-label">Status</span>
          <span className="cam-metric-val" style={{ color: statusColor }}>{status}</span>
        </div>
        <div className="cam-metric">
          <span className="cam-metric-label">Alerts</span>
          <span className="cam-metric-val text-mono" style={{ color: alertCount > 0 ? 'var(--accent-danger)' : 'var(--accent-success)' }}>{alertCount}</span>
        </div>
        {/* Safety score ring */}
        <div style={{ position: 'relative', width: 54, height: 54, flexShrink: 0 }}>
          <svg width={54} height={54} style={{ transform: 'rotate(-90deg)' }}>
            <circle cx={27} cy={27} r={r} fill="none" stroke="var(--bg-sunken)" strokeWidth={6} />
            <circle cx={27} cy={27} r={r} fill="none" stroke={scoreColor} strokeWidth={6}
              strokeDasharray={`${(safeScore / 100) * circ} ${circ}`} strokeLinecap="round"
              style={{ transition: 'stroke-dasharray 0.5s ease' }} />
          </svg>
          <span style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', fontSize: '10px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: scoreColor }}>{safeScore}</span>
        </div>
      </div>
    </div>
  );
}

/* ── LPR Section ── */
function LprSection() {
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<{ plate: string; confidence: number; matched: boolean } | null>(null);

  const demoScan = () => {
    setScanning(true);
    setResult(null);
    setTimeout(() => {
      setResult({ plate: 'GJ01AB1234', confidence: 94, matched: true });
      setScanning(false);
    }, 2000);
  };

  return (
    <div className="lpr-section neu-card no-hover">
      <div className="lpr-header">
        <Camera size={18} color="var(--accent-primary)" />
        <h3 className="lpr-title">License Plate Recognition</h3>
      </div>

      <div className="lpr-frame-area">
        <div className="lpr-frame">
          <div className="lpr-corner tl" /><div className="lpr-corner tr" />
          <div className="lpr-corner bl" /><div className="lpr-corner br" />
          {scanning && <div className="lpr-scan-line" />}
          <div className="lpr-placeholder">
            <Camera size={32} color="var(--text-muted)" />
            <span>Align plate within frame</span>
          </div>
        </div>
      </div>

      <div className="lpr-controls">
        <button className="btn btn-pill" onClick={demoScan} disabled={scanning}>
          {scanning ? <><Zap size={14} /> Scanning...</> : <><Play size={14} /> Demo Scan</>}
        </button>
      </div>

      {result && (
        <div className="lpr-result slide-up">
          <div className="lpr-result-plate text-mono">{result.plate}</div>
          <div className="lpr-confidence">
            <span>Confidence</span>
            <div className="progress-track" style={{ flex: 1 }}>
              <div className="progress-fill" style={{ width: `${result.confidence}%`, background: 'var(--accent-success)' }} />
            </div>
            <span className="text-mono">{result.confidence}%</span>
          </div>
          {result.matched && (
            <div className="lpr-matched badge available">
              ✓ Matched: GJ-01-AB-1234 · Tata Ace · Available
            </div>
          )}
          <div className="lpr-actions">
            <button className="btn btn-ghost btn-pill sm">Log Entry</button>
            <button className="btn btn-pill sm">Log Exit</button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Mock drivers for feeds ── */
const MOCK_FEEDS = [
  { driverName: 'Rajesh Yadav', tripNumber: 'TRP-0041', imgIndex: 0 },
  { driverName: 'Suresh Patel', tripNumber: 'TRP-0042', imgIndex: 1 },
  { driverName: 'Amit Singh', tripNumber: 'TRP-0043', imgIndex: 2 },
  { driverName: 'Manoj Kumar', tripNumber: 'TRP-0044', imgIndex: 3 },
];

/* ── Main Page ── */
export default function CvDashboardPage() {
  const [feeds, setFeeds] = useState(MOCK_FEEDS);

  const addFeed = () => {
    if (feeds.length >= 6) return;
    setFeeds(f => [...f, { driverName: `Driver ${f.length + 1}`, tripNumber: `TRP-00${43 + f.length}`, imgIndex: f.length }]);
  };

  return (
    <div className="cv-page page-enter">
      <div className="page-header">
        <div>
          <h1 className="text-h1">
            <Eye size={22} className="text-accent" /> SAFETY MONITOR
          </h1>
          <p className="text-secondary">
            Real-time drowsiness detection · {feeds.length} active feed{feeds.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button className="btn btn-pill" onClick={addFeed} disabled={feeds.length >= 6}>
          <Plus size={14} /> ADD FEED
        </button>
      </div>

      <div className="cv-layout">
        {/* Camera Grid */}
        <div className="cv-feeds">
          <h2 className="cv-section-title"><Camera size={14} /> Drowsiness Monitor</h2>
          <div className="cam-grid">
            {feeds.map((f, i) => (
              <CameraFeed key={i} {...f} onRemove={() => setFeeds(feeds.filter((_, j) => j !== i))} />
            ))}
            {feeds.length === 0 && (
              <div className="empty-state neu-card no-hover">
                <Eye size={48} color="var(--text-muted)" />
                <p>No active camera feeds</p>
                <button className="btn btn-pill sm" onClick={addFeed}><Plus size={13} /> Add Feed</button>
              </div>
            )}
          </div>
        </div>

        {/* LPR Panel */}
        <div className="cv-lpr">
          <h2 className="cv-section-title"><Camera size={14} /> LPR Scanner</h2>
          <LprSection />
        </div>
      </div>
    </div>
  );
}
