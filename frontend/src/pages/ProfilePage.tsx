import { useEffect, useState } from 'react'
import { api } from '../context/AuthContext'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import { Star, Flame, Award, Edit2, Check, Trophy } from 'lucide-react'

export default function ProfilePage() {
  const { } = useAuth()
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)

  // LeetCode Integration State
  const [leetcodeUsername, setLeetcodeUsername] = useState('')
  const [syncing, setSyncing] = useState(false)

  useEffect(() => {
    api.get('/api/users/me').then(r => {
      setProfile(r.data)
      setName(r.data.name || '')
      setLeetcodeUsername(r.data.leetcodeUsername || '')
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

  const handleLinkLeetCode = async () => {
    setSyncing(true)
    try {
      const res = await api.put('/api/users/leetcode', { leetcodeUsername })
      setProfile(res.data)
      toast.success('LeetCode account linked and synced!')
    } catch {
      toast.error('Failed to link LeetCode account. Check username.')
    } finally {
      setSyncing(false)
    }
  }

  const handleSyncLeetCode = async () => {
    setSyncing(true)
    try {
      const res = await api.post('/api/users/leetcode/sync')
      setProfile(res.data)
      toast.success('LeetCode stats and questions synced successfully!')
    } catch {
      toast.error('Failed to sync LeetCode stats')
    } finally {
      setSyncing(false)
    }
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

        {/* XP, Streak & Rank */}
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
          <div style={{ textAlign: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center' }}>
              <Trophy size={18} color="#10b981" />
              <span style={{ fontSize: 24, fontWeight: 800, color: '#10b981' }}>#{profile?.globalRank || 1}</span>
            </div>
            <div style={{ fontSize: 12, color: '#64748b' }}>Global Rank</div>
          </div>
        </div>
      </div>

      {/* LeetCode Integration */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Star size={20} color="#ffa116" />
            <h3 style={{ margin: 0 }}>LeetCode Integration</h3>
          </div>
          {profile?.leetcodeUsername && (
            <button
              className="btn btn-secondary btn-sm"
              onClick={handleSyncLeetCode}
              disabled={syncing}
              id="btn-sync-leetcode"
            >
              {syncing ? 'Syncing...' : 'Sync Now 🔄'}
            </button>
          )}
        </div>

        {profile?.leetcodeUsername ? (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,161,22,0.06)', border: '1px solid rgba(255,161,22,0.15)', borderRadius: 12, padding: '16px 20px', marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 13, color: '#64748b', marginBottom: 2 }}>Linked Account</div>
                <a href={`https://leetcode.com/${profile.leetcodeUsername}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: 16, fontWeight: 700, color: '#ffa116', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
                  @{profile.leetcodeUsername} 🔗
                </a>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 13, color: '#64748b', marginBottom: 2 }}>LeetCode Rank</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#f1f5f9' }}>
                  #{profile.leetcodeRanking ? profile.leetcodeRanking.toLocaleString() : 'N/A'}
                </div>
              </div>
            </div>

            <h4 style={{ marginBottom: 12, fontSize: 14, color: '#94a3b8' }}>Solved Breakdown</h4>
            <div style={{ display: 'flex', gap: 12 }}>
              {[
                { label: 'Easy', count: profile.leetcodeEasySolved, color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
                { label: 'Medium', count: profile.leetcodeMediumSolved, color: '#fbbf24', bg: 'rgba(251,191,36,0.1)' },
                { label: 'Hard', count: profile.leetcodeHardSolved, color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
              ].map(d => (
                <div key={d.label} style={{ flex: 1, background: d.bg, border: `1px solid ${d.color}22`, borderRadius: 10, padding: '12px 16px', textAlign: 'center' }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: d.color, marginBottom: 2 }}>{d.count || 0}</div>
                  <div style={{ fontSize: 12, color: '#64748b', fontWeight: 500 }}>{d.label}</div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div>
            <p style={{ color: '#94a3b8', fontSize: 14, marginBottom: 16 }}>
              Link your LeetCode username to display your official solving statistics, global ranking, and automatically sync solved problems to award local XP!
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <input
                className="input"
                placeholder="Enter LeetCode username..."
                value={leetcodeUsername}
                onChange={e => setLeetcodeUsername(e.target.value)}
                style={{ flex: 1 }}
                id="leetcode-username-input"
              />
              <button
                className="btn btn-primary"
                onClick={handleLinkLeetCode}
                disabled={syncing || !leetcodeUsername.trim()}
                id="btn-link-leetcode"
              >
                {syncing ? 'Linking...' : 'Link Account'}
              </button>
            </div>
          </div>
        )}
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
