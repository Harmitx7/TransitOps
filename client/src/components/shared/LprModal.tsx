import { useState, useRef, useEffect } from 'react';
import { Camera, Zap, Play, X } from 'lucide-react';
import { useLprStore } from '../../store/useLprStore';

export function LprModal() {
  const { isOpen, closeLpr } = useLprStore();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<{ plate: string; confidence: number; matched: boolean } | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setScanning(false);
      setResult(null);
      return;
    }
    let stream: MediaStream | null = null;
    navigator.mediaDevices.getUserMedia({ video: true })
      .then(s => {
        stream = s;
        if (videoRef.current) videoRef.current.srcObject = stream;
      })
      .catch(err => console.error("Webcam error:", err));
    return () => {
      if (stream) stream.getTracks().forEach(t => t.stop());
    };
  }, [isOpen]);

  const demoScan = () => {
    setScanning(true);
    setResult(null);
    setTimeout(() => {
      setResult({ plate: 'GJ01AB1234', confidence: 94, matched: true });
      setScanning(false);
    }, 2000);
  };

  if (!isOpen) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div className="lpr-section neu-card no-hover" style={{ width: '100%', maxWidth: '500px', position: 'relative', background: 'var(--bg-base)', border: '1px solid var(--neu-light)' }}>
        <button onClick={closeLpr} style={{ position: 'absolute', top: '16px', right: '16px', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', zIndex: 10 }}>
          <X size={20} />
        </button>
        <div className="lpr-header" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Camera size={18} color="var(--accent-primary)" />
          <h3 className="lpr-title" style={{ margin: 0, fontSize: 'var(--text-h3)', fontWeight: 700 }}>License Plate Scanner</h3>
        </div>

        <div className="lpr-frame-area" style={{ marginTop: '16px' }}>
          <div className="lpr-frame" style={{ position: 'relative', width: '100%', aspectRatio: '2/1', background: 'var(--bg-sunken)', borderRadius: 'var(--r-inner)', overflow: 'hidden' }}>
            <div className="lpr-corner tl" style={{ position: 'absolute', top: 8, left: 8, width: 20, height: 20, borderTop: '2px solid var(--accent-primary)', borderLeft: '2px solid var(--accent-primary)', zIndex: 2 }} />
            <div className="lpr-corner tr" style={{ position: 'absolute', top: 8, right: 8, width: 20, height: 20, borderTop: '2px solid var(--accent-primary)', borderRight: '2px solid var(--accent-primary)', zIndex: 2 }} />
            <div className="lpr-corner bl" style={{ position: 'absolute', bottom: 8, left: 8, width: 20, height: 20, borderBottom: '2px solid var(--accent-primary)', borderLeft: '2px solid var(--accent-primary)', zIndex: 2 }} />
            <div className="lpr-corner br" style={{ position: 'absolute', bottom: 8, right: 8, width: 20, height: 20, borderBottom: '2px solid var(--accent-primary)', borderRight: '2px solid var(--accent-primary)', zIndex: 2 }} />
            {scanning && <div className="lpr-scan-line" style={{ position: 'absolute', left: 0, right: 0, height: 2, background: 'var(--accent-primary)', boxShadow: '0 0 8px var(--accent-primary)', animation: 'scan 2s ease-in-out infinite', zIndex: 2 }} />}
            
            <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0 }} />
            
            <div className="lpr-placeholder" style={{ zIndex: 1, textShadow: '0 0 4px #000', pointerEvents: 'none', position: 'absolute', bottom: '16px', left: 0, right: 0, textAlign: 'center' }}>
              <span style={{ color: '#fff', fontWeight: 700, fontSize: 'var(--text-xs)' }}>Align plate within frame</span>
            </div>
          </div>
        </div>

        <div className="lpr-controls" style={{ marginTop: '16px', display: 'flex', justifyContent: 'center' }}>
          <button className="btn btn-pill orange" onClick={demoScan} disabled={scanning} style={{ background: 'var(--accent-primary)', color: '#fff', border: 'none' }}>
            {scanning ? <><Zap size={14} /> Scanning...</> : <><Play size={14} /> Scan Plate</>}
          </button>
        </div>

        {result && (
          <div className="lpr-result slide-up" style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div className="lpr-result-plate text-mono" style={{ fontSize: '1.8rem', fontWeight: 700, textAlign: 'center', letterSpacing: '0.1em' }}>{result.plate}</div>
            <div className="lpr-confidence" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
              <span>Confidence</span>
              <div className="progress-track" style={{ flex: 1, height: 4, background: 'var(--bg-sunken)', borderRadius: 2 }}>
                <div className="progress-fill" style={{ width: `${result.confidence}%`, background: 'var(--accent-success)', height: '100%', borderRadius: 2 }} />
              </div>
              <span className="text-mono">{result.confidence}%</span>
            </div>
            {result.matched && (
              <div className="lpr-matched badge available" style={{ display: 'flex', justifyContent: 'center', background: 'var(--accent-success)', color: '#fff' }}>
                ✓ Matched: GJ-01-AB-1234 · Tata Ace · Available
              </div>
            )}
            <div className="lpr-actions" style={{ marginTop: '16px', display: 'flex', gap: '8px', justifyContent: 'center' }}>
              <button className="btn btn-ghost btn-pill sm" onClick={closeLpr}>Log Entry</button>
              <button className="btn btn-pill sm" onClick={closeLpr}>Log Exit</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
