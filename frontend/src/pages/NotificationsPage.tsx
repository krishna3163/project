import { Bell } from 'lucide-react'

export default function NotificationsPage() {
  return (
    <div className="page">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(99,102,241,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Bell size={24} color="#818cf8" />
        </div>
        <div>
          <h1 style={{ marginBottom: 2 }}>Notifications</h1>
          <p style={{ color: '#64748b', fontSize: 13 }}>All your alerts, reminders, and updates in one place.</p>
        </div>
      </div>

      <div className="card" style={{ padding: 24, textAlign: 'center' }}>
        <p style={{ color: '#94a3b8', marginBottom: 16 }}>Your notification center is ready.</p>
        <p style={{ color: '#64748b', lineHeight: 1.8 }}>You can view notifications, reminders, and important platform updates here. You can also enable email alerts for deadlines, mock tests, and contest reminders.</p>
      </div>
    </div>
  )
}
