import { useEffect, useState } from 'react'
import { api, useAuth } from '../context/AuthContext'
import { Trophy, Medal, Star, Flame, Award } from 'lucide-react'

interface LeaderboardUser {
  id: string
  name: string
  xpPoints: number
  dailyStreak: number
  leetcodeUsername?: string
}

export default function LeaderboardPage() {
  const { user } = useAuth()
  const [leaders, setLeaders] = useState<LeaderboardUser[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/api/leaderboard/global?size=50')
      .then(res => setLeaders(res.data.content || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="page">
      <div className="skeleton" style={{ height: 400, borderRadius: 20 }} />
    </div>
  )

  const top3 = leaders.slice(0, 3)
  const rest = leaders.slice(3)

  return (
    <div className="page stagger">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
        <Trophy size={36} color="#f59e0b" />
        <div>
          <h1 style={{ margin: 0 }}>Global Leaderboard</h1>
          <p style={{ color: '#94a3b8', fontSize: 14, margin: '4px 0 0' }}>See how you stack up against top coders worldwide.</p>
        </div>
      </div>

      {/* Top 3 Podium */}
      {top3.length > 0 && (
        <div style={{
          display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
          gap: 20, marginBottom: 48, minHeight: 280, padding: '20px 0'
        }}>
          {/* Rank 2 */}
          {top3[1] && (
            <div className="fade-in-scale" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 140, animationDelay: '0.2s' }}>
              <div style={{ position: 'relative', marginBottom: 12 }}>
                <div style={{ width: 70, height: 70, borderRadius: '50%', background: 'linear-gradient(135deg, #94a3b8, #cbd5e1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 800, color: '#0f172a', border: '4px solid #1e293b' }}>
                  {top3[1].name.charAt(0)}
                </div>
                <div style={{ position: 'absolute', bottom: -8, left: '50%', transform: 'translateX(-50%)', background: '#94a3b8', color: '#0f172a', fontSize: 12, fontWeight: 800, padding: '2px 8px', borderRadius: 10 }}>#2</div>
              </div>
              <div style={{ fontWeight: 600, color: '#f1f5f9', textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%' }}>{top3[1].name}</div>
              <div style={{ color: '#6366f1', fontSize: 13, fontWeight: 700, marginTop: 4 }}>{top3[1].xpPoints} XP</div>
              <div style={{ width: '100%', height: 100, background: 'linear-gradient(to top, rgba(148,163,184,0.2), transparent)', borderRadius: '12px 12px 0 0', marginTop: 12, border: '1px solid rgba(148,163,184,0.3)', borderBottom: 'none' }} />
            </div>
          )}

          {/* Rank 1 */}
          {top3[0] && (
            <div className="fade-in-scale" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 160, animationDelay: '0.1s', zIndex: 10 }}>
              <Medal size={32} color="#f59e0b" style={{ marginBottom: -8, zIndex: 1 }} />
              <div style={{ position: 'relative', marginBottom: 12 }}>
                <div style={{ width: 90, height: 90, borderRadius: '50%', background: 'linear-gradient(135deg, #f59e0b, #fbbf24)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, fontWeight: 800, color: '#0f172a', border: '4px solid #f59e0b', boxShadow: '0 0 30px rgba(245,158,11,0.4)' }}>
                  {top3[0].name.charAt(0)}
                </div>
                <div style={{ position: 'absolute', bottom: -10, left: '50%', transform: 'translateX(-50%)', background: '#f59e0b', color: '#0f172a', fontSize: 14, fontWeight: 900, padding: '2px 12px', borderRadius: 12 }}>#1</div>
              </div>
              <div style={{ fontWeight: 700, fontSize: 18, color: '#f1f5f9', textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%' }}>{top3[0].name}</div>
              <div style={{ color: '#f59e0b', fontSize: 15, fontWeight: 800, marginTop: 4 }}>{top3[0].xpPoints} XP</div>
              <div style={{ width: '100%', height: 140, background: 'linear-gradient(to top, rgba(245,158,11,0.2), transparent)', borderRadius: '12px 12px 0 0', marginTop: 12, border: '1px solid rgba(245,158,11,0.4)', borderBottom: 'none' }} />
            </div>
          )}

          {/* Rank 3 */}
          {top3[2] && (
            <div className="fade-in-scale" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 140, animationDelay: '0.3s' }}>
              <div style={{ position: 'relative', marginBottom: 12 }}>
                <div style={{ width: 70, height: 70, borderRadius: '50%', background: 'linear-gradient(135deg, #b45309, #d97706)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 800, color: '#fff', border: '4px solid #1e293b' }}>
                  {top3[2].name.charAt(0)}
                </div>
                <div style={{ position: 'absolute', bottom: -8, left: '50%', transform: 'translateX(-50%)', background: '#b45309', color: '#fff', fontSize: 12, fontWeight: 800, padding: '2px 8px', borderRadius: 10 }}>#3</div>
              </div>
              <div style={{ fontWeight: 600, color: '#f1f5f9', textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%' }}>{top3[2].name}</div>
              <div style={{ color: '#6366f1', fontSize: 13, fontWeight: 700, marginTop: 4 }}>{top3[2].xpPoints} XP</div>
              <div style={{ width: '100%', height: 80, background: 'linear-gradient(to top, rgba(180,83,9,0.2), transparent)', borderRadius: '12px 12px 0 0', marginTop: 12, border: '1px solid rgba(180,83,9,0.3)', borderBottom: 'none' }} />
            </div>
          )}
        </div>
      )}

      {/* Rest of Leaderboard */}
      <div className="card fade-in-scale" style={{ padding: 0, overflow: 'hidden', animationDelay: '0.4s' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              <th style={{ padding: '16px 24px', textAlign: 'left', color: '#94a3b8', fontWeight: 500, width: 80 }}>Rank</th>
              <th style={{ padding: '16px 24px', textAlign: 'left', color: '#94a3b8', fontWeight: 500 }}>Coder</th>
              <th style={{ padding: '16px 24px', textAlign: 'center', color: '#94a3b8', fontWeight: 500 }}>Streak</th>
              <th style={{ padding: '16px 24px', textAlign: 'right', color: '#94a3b8', fontWeight: 500 }}>Total XP</th>
            </tr>
          </thead>
          <tbody>
            {rest.map((lUser, idx) => (
              <tr key={lUser.id} style={{ 
                borderBottom: '1px solid rgba(255,255,255,0.05)',
                background: lUser.id === user?.userId ? 'rgba(99,102,241,0.1)' : 'transparent',
                transition: 'background 0.2s'
              }}
              onMouseEnter={e => { if (lUser.id !== user?.userId) e.currentTarget.style.background = 'rgba(255,255,255,0.02)' }}
              onMouseLeave={e => { if (lUser.id !== user?.userId) e.currentTarget.style.background = 'transparent' }}
              >
                <td style={{ padding: '16px 24px', color: '#94a3b8', fontWeight: 600 }}>#{idx + 4}</td>
                <td style={{ padding: '16px 24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(99,102,241,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, color: '#818cf8' }}>
                      {lUser.name.charAt(0)}
                    </div>
                    <div>
                      <div style={{ color: '#f1f5f9', fontWeight: 500 }}>{lUser.name} {lUser.id === user?.userId && '(You)'}</div>
                      {lUser.leetcodeUsername && <div style={{ fontSize: 11, color: '#64748b' }}>@{lUser.leetcodeUsername}</div>}
                    </div>
                  </div>
                </td>
                <td style={{ padding: '16px 24px', textAlign: 'center' }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'rgba(239,68,68,0.1)', padding: '4px 10px', borderRadius: 12, color: '#ef4444', fontSize: 13, fontWeight: 600 }}>
                    <Flame size={14} /> {lUser.dailyStreak || 0}
                  </div>
                </td>
                <td style={{ padding: '16px 24px', textAlign: 'right', color: '#6366f1', fontWeight: 700 }}>
                  {lUser.xpPoints} XP
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rest.length === 0 && top3.length === 0 && (
          <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>
            <Award size={48} style={{ opacity: 0.3, margin: '0 auto 12px' }} />
            <p>No coders on the leaderboard yet.</p>
          </div>
        )}
      </div>
    </div>
  )
}
