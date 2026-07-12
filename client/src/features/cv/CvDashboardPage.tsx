import { useState, useEffect } from 'react';
import { Eye, Camera, Plus, Minus } from 'lucide-react';
import { useLprStore } from '../../store/useLprStore';
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
function useMockEAR(isCam1: boolean): { ear: number; status: 'NORMAL' | 'DROWSY' | 'ALERT'; alertCount: number } {
  const [ear, setEar] = useState(isCam1 ? 0.28 : 0.35);
  const [alertCount, setAlertCount] = useState(0);
  const [status, setStatus] = useState<'NORMAL' | 'DROWSY' | 'ALERT'>('NORMAL');

  useEffect(() => {
    const id = setInterval(() => {
      const t = Date.now() / 1000;
      if (isCam1) {
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
      } else {
        const base = 0.35 + Math.sin(t * 0.5) * 0.02;
        setEar(parseFloat(base.toFixed(3)));
        setStatus('NORMAL');
      }
    }, 100);
    return () => clearInterval(id);
  }, [isCam1]);

  return { ear, status, alertCount };
}

/* ── Camera Feed (Demo Mode) ── */
function CameraFeed({ driverName, tripNumber, imgIndex, onRemove }: {
  driverName: string; tripNumber: string; imgIndex: number; onRemove: () => void;
}) {
  const isCam1 = imgIndex === 0;
  const { ear, status, alertCount } = useMockEAR(isCam1);
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
        <img src={`/assets/cam${(imgIndex % 4) + 1}.png`} alt="Live Feed" style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0, opacity: 0.8, filter: 'contrast(1.1) brightness(0.9) saturate(0.85)' }} />
        
        <div className="cv-noise" />

        <div className="cv-hud">
          <div className="cv-hud-top">
            <span className="cv-live-dot" style={{ background: statusColor, boxShadow: `0 0 6px ${statusColor}` }} />
            <span className="text-mono cv-hud-time">PTZ: {Math.floor(80 + Math.random() * 10)}° P / {Math.floor(10 + Math.random() * 5)}° T</span>
          </div>
          
          <div className="cv-ptz-crosshair">
            <div className="cv-ptz-h" />
            <div className="cv-ptz-v" />
            <div className="cv-ptz-center" />
          </div>

          <div className="cam-face-sim">
            <div className="cam-face-oval" style={{ borderColor: statusColor, boxShadow: `inset 0 0 10px ${statusColor}` }} />
            {/* Eye indicators */}
            <div className="cam-eyes">
              <div className="cam-eye" style={{ height: Math.max(3, ear * 60), background: statusColor }} />
              <div className="cam-eye" style={{ height: Math.max(3, ear * 60), background: statusColor }} />
            </div>
          </div>

          {/* EAR readout */}
          <div className="cam-ear-overlay">
            <span className="cam-ear-label">EAR</span>
            <span className="cam-ear-val text-mono" style={{ color: statusColor }}>{ear.toFixed(3)}</span>
          </div>

          {/* Corner brackets */}
          <div className="cv-brackets">
            <div className="cb tl" />
            <div className="cb tr" />
            <div className="cb bl" />
            <div className="cb br" />
          </div>
        </div>

        {/* Status banner */}
        {status !== 'NORMAL' && (
          <div className="cam-status-banner cv-blink-fast" style={{ background: statusColor, color: '#fff', textShadow: 'none' }}>
            <AlertTriangle size={14} /> {status === 'ALERT' ? '⚠ DROWSINESS DETECTED' : '⚡ DROWSY'}
          </div>
        )}

        <div className="cv-scanline" />
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
  const { openLpr } = useLprStore();

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
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-pill" style={{ background: '#F97316', color: '#fff', border: 'none' }} onClick={() => openLpr()}>
            <Camera size={14} /> SCAN PLATE
          </button>
          <button className="btn btn-pill" onClick={addFeed} disabled={feeds.length >= 6}>
            <Plus size={14} /> ADD FEED
          </button>
        </div>
      </div>

      <div className="cv-layout">
        {/* Camera Grid */}
        <div className="cv-feeds">
          <h2 className="cv-section-title"><Eye size={14} /> Driver Monitoring System</h2>
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
      </div>
    </div>
  );
}
