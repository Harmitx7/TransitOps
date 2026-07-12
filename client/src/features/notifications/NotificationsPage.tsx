import { useState } from 'react';
import { Bell, CheckCheck, Wrench, Fuel, Route, AlertTriangle, Info, Settings } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import './NotificationsPage.css';

interface Notification {
  id: string; type: string; title: string; message: string; isRead: boolean; createdAt: string;
}

const TYPE_ICON: Record<string, React.ElementType> = {
  LICENSE_EXPIRY: AlertTriangle,
  MAINTENANCE_DUE: Wrench,
  FUEL_ANOMALY: Fuel,
  TRIP_UPDATE: Route,
  SYSTEM: Info,
};

const TYPE_COLOR: Record<string, string> = {
  LICENSE_EXPIRY: 'var(--accent-warning)',
  MAINTENANCE_DUE: 'var(--accent-info)',
  FUEL_ANOMALY: 'var(--accent-danger)',
  TRIP_UPDATE: 'var(--accent-success)',
  SYSTEM: 'var(--text-secondary)',
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

const FILTER_TABS = ['ALL', 'UNREAD', 'LICENSE_EXPIRY', 'MAINTENANCE_DUE', 'FUEL_ANOMALY', 'TRIP_UPDATE'] as const;
type FilterTab = typeof FILTER_TABS[number];

export default function NotificationsPage() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<FilterTab>('ALL');

  const { data, isLoading } = useQuery<{ notifications: Notification[]; total: number; unread: number }>({
    queryKey: ['notifications'],
    queryFn: async () => { const { data } = await api.get('/notifications?limit=100'); return data; },
  });

  const markRead = useMutation({
    mutationFn: async (id: string) => api.patch(`/notifications/${id}/read`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });
  const markAllRead = useMutation({
    mutationFn: async () => api.patch('/notifications/read-all'),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const notifications = (data?.notifications ?? []).filter(n => {
    if (filter === 'UNREAD') return !n.isRead;
    if (filter === 'ALL') return true;
    return n.type === filter;
  });

  const unread = data?.unread ?? 0;

  return (
    <div className="notif-page page-enter">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-3)' }}>
          <h1 className="text-h1">Alerts &amp; Notifications</h1>
          {unread > 0 && <span className="badge in-shop">{unread} unread</span>}
        </div>
        {unread > 0 && (
          <button className="btn btn-ghost btn-pill sm" onClick={() => markAllRead.mutate()}>
            <CheckCheck size={14} /> Mark All Read
          </button>
        )}
      </div>

      {/* Filter tabs */}
      <div className="notif-tabs">
        {FILTER_TABS.map(t => (
          <button key={t} className={`notif-tab ${filter === t ? 'active' : ''}`} onClick={() => setFilter(t)}>
            {t === 'ALL' ? 'All' : t === 'UNREAD' ? 'Unread' : t.replace(/_/g, ' ')}
          </button>
        ))}
      </div>

      {/* List */}
      {isLoading ? (
        <div className="notif-list">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton" style={{ height: 80, borderRadius: 'var(--r-card)' }} />)}
        </div>
      ) : notifications.length === 0 ? (
        <div className="empty-state neu-card no-hover">
          <Bell size={48} color="var(--text-muted)" />
          <p>No notifications here</p>
        </div>
      ) : (
        <div className="notif-list">
          {notifications.map(n => {
            const Icon = TYPE_ICON[n.type] ?? Info;
            const color = TYPE_COLOR[n.type] ?? 'var(--text-secondary)';
            return (
              <div key={n.id} className={`notif-item neu-card no-hover ${!n.isRead ? 'unread' : ''}`}
                style={!n.isRead ? { borderLeft: `3px solid ${color}` } : {}}>
                <div className="notif-icon-wrap" style={{ background: `${color}18` }}>
                  <Icon size={18} color={color} />
                </div>
                <div className="notif-body">
                  <div className="notif-title">{n.title}</div>
                  <div className="notif-message">{n.message}</div>
                  <div className="notif-meta">
                    <span className="notif-time">{timeAgo(n.createdAt)}</span>
                    <span className="notif-type-label">{n.type.replace(/_/g, ' ')}</span>
                  </div>
                </div>
                {!n.isRead && (
                  <button className="btn-round notif-read-btn" title="Mark as read"
                    onClick={() => markRead.mutate(n.id)}>
                    <CheckCheck size={14} />
                  </button>
                )}
                {n.isRead && <div className="notif-read-dot" />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
