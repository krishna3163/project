import { useEffect, useState } from 'react'
import { api } from '../context/AuthContext'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import { Star, Flame, Award, Edit2, Check } from 'lucide-react'

export default function ProfilePage() {
  const { } = useAuth()
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    api.get('/api/users/me').then(r => {
      setProfile(r.data)
      setName(r.data.name || '')
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await api.patch('/api/users/me', { name })
      setProfile(res.data)
      setEditing(false)
      toast.success('Profile updated!')
    } catch { toast.error('Update failed') }
    finally { setSaving(false) }
  }

  if (loading) return <div className="page"><div className="skeleton" style={{ height: 400 }} /></div>

  const initials = profile?.name?.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2) || 'U'

  return (
    <div className="page" style={{ maxWidth: 720 }}>
      <h1 style={{ marginBottom: 24 }}>Profile</h1>

      {/* Profile card */}
      <div className="card" style={{ marginBottom: 24, textAlign: 'center', padding: 40 }}>
        <div style={{
          width: 80, height: 80, borderRadius: '50%',
          background: 'linear-gradient(135deg, #6366f1, #22d3ee)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 20px', fontSize: 28, fontWeight: 800, color: '#fff',
          boxShadow: '0 0 30px rgba(99,102,241,0.4)',
        }}>{initials}</div>

        {editing ? (
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 8 }}>
            <input
              className="input"
              value={name}
              onChange={e => setName(e.target.value)}
              style={{ maxWidth: 220, textAlign: 'center' }}
              autoFocus
              id="profile-name-input"
            />
            <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving} id="btn-save-name">
              <Check size={14} />
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center', marginBottom: 4 }}>
            <h2 style={{ margin: 0 }}>{profile?.name}</h2>
            <button className="btn-icon" onClick={() => setEditing(true)} style={{ width: 28, height: 28 }} id="btn-edit-name">
              <Edit2 size={13} />
            </button>
          </div>
        )}
        <p style={{ color: '#64748b', fontSize: 14 }}>{profile?.email}</p>

        {/* XP & Streak */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 32, marginTop: 24 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center' }}>
              <Star size={18} color="#f59e0b" />
              <span style={{ fontSize: 24, fontWeight: 800, color: '#f59e0b' }}>{profile?.xpPoints || 0}</span>
            </div>
            <div style={{ fontSize: 12, color: '#64748b' }}>XP Points</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center' }}>
              <Flame size={18} color="#ef4444" />
              <span style={{ fontSize: 24, fontWeight: 800, color: '#ef4444' }}>{profile?.dailyStreak || 0}</span>
            </div>
            <div style={{ fontSize: 12, color: '#64748b' }}>Day Streak</div>
          </div>
        </div>
      </div>

      {/* Badges */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
          <Award size={20} color="#f59e0b" />
          <h3>Achievements</h3>
        </div>
        {profile?.badges?.length > 0 ? (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {profile.badges.map((b: string) => (
              <div key={b} style={{
                padding: '8px 16px', borderRadius: 20,
                background: 'rgba(245,158,11,0.15)',
                border: '1px solid rgba(245,158,11,0.3)',
                color: '#f59e0b', fontWeight: 600, fontSize: 13,
                display: 'flex', alignItems: 'center', gap: 6,
              }}>
                🏆 {b.replace('_', ' ')}
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '24px 0', color: '#64748b' }}>
            <Award size={36} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
            <p>No badges yet. Solve 50 problems to earn your first badge!</p>
          </div>
        )}
      </div>

      {/* Account info */}
      <div className="card" style={{ marginTop: 20 }}>
        <h3 style={{ marginBottom: 16 }}>Account Information</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[
            { label: 'Email', value: profile?.email },
            { label: 'Member Since', value: new Date(profile?.createdAt).toLocaleDateString('en-IN', { dateStyle: 'long' }) },
            { label: 'Email Verified', value: profile?.emailVerified ? '✅ Verified' : '❌ Not verified' },
          ].map(({ label, value }) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid rgba(99,102,241,0.08)' }}>
              <span style={{ color: '#64748b', fontSize: 14 }}>{label}</span>
              <span style={{ color: '#f1f5f9', fontSize: 14, fontWeight: 500 }}>{value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
