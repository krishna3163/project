import { useEffect, useState } from 'react'
import { api, useAuth } from '../context/AuthContext'
import { ShieldCheck, Users, Trash2, Activity, ShieldAlert } from 'lucide-react'
import toast from 'react-hot-toast'

interface UserData {
  id: string
  name: string
  email: string
  xpPoints: number
  roles: string[]
  activeSessionId: string | null
}

export default function AdminPage() {
  const { user } = useAuth()
  const [users, setUsers] = useState<UserData[]>([])
  const [stats, setStats] = useState({ totalUsers: 0, activeSessions: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user?.roles?.includes('ROLE_ADMIN')) {
      toast.error('Unauthorized access')
      return
    }
    
    Promise.all([
      api.get('/api/admin/users?size=50'),
      api.get('/api/admin/stats')
    ]).then(([usersRes, statsRes]) => {
      setUsers(usersRes.data.content || [])
      setStats(statsRes.data)
    }).catch(err => {
      toast.error('Failed to fetch admin data')
      console.error(err)
    }).finally(() => setLoading(false))
  }, [user])

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return
    try {
      await api.delete(`/api/admin/users/${id}`)
      setUsers(u => u.filter(x => x.id !== id))
      setStats(s => ({ ...s, totalUsers: s.totalUsers - 1 }))
      toast.success('User deleted successfully')
    } catch {
      toast.error('Failed to delete user')
    }
  }

  if (!user?.roles?.includes('ROLE_ADMIN')) {
    return (
      <div className="page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
        <div className="card fade-in-scale" style={{ textAlign: 'center', padding: 40, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)' }}>
          <ShieldAlert size={64} color="#ef4444" style={{ marginBottom: 20 }} />
          <h1 style={{ color: '#f87171' }}>Access Denied</h1>
          <p style={{ color: '#fca5a5' }}>You do not have administrator privileges to view this page.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="page stagger">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <ShieldCheck size={32} color="#10b981" />
        <h1 style={{ margin: 0 }}>System Administration</h1>
      </div>

      <div className="grid grid-2" style={{ marginBottom: 32 }}>
        <div className="card fade-in-scale" style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{ padding: 16, background: 'rgba(99,102,241,0.15)', borderRadius: 12 }}>
            <Users size={32} color="#818cf8" />
          </div>
          <div>
            <div style={{ fontSize: 13, color: '#94a3b8' }}>Total Registered Users</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: '#f1f5f9' }}>{stats.totalUsers}</div>
          </div>
        </div>
        <div className="card fade-in-scale" style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{ padding: 16, background: 'rgba(16,185,129,0.15)', borderRadius: 12 }}>
            <Activity size={32} color="#34d399" />
          </div>
          <div>
            <div style={{ fontSize: 13, color: '#94a3b8' }}>Active Sessions</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: '#f1f5f9' }}>{stats.activeSessions}</div>
          </div>
        </div>
      </div>

      <div className="card fade-in-scale">
        <h3 style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Users size={20} color="#6366f1" />
          User Management
        </h3>
        
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: 60 }} />)}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8' }}>
                  <th style={{ textAlign: 'left', padding: '12px 16px' }}>Name</th>
                  <th style={{ textAlign: 'left', padding: '12px 16px' }}>Email</th>
                  <th style={{ textAlign: 'left', padding: '12px 16px' }}>XP Points</th>
                  <th style={{ textAlign: 'left', padding: '12px 16px' }}>Roles</th>
                  <th style={{ textAlign: 'center', padding: '12px 16px' }}>Session Status</th>
                  <th style={{ textAlign: 'right', padding: '12px 16px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '12px 16px', color: '#f1f5f9', fontWeight: 500 }}>{u.name}</td>
                    <td style={{ padding: '12px 16px', color: '#94a3b8' }}>{u.email}</td>
                    <td style={{ padding: '12px 16px', color: '#6366f1', fontWeight: 600 }}>{u.xpPoints}</td>
                    <td style={{ padding: '12px 16px' }}>
                      {u.roles?.map(r => (
                        <span key={r} style={{ background: r === 'ROLE_ADMIN' ? 'rgba(239,68,68,0.2)' : 'rgba(99,102,241,0.2)', color: r === 'ROLE_ADMIN' ? '#fca5a5' : '#818cf8', padding: '2px 8px', borderRadius: 12, fontSize: 11, marginRight: 4 }}>
                          {r.replace('ROLE_', '')}
                        </span>
                      ))}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      {u.activeSessionId ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#10b981', fontSize: 12 }}>
                          <span style={{ width: 8, height: 8, background: '#10b981', borderRadius: '50%' }}></span> Active
                        </span>
                      ) : (
                        <span style={{ color: '#64748b', fontSize: 12 }}>Offline</span>
                      )}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      {u.id !== user?.userId && (
                        <button
                          onClick={() => handleDelete(u.id)}
                          className="btn-icon"
                          style={{ color: '#ef4444', background: 'rgba(239,68,68,0.1)' }}
                          title="Delete User"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
