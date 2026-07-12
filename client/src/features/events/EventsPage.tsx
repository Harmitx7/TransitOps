import { useState } from 'react';
import { Bell, CheckCheck, Wrench, Fuel, Route, AlertTriangle, Info, Settings, Video, Camera } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import './EventsPage.css';

interface EventData {
  id: string; type: string; title: string; message: string; isRead: boolean; createdAt: string; hasEvidence?: boolean;
}

const TYPE_ICON: Record<string, React.ElementType> = {
  LICENSE_EXPIRY: AlertTriangle,
  MAINTENANCE_DUE: Wrench,
  FUEL_ANOMALY: Fuel,
  TRIP_UPDATE: Route,
  SYSTEM: Info,
  CV_ALERT: Camera,
};

const TYPE_COLOR: Record<string, string> = {
  LICENSE_EXPIRY: 'var(--accent-warning)',
  MAINTENANCE_DUE: 'var(--accent-info)',
  FUEL_ANOMALY: 'var(--accent-danger)',
  TRIP_UPDATE: 'var(--accent-success)',
  SYSTEM: 'var(--text-secondary)',
  CV_ALERT: 'var(--accent-danger)',
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'just now';
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  return `${Math.floor(hr / 24)}d ago`;
}

const FILTER_TABS = ['ALL', 'UNREAD', 'CRITICAL', 'MAINTENANCE', 'OPERATIONS'] as const;
type FilterTab = typeof FILTER_TABS[number];

export default function EventsPage() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<FilterTab>('ALL');

  const { data, isLoading } = useQuery<{ notifications: EventData[]; total: number; unread: number }>({
    queryKey: ['notifications'],
    queryFn: async () => { 
      const { data } = await api.get('/notifications?limit=100'); 
      // Inject some mock CV events to demonstrate the camera evidence requirement
      data.notifications = [
        { id: 'ev-1', type: 'CV_ALERT', title: 'Drowsiness Detected', message: 'Driver fatigue signs detected via cabin camera.', isRead: false, createdAt: new Date().toISOString(), hasEvidence: true },
        { id: 'ev-2', type: 'FUEL_ANOMALY', title: 'Fuel Drop Detected', message: 'Sudden 12% drop in tank level on VEH-104.', isRead: false, createdAt: new Date(Date.now() - 3600000).toISOString(), hasEvidence: true },
        ...(data.data || [])
      ];
      data.unread = (data.unreadCount || 0) + 2;
      return data;
    },
  });

  const markRead = useMutation({
    mutationFn: async (id: string) => {
      if (id.startsWith('ev-')) return Promise.resolve(); // mock local update
      return api.patch(`/notifications/${id}/read`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });
  
  const markAllRead = useMutation({
    mutationFn: async () => api.patch('/notifications/read-all'),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const events = (data?.notifications ?? []).filter(n => {
    if (filter === 'UNREAD') return !n.isRead;
    if (filter === 'ALL') return true;
    if (filter === 'CRITICAL') return n.type === 'CV_ALERT' || n.type === 'FUEL_ANOMALY';
    if (filter === 'MAINTENANCE') return n.type === 'MAINTENANCE_DUE';
    if (filter === 'OPERATIONS') return n.type === 'TRIP_UPDATE' || n.type === 'LICENSE_EXPIRY';
    return true;
  });

  const unread = data?.unread ?? 0;

  return (
    <div className="notif-page page-enter">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-3)' }}>
          <h1 className="text-h1"><Bell size={24} className="text-accent" /> SYSTEM EVENTS</h1>
          {unread > 0 && <span className="badge in-shop shake">{unread} ACTION REQ</span>}
        </div>
        {unread > 0 && (
          <button className="btn btn-ghost btn-pill sm" onClick={() => markAllRead.mutate()}>
            <CheckCheck size={14} /> CLEAR BOARD
          </button>
        )}
      </div>

      {/* Filter tabs */}
      <div className="notif-tabs" style={{ marginTop: 'var(--sp-4)' }}>
        {FILTER_TABS.map(t => (
          <button key={t} className={`notif-tab mech-label ${filter === t ? 'active' : ''}`} onClick={() => setFilter(t)}>
            {t}
          </button>
        ))}
      </div>

      {/* List */}
      {isLoading ? (
        <div className="event-list" style={{ marginTop: 'var(--sp-4)' }}>
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton" style={{ height: 110, borderRadius: 'var(--r-card)' }} />)}
        </div>
      ) : events.length === 0 ? (
        <div className="empty-state neu-card no-hover" style={{ marginTop: 'var(--sp-4)' }}>
          <CheckCheck size={48} color="var(--text-muted)" />
          <p className="mech-label mt-2">NO ACTIVE EVENTS</p>
        </div>
      ) : (
        <div className="event-list" style={{ marginTop: 'var(--sp-4)' }}>
          {events.map(n => {
            const Icon = TYPE_ICON[n.type] ?? Info;
            const color = TYPE_COLOR[n.type] ?? 'var(--text-secondary)';
            return (
              <div key={n.id} className={`event-item ${!n.isRead ? 'unread' : ''}`}
                style={!n.isRead ? { borderLeft: `4px solid ${color}` } : { borderLeft: '4px solid transparent' }}>
                <div className="event-icon-wrap" style={{ background: `${color}18`, color }}>
                  <Icon size={24} />
                </div>
                <div className="event-body">
                  <div className="event-title">{n.title}</div>
                  <div className="event-message">{n.message}</div>
                  
                  {n.hasEvidence && (
                    <div className="flex gap-2" style={{ marginTop: '10px' }}>
                      <button className="btn btn-ghost sm text-xs" onClick={(e) => { e.stopPropagation(); alert('Mock: Opening video playback module'); }}>
                        <Video size={14} className="text-accent" /> VIEW FOOTAGE
                      </button>
                      <button className="btn btn-ghost sm text-xs" onClick={(e) => { e.stopPropagation(); alert('Mock: Dispatching automated mail with evidence'); }}>
                        <Camera size={14} className="text-success" /> DISPATCH MAIL
                      </button>
                    </div>
                  )}

                  <div className="event-meta" style={{ marginTop: '12px' }}>
                    <span className="event-time text-mono">{timeAgo(n.createdAt)}</span>
                    <span className="event-type-label">{n.type.replace(/_/g, ' ')}</span>
                  </div>
                </div>
                {!n.isRead && (
                  <button className="btn-round event-read-btn" title="Acknowledge event"
                    onClick={() => markRead.mutate(n.id)}>
                    <CheckCheck size={16} />
                  </button>
                )}
                {n.isRead && <div className="event-read-dot" />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
