import { useEffect, useState } from 'react'
import { api } from '../context/AuthContext'
import toast from 'react-hot-toast'
import { Zap, ExternalLink, Calendar, Clock } from 'lucide-react'

interface Contest {
  id: string
  name: string
  platform: string
  startTime: string
  endTime: string
  url: string
}

const PLATFORM_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  LEETCODE:    { bg: 'rgba(255,161,22,0.12)', text: '#ffa116', border: 'rgba(255,161,22,0.3)' },
  HACKERRANK:  { bg: 'rgba(0,234,100,0.12)',  text: '#00ea64', border: 'rgba(0,234,100,0.3)' },
  HACKEREARTH: { bg: 'rgba(44,153,244,0.12)', text: '#2c99f4', border: 'rgba(44,153,244,0.3)' },
  CODEFORCES:  { bg: 'rgba(31,141,214,0.12)', text: '#1f8dd6', border: 'rgba(31,141,214,0.3)' },
}

function getTimeUntil(dateStr: string) {
  const diff = new Date(dateStr).getTime() - Date.now()
  if (diff <= 0) return 'Starting now!'
  const h = Math.floor(diff / 3600000)
  const m = Math.floor((diff % 3600000) / 60000)
  if (h > 24) return `${Math.floor(h / 24)}d ${h % 24}h`
  return `${h}h ${m}m`
}

export default function ContestsPage() {
  const [contests, setContests] = useState<Contest[]>([])
  const [loading, setLoading] = useState(true)
  const [platform, setPlatform] = useState('ALL')

  useEffect(() => {
    api.get('/api/contests/upcoming', { params: { size: 50 } })
      .then(r => setContests(r.data.content || []))
      .catch(() => toast.error('Failed to load contests'))
      .finally(() => setLoading(false))
  }, [])

  const filtered = platform === 'ALL'
    ? contests
    : contests.filter(c => c.platform === platform)

  const platforms = ['ALL', ...Object.keys(PLATFORM_COLORS)]

  return (
    <div className="page">
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ marginBottom: 4 }}>Coding Contests</h1>
        <p style={{ color: '#64748b', fontSize: 13 }}>
          Upcoming contests across all platforms · Auto-refreshed every 6 hours
        </p>
      </div>

      {/* Platform filter */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        {platforms.map(p => {
          const colors = PLATFORM_COLORS[p]
          return (
            <button key={p} onClick={() => setPlatform(p)}
              className="btn btn-sm"
              style={{
                background: platform === p
                  ? (colors ? colors.bg : 'rgba(99,102,241,0.25)')
                  : 'transparent',
                color: platform === p
                  ? (colors ? colors.text : '#818cf8')
                  : '#64748b',
                border: `1px solid ${platform === p
                  ? (colors ? colors.border : 'rgba(99,102,241,0.4)')
                  : 'rgba(99,102,241,0.1)'}`,
              }}
              id={`filter-${p.toLowerCase()}`}
            >{p}</button>
          )
        })}
      </div>

      {loading ? (
        <div className="grid grid-2">
          {Array(6).fill(0).map((_, i) => <div key={i} className="skeleton" style={{ height: 180 }} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 48 }}>
          <Zap size={48} color="#f59e0b" style={{ margin: '0 auto 16px', opacity: 0.5 }} />
          <h3>No upcoming contests</h3>
          <p style={{ color: '#64748b', marginTop: 8 }}>Check back later – contests are fetched every 6 hours.</p>
        </div>
      ) : (
        <div className="grid grid-2">
          {filtered.map(c => {
            const clr = PLATFORM_COLORS[c.platform] || { bg: 'rgba(99,102,241,0.12)', text: '#818cf8', border: 'rgba(99,102,241,0.3)' }
            return (
              <div key={c.id} className="card"
                style={{
                  borderLeft: `4px solid ${clr.text}`,
                  transition: 'all 0.2s',
                }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <span style={{
                    fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
                    background: clr.bg, color: clr.text, border: `1px solid ${clr.border}`,
                  }}>{c.platform}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#f59e0b', fontSize: 13, fontWeight: 600 }}>
                    <Clock size={13} />
                    {getTimeUntil(c.startTime)}
                  </div>
                </div>
                <h3 style={{ fontSize: 15, marginBottom: 12, lineHeight: 1.4 }}>{c.name}</h3>
                <div style={{ display: 'flex', gap: 16, color: '#64748b', fontSize: 13, marginBottom: 16 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <Calendar size={13} />
                    {new Date(c.startTime).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <a href={c.url} target="_blank" rel="noopener noreferrer"
                    className="btn btn-primary btn-sm"
                    style={{ flex: 1, justifyContent: 'center', textDecoration: 'none' }}>
                    <ExternalLink size={13} /> Join Contest
                  </a>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
