import { useEffect, useState, useCallback } from 'react'
import { api } from '../context/AuthContext'
import toast from 'react-hot-toast'
import { Bell, CheckCheck, Trophy, Flame, Star, Info, AlertCircle, Gift, Clock } from 'lucide-react'

interface Notification {
  id: string
  userId: string
  title: string
  message: string
  type: string
  read: boolean
  createdAt: string
}

function getNotifIcon(type: string) {
  switch ((type || '').toUpperCase()) {
    case 'CONTEST': return <Trophy size={16} color="#f59e0b" />
    case 'STREAK': return <Flame size={16} color="#ef4444" />
    case 'XP': return <Star size={16} color="#fbbf24" />
    case 'BADGE': return <Gift size={16} color="#a78bfa" />
    case 'REMINDER': return <Clock size={16} color="#22d3ee" />
    case 'ALERT': return <AlertCircle size={16} color="#f87171" />
    default: return <Info size={16} color="#64748b" />
  }
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [markingAll, setMarkingAll] = useState(false)

  const fetchNotifications = useCallback(() => {
    api.get('/api/notifications', { params: { size: 50 } })
      .then(r => setNotifications(r.data.content || []))
      .catch(() => toast.error('Failed to load notifications'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { fetchNotifications() }, [fetchNotifications])

  const handleMarkRead = async (id: string) => {
    try {
      await api.patch(`/api/notifications/${id}/read`)
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, read: true } : n)
      )
    } catch {
      toast.error('Failed to mark as read')
    }
  }

  const handleMarkAllRead = async () => {
    setMarkingAll(true)
    try {
      await api.post('/api/notifications/mark-all-read')
      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
      toast.success('All notifications marked as read!')
    } catch {
      toast.error('Failed to mark all as read')
    } finally {
      setMarkingAll(false)
    }
  }

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <div className="page" style={{ maxWidth: 680, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: 'rgba(99,102,241,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            position: 'relative'
          }}>
            <Bell size={22} color="#818cf8" />
            {unreadCount > 0 && (
              <span style={{
                position: 'absolute', top: -4, right: -4,
                background: '#6366f1', color: '#fff',
                fontSize: 10, fontWeight: 700,
                width: 18, height: 18, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>{unreadCount > 9 ? '9+' : unreadCount}</span>
            )}
          </div>
          <div>
            <h1 style={{ marginBottom: 2 }}>Notifications</h1>
            <p style={{ color: '#64748b', fontSize: 13 }}>
              {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'} · {notifications.length} total
            </p>
          </div>
        </div>

        {unreadCount > 0 && (
          <button
            className="btn btn-secondary btn-sm"
            onClick={handleMarkAllRead}
            disabled={markingAll}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            id="btn-mark-all-read"
          >
            <CheckCheck size={15} />
            {markingAll ? 'Marking...' : 'Mark All Read'}
          </button>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {Array(5).fill(0).map((_, i) => (
            <div key={i} className="skeleton" style={{ height: 80, borderRadius: 12 }} />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '48px 24px' }}>
          <Bell size={48} color="#334155" style={{ margin: '0 auto 16px' }} />
          <h3 style={{ color: '#475569', marginBottom: 8 }}>No notifications yet</h3>
          <p style={{ color: '#64748b', fontSize: 13 }}>
            Activity updates, contest results, streak alerts, and badge unlocks will appear here.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {/* Unread section */}
          {notifications.filter(n => !n.read).length > 0 && (
            <div style={{ fontSize: 11, fontWeight: 700, color: '#6366f1', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4, paddingLeft: 4 }}>
              Unread
            </div>
          )}
          {notifications.filter(n => !n.read).map(notif => (
            <div
              key={notif.id}
              style={{
                display: 'flex', gap: 14, alignItems: 'flex-start',
                background: 'rgba(99,102,241,0.06)',
                border: '1px solid rgba(99,102,241,0.15)',
                borderRadius: 14, padding: '14px 16px',
                cursor: 'pointer', transition: 'all 0.15s',
                position: 'relative'
              }}
              onClick={() => handleMarkRead(notif.id)}
              onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(99,102,241,0.3)')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(99,102,241,0.15)')}
              id={`notif-${notif.id}`}
            >
              {/* Unread dot */}
              <span style={{
                position: 'absolute', top: 16, right: 16,
                width: 8, height: 8, borderRadius: '50%',
                background: '#6366f1'
              }} />

              <div style={{
                width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.06)',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                {getNotifIcon(notif.type)}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: '#f1f5f9', marginBottom: 3 }}>
                  {notif.title}
                </div>
                <div style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.5, marginBottom: 6 }}>
                  {notif.message}
                </div>
                <div style={{ fontSize: 11, color: '#475569' }}>{timeAgo(notif.createdAt)}</div>
              </div>
            </div>
          ))}

          {/* Read section */}
          {notifications.filter(n => n.read).length > 0 && (
            <div style={{ fontSize: 11, fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: 1, margin: '12px 0 4px', paddingLeft: 4 }}>
              Earlier
            </div>
          )}
          {notifications.filter(n => n.read).map(notif => (
            <div
              key={notif.id}
              style={{
                display: 'flex', gap: 14, alignItems: 'flex-start',
                background: 'rgba(255,255,255,0.015)',
                border: '1px solid rgba(255,255,255,0.04)',
                borderRadius: 14, padding: '14px 16px',
                opacity: 0.7, transition: 'opacity 0.15s'
              }}
              onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
              onMouseLeave={e => (e.currentTarget.style.opacity = '0.7')}
              id={`notif-read-${notif.id}`}
            >
              <div style={{
                width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.05)',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                {getNotifIcon(notif.type)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 14, color: '#cbd5e1', marginBottom: 3 }}>
                  {notif.title}
                </div>
                <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.5, marginBottom: 6 }}>
                  {notif.message}
                </div>
                <div style={{ fontSize: 11, color: '#334155' }}>{timeAgo(notif.createdAt)}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
