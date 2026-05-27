import { useEffect, useState } from 'react'
import { useAuth, api } from '../context/AuthContext'
import { Link } from 'react-router-dom'
import { Code2, Trophy, FileText, Briefcase, Zap, TrendingUp, Star, Flame } from 'lucide-react'

interface Snapshot {
  dsaSolved: number
  notesCount: number
  mockScoreAvg: number
  resumeScore: number
}

interface Contest {
  id: string
  name: string
  platform: string
  startTime: string
  url: string
}

export default function DashboardPage() {
  const { user } = useAuth()
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null)
  const [contests, setContests] = useState<Contest[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/api/progress/snapshot'),
      api.get('/api/contests/upcoming', { params: { size: 3 } }),
    ]).then(([snap, cont]) => {
      setSnapshot(snap.data)
      setContests(cont.data.content || [])
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const stats = snapshot ? [
    { label: 'Problems Solved', value: snapshot.dsaSolved, icon: Code2, color: '#6366f1', link: '/dsa' },
    { label: 'Avg Mock Score', value: `${snapshot.mockScoreAvg.toFixed(0)}%`, icon: Trophy, color: '#f59e0b', link: '/mock-tests' },
    { label: 'Notes Uploaded', value: snapshot.notesCount, icon: FileText, color: '#22d3ee', link: '/notes' },
    { label: 'Resume Score', value: `${snapshot.resumeScore}%`, icon: Briefcase, color: '#10b981', link: '/resume' },
  ] : []

  const platformColors: Record<string, string> = {
    LEETCODE: '#ffa116',
    HACKERRANK: '#00ea64',
    HACKEREARTH: '#2c99f4',
    CODEFORCES: '#1f8dd6',
  }

  return (
    <div className="page">
      {/* Welcome banner */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(99,102,241,0.15) 0%, rgba(34,211,238,0.08) 100%)',
        border: '1px solid rgba(99,102,241,0.2)',
        borderRadius: 20, padding: '32px 36px', marginBottom: 32,
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', right: 40, top: '50%', transform: 'translateY(-50%)',
          fontSize: 80, opacity: 0.08, pointerEvents: 'none',
        }}>🚀</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <Flame size={18} color="#f59e0b" />
          <span style={{ color: '#f59e0b', fontSize: 13, fontWeight: 600 }}>
            Keep the streak alive!
          </span>
        </div>
        <h1 style={{ fontSize: '1.75rem', marginBottom: 4 }}>
          Welcome back, {user?.name?.split(' ')[0] || 'Coder'}! 👋
        </h1>
        <p style={{ color: '#94a3b8', fontSize: 15 }}>
          Track your progress, ace your interviews, and land your dream job.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-4" style={{ marginBottom: 32 }}>
        {loading
          ? Array(4).fill(0).map((_, i) => (
              <div key={i} className="skeleton" style={{ height: 120 }} />
            ))
          : stats.map(({ label, value, icon: Icon, color, link }) => (
              <Link key={label} to={link} style={{ textDecoration: 'none' }}>
                <div className="stat-card" style={{ cursor: 'pointer' }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 12,
                    background: `${color}22`, border: `1px solid ${color}40`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    marginBottom: 12,
                  }}>
                    <Icon size={22} color={color} />
                  </div>
                  <div className="stat-value">{value}</div>
                  <div className="stat-label">{label}</div>
                </div>
              </Link>
            ))
        }
      </div>

      {/* Upcoming Contests */}
      <div className="grid grid-2" style={{ marginBottom: 32 }}>
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            <Zap size={20} color="#f59e0b" />
            <h3>Upcoming Contests</h3>
          </div>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 64 }} />)}
            </div>
          ) : contests.length === 0 ? (
            <p style={{ color: '#64748b', fontSize: 14 }}>No upcoming contests at the moment.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {contests.map(c => (
                <a key={c.id} href={c.url} target="_blank" rel="noopener noreferrer"
                  style={{
                    display: 'block', textDecoration: 'none',
                    background: 'rgba(99,102,241,0.08)',
                    border: '1px solid rgba(99,102,241,0.15)',
                    borderRadius: 12, padding: '14px 16px',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(99,102,241,0.4)')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(99,102,241,0.15)')}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#f1f5f9', marginBottom: 4 }}>{c.name}</div>
                      <div style={{ fontSize: 12, color: '#64748b' }}>
                        {new Date(c.startTime).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                      </div>
                    </div>
                    <span style={{
                      fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 20,
                      background: `${platformColors[c.platform] || '#6366f1'}22`,
                      color: platformColors[c.platform] || '#818cf8',
                    }}>{c.platform}</span>
                  </div>
                </a>
              ))}
              <Link to="/contests" className="btn btn-secondary btn-sm" style={{ textAlign: 'center', justifyContent: 'center' }}>
                View All Contests →
              </Link>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            <Star size={20} color="#6366f1" />
            <h3>Quick Actions</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { to: '/dsa', label: '🧩 Solve a DSA Problem', color: '#6366f1' },
              { to: '/mock-tests', label: '📝 Take a Mock Test', color: '#f59e0b' },
              { to: '/notes', label: '📎 Upload Notes', color: '#22d3ee' },
              { to: '/resume', label: '📄 Analyze Resume', color: '#10b981' },
              { to: '/roadmaps', label: '🗺 View Company Roadmap', color: '#f472b6' },
              { to: '/progress', label: '📊 View Analytics', color: '#818cf8' },
            ].map(({ to, label, color }) => (
              <Link key={to} to={to}
                style={{
                  display: 'block', padding: '12px 16px',
                  background: `${color}0d`, border: `1px solid ${color}22`,
                  borderRadius: 10, textDecoration: 'none',
                  fontSize: 14, color: '#f1f5f9', fontWeight: 500,
                  transition: 'all 0.15s',
                  borderLeft: `3px solid ${color}`,
                }}
                onMouseEnter={e => (e.currentTarget.style.background = `${color}1a`)}
                onMouseLeave={e => (e.currentTarget.style.background = `${color}0d`)}
              >{label}</Link>
            ))}
          </div>
        </div>
      </div>

      {/* Progress teaser */}
      <div className="card" style={{
        background: 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(34,211,238,0.05))',
        textAlign: 'center', padding: 32,
      }}>
        <TrendingUp size={32} color="#6366f1" style={{ marginBottom: 12 }} />
        <h3 style={{ marginBottom: 8 }}>Track Your Journey</h3>
        <p style={{ color: '#94a3b8', fontSize: 14, marginBottom: 20 }}>
          Visualize your DSA progress, mock test scores, and resume improvements over time.
        </p>
        <Link to="/progress" className="btn btn-primary">View Analytics →</Link>
      </div>
    </div>
  )
}
