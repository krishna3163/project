import { useEffect, useState } from 'react'
import { useAuth, api } from '../context/AuthContext'
import { Link } from 'react-router-dom'
import { Code2, Trophy, FileText, Briefcase, TrendingUp, Star, Flame } from 'lucide-react'
import toast from 'react-hot-toast'
import { generateActivityGridDates } from '../utils/activityGrid'

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
  const [mockTests, setMockTests] = useState<any[]>([])
  const [contestTab, setContestTab] = useState<'recent' | 'top' | 'upcoming'>('recent')

  // LeetCode & POTD States
  const [potd, setPotd] = useState<any>(null)
  const [freshUser, setFreshUser] = useState<any>(null)
  const [syncing, setSyncing] = useState(false)

  useEffect(() => {
    Promise.all([
      api.get('/api/progress/snapshot'),
      api.get('/api/contests/upcoming', { params: { size: 4 } }),
      api.get('/api/daily-challenge/today').catch(() => ({ data: null })),
      api.get('/api/users/me'),
      api.get('/api/mock-tests', { params: { size: 20 } }),
    ]).then(([snap, cont, dailyChRes, meRes, mockRes]) => {
      setSnapshot(snap.data)
      setContests(cont.data.content || [])
      setPotd(dailyChRes.data) // dailyChRes.data is { id, problem, completed, date }
      setFreshUser(meRes.data)
      setMockTests(mockRes.data.content || [])
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const handleSolvePotd = async () => {
    if (!potd || !potd.id) return
    try {
      await api.post(`/api/daily-challenge/${potd.id}/complete`)
      setPotd({ ...potd, completed: true })
      const [snap, me] = await Promise.all([
        api.get('/api/progress/snapshot'),
        api.get('/api/users/me')
      ])
      setSnapshot(snap.data)
      setFreshUser(me.data)
      toast.success('Awesome! Solved the Daily Challenge! +100 XP! 🔥')
    } catch {
      toast.error('Failed to complete daily challenge')
    }
  }

  const handleSyncDashboard = async () => {
    setSyncing(true)
    try {
      const res = await api.post('/api/users/leetcode/sync')
      setFreshUser(res.data)
      const snap = await api.get('/api/progress/snapshot')
      setSnapshot(snap.data)
      toast.success('LeetCode stats and questions synced successfully! 🔄')
    } catch {
      toast.error('Failed to sync LeetCode stats')
    } finally {
      setSyncing(false)
    }
  }

  // Generate date list for activity grid (last 18 weeks = 126 days)
  const activeDatesSet = new Set<string>(freshUser?.activeDates || [])
  const totalDays = 126
  const dateBlocks: { dateStr: string; isActive: boolean; label: string }[] = []
  const gridDates = generateActivityGridDates(totalDays)

  for (const current of gridDates) {
    const yyyy = current.getFullYear()
    const mm = String(current.getMonth() + 1).padStart(2, '0')
    const dd = String(current.getDate()).padStart(2, '0')
    const dateStr = `${yyyy}-${mm}-${dd}`
    const isActive = activeDatesSet.has(dateStr)

    dateBlocks.push({
      dateStr,
      isActive,
      label: current.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })
    })
  }

  const weeks: typeof dateBlocks[] = []
  for (let i = 0; i < dateBlocks.length; i += 7) {
    weeks.push(dateBlocks.slice(i, i + 7))
  }

  const recentMockTests = [...mockTests].slice(0, 4)
  const topMockTests = [...mockTests].sort((a, b) => (b.participants || 0) - (a.participants || 0)).slice(0, 4)

  const stats = snapshot ? [
    { label: 'Problems Solved', value: snapshot.dsaSolved, icon: Code2, color: '#6366f1', link: '/dsa' },
    { label: 'Avg Mock Score', value: `${(snapshot.mockScoreAvg ?? 0).toFixed(0)}%`, icon: Trophy, color: '#f59e0b', link: '/mock-tests' },
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
      <div className="card fade-in-scale" style={{
        background: 'linear-gradient(135deg, rgba(99,102,241,0.15) 0%, rgba(34,211,238,0.08) 100%)',
        border: '1px solid rgba(99,102,241,0.2)',
        borderRadius: 20, padding: '32px 36px', marginBottom: 24,
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', right: 40, top: '50%', transform: 'translateY(-50%)',
          fontSize: 80, opacity: 0.08, pointerEvents: 'none',
          animation: 'pulseSlow 4s ease-in-out infinite'
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

      {/* Problem of the Day */}
      {potd && (
        <div className="card fade-in-scale" style={{
          background: 'linear-gradient(135deg, rgba(245,158,11,0.08) 0%, rgba(99,102,241,0.05) 100%)',
          border: '1px solid rgba(245,158,11,0.2)',
          borderRadius: 16, padding: '24px 28px', marginBottom: 24,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 20,
          animationDelay: '0.1s'
        }}>
          <div style={{ flex: 1, minWidth: 280 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span style={{
                background: 'rgba(245,158,11,0.15)', color: '#f59e0b',
                fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 20,
                display: 'inline-flex', alignItems: 'center', gap: 4
              }}>
                🎯 Daily Coding Challenge
              </span>
              <span style={{
                fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 20,
                background: potd.problem.difficulty === 'EASY' ? 'rgba(16,185,129,0.15)' : potd.problem.difficulty === 'MEDIUM' ? 'rgba(251,191,36,0.15)' : 'rgba(239,68,68,0.15)',
                color: potd.problem.difficulty === 'EASY' ? '#10b981' : potd.problem.difficulty === 'MEDIUM' ? '#fbbf24' : '#ef4444',
              }}>{potd.problem.difficulty}</span>
            </div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 8px 0', color: '#f1f5f9' }}>{potd.problem.title}</h2>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {potd.problem.tags?.slice(0, 3).map((t: string) => (
                <span key={t} style={{ fontSize: 11, background: 'rgba(255,255,255,0.05)', color: '#94a3b8', padding: '2px 8px', borderRadius: 4 }}>{t}</span>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <a href={potd.problem.leetcodeLink} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              Solve on LeetCode 🔗
            </a>
            {potd.completed ? (
              <span style={{ color: '#10b981', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4, fontSize: 14 }}>
                ✅ Completed (+100 XP)
              </span>
            ) : (
              <button onClick={handleSolvePotd} className="btn btn-primary btn-sm" style={{ background: '#f59e0b', borderColor: '#d97706', color: '#fff' }} id="btn-solve-potd">
                Mark as Solved 🎯
              </button>
            )}
          </div>
        </div>
      )}

      {/* Daily Quests Widget */}
      {freshUser?.dailyQuests && Object.keys(freshUser.dailyQuests).length > 0 && (
        <div className="card fade-in-scale" style={{
          background: 'rgba(30, 41, 59, 0.4)',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          borderRadius: 16, padding: '20px 24px', marginBottom: 24,
          animationDelay: '0.12s'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8, fontSize: 15, color: '#f1f5f9' }}>
              <span>⚔️</span> Daily Quests
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(234, 179, 8, 0.15)', padding: '4px 12px', borderRadius: 20, border: '1px solid rgba(234, 179, 8, 0.3)' }}>
              <span style={{ fontSize: 14 }}>🪙</span>
              <span style={{ color: '#eab308', fontWeight: 700, fontSize: 13 }}>{freshUser.coins || 0} Coins</span>
            </div>
          </div>
          <div className="grid grid-3 stagger" style={{ gap: 12 }}>
            {Object.entries(freshUser.dailyQuests)
              .filter(([key]) => key.startsWith(new Date().toISOString().split('T')[0]))
              .map(([key, completed], idx) => {
                const isCompleted = completed as boolean;
                const title = key.split('_').slice(1).join(' ');
                return (
                  <div key={key} className="card fade-in-scale" style={{
                    background: isCompleted ? 'rgba(16, 185, 129, 0.1)' : 'rgba(15, 23, 42, 0.6)',
                    border: isCompleted ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(255, 255, 255, 0.05)',
                    padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    animationDelay: `${idx * 0.1}s`
                  }}>
                    <span style={{ fontSize: 13, fontWeight: 500, color: isCompleted ? '#10b981' : '#cbd5e1' }}>
                      {title.replace(/_/g, ' ')}
                    </span>
                    {isCompleted ? (
                      <span style={{ color: '#10b981', fontWeight: 700 }}>✓</span>
                    ) : (
                      <span style={{ fontSize: 11, color: '#64748b', background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: 4 }}>+10 🪙</span>
                    )}
                  </div>
                );
            })}
          </div>
        </div>
      )}

      {/* Unified Activity Grid Preview */}
      <div className="card fade-in-scale" style={{ marginBottom: 24, padding: 20, animationDelay: '0.15s' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 6, fontSize: 14 }}>
            <Flame size={16} color="#ef4444" />
            My Coding Consistency
          </h3>
          <Link to="/profile" style={{ fontSize: 12, color: '#6366f1', textDecoration: 'none', fontWeight: 500 }}>
            Sync Links →
          </Link>
        </div>
        <div style={{ overflowX: 'auto', paddingBottom: 4 }}>
          <div style={{ display: 'flex', gap: 4, minWidth: 620, justifyContent: 'space-between' }}>
            {weeks.map((week, wIdx) => (
              <div key={wIdx} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {week.map((day) => (
                  <div
                    key={day.dateStr}
                    title={`${day.label}: ${day.isActive ? 'Active Session logged!' : 'No activity logged'}`}
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: 1.5,
                      background: day.isActive
                        ? 'linear-gradient(135deg, #10b981, #059669)'
                        : 'rgba(255,255,255,0.05)',
                      border: day.isActive ? '1px solid rgba(16,185,129,0.3)' : '1px solid rgba(255,255,255,0.02)',
                      transition: 'transform 0.15s ease',
                      cursor: 'pointer',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'scale(1.3)'
                      e.currentTarget.style.zIndex = '10'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'scale(1)'
                      e.currentTarget.style.zIndex = 'auto'
                    }}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-4 stagger" style={{ marginBottom: 24 }}>
        {loading
          ? Array(4).fill(0).map((_, i) => (
              <div key={i} className="skeleton" style={{ height: 120 }} />
            ))
          : stats.map(({ label, value, icon: Icon, color, link }) => (
              <Link key={label} to={link} style={{ textDecoration: 'none' }} className="fade-in-scale">
                <div className="stat-card" style={{ cursor: 'pointer', transition: 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px) scale(1.02)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0) scale(1)' }}
                >
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

      {/* Platform & LeetCode Profile Row */}
      <div className="grid grid-2 stagger" style={{ marginBottom: 32 }}>
        {/* Local Platform Rank Card */}
        <div className="card fade-in-scale" style={{ display: 'flex', alignItems: 'center', gap: 20, background: 'linear-gradient(135deg, rgba(99,102,241,0.06), rgba(34,211,238,0.03))' }}>
          <div style={{
            width: 60, height: 60, borderRadius: '50%',
            background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24
          }}>🏆</div>
          <div>
            <div style={{ fontSize: 13, color: '#64748b', marginBottom: 2 }}>Platform Global Rank</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#10b981' }}>
              #{freshUser?.globalRank || 1}
            </div>
            <div style={{ display: 'flex', gap: 12, marginTop: 4, fontSize: 12, color: '#94a3b8' }}>
              <span>✨ {freshUser?.xpPoints || 0} Total XP</span>
              <span>🔥 {freshUser?.dailyStreak || 0} Day Streak</span>
            </div>
          </div>
        </div>

        {/* LeetCode Profile Card */}
        <div className="card fade-in-scale" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          {freshUser?.leetcodeUsername ? (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{
                  width: 48, height: 48, borderRadius: '50%',
                  background: 'rgba(255,161,22,0.1)', border: '1px solid rgba(255,161,22,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20
                }}>⭐</div>
                <div>
                  <div style={{ fontSize: 13, color: '#64748b' }}>LeetCode Profile</div>
                  <a href={`https://leetcode.com/${freshUser.leetcodeUsername}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: 16, fontWeight: 700, color: '#ffa116', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
                    @{freshUser.leetcodeUsername} 🔗
                  </a>
                </div>
              </div>
              <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: 16 }}>
                <div>
                  <div style={{ fontSize: 12, color: '#64748b' }}>Solved Counts</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#f1f5f9', display: 'flex', gap: 6 }}>
                    <span style={{ color: '#10b981' }}>{freshUser.leetcodeEasySolved}E</span>
                    <span style={{ color: '#fbbf24' }}>{freshUser.leetcodeMediumSolved}M</span>
                    <span style={{ color: '#ef4444' }}>{freshUser.leetcodeHardSolved}H</span>
                  </div>
                </div>
                <button
                  onClick={handleSyncDashboard}
                  disabled={syncing}
                  className="btn btn-secondary btn-sm"
                  style={{ padding: '6px 12px' }}
                  id="btn-sync-dashboard"
                >
                  {syncing ? 'Syncing...' : 'Sync 🔄'}
                </button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h4 style={{ margin: '0 0 4px 0' }}>Integrate LeetCode</h4>
                <p style={{ color: '#64748b', fontSize: 12, margin: 0 }}>Sync your LeetCode solved questions to earn local XP automatically!</p>
              </div>
              <Link to="/profile" className="btn btn-primary btn-sm" style={{ background: '#ffa116', borderColor: '#d97706' }}>
                Connect 🔗
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Contests Arena */}
      <div className="grid grid-2 stagger" style={{ marginBottom: 32 }}>
        <div className="card fade-in-scale" style={{ display: 'flex', flexDirection: 'column', minHeight: 380 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Trophy size={20} color="#f59e0b" />
              Contests Arena
            </h3>
            {/* Contest tab switchers */}
            <div style={{ display: 'flex', gap: 4, background: 'rgba(0,0,0,0.2)', padding: 3, borderRadius: 8 }}>
              {[
                { id: 'recent', label: 'Recent' },
                { id: 'top', label: 'Top Rated' },
                { id: 'upcoming', label: 'Upcoming' }
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => setContestTab(t.id as any)}
                  style={{
                    padding: '4px 10px', borderRadius: 6, border: 'none', fontSize: 11, fontWeight: 600, cursor: 'pointer',
                    background: contestTab === t.id ? '#6366f1' : 'transparent',
                    color: contestTab === t.id ? '#fff' : '#64748b',
                    transition: 'all 0.15s'
                  }}
                  id={`tab-dashboard-contest-${t.id}`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: 60 }} />)}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
              {contestTab === 'upcoming' && (
                contests.length === 0 ? (
                  <p style={{ color: '#64748b', fontSize: 13, margin: 0 }}>No upcoming platform contests logged.</p>
                ) : (
                  contests.slice(0, 4).map(c => (
                    <a key={c.id} href={c.url} target="_blank" rel="noopener noreferrer"
                      style={{
                        display: 'block', textDecoration: 'none',
                        background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)',
                        borderRadius: 10, padding: '12px 14px', transition: 'all 0.15s'
                      }}
                      onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(99,102,241,0.3)')}
                      onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(99,102,241,0.15)')}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: '#f1f5f9', marginBottom: 2 }}>{c.name}</div>
                          <div style={{ fontSize: 11, color: '#64748b' }}>
                            {new Date(c.startTime).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                          </div>
                        </div>
                        <span style={{
                          fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 12,
                          background: `${platformColors[c.platform] || '#6366f1'}15`,
                          color: platformColors[c.platform] || '#818cf8',
                        }}>{c.platform}</span>
                      </div>
                    </a>
                  ))
                )
              )}

              {contestTab === 'recent' && (
                recentMockTests.length === 0 ? (
                  <p style={{ color: '#64748b', fontSize: 13, margin: 0 }}>No contests available.</p>
                ) : (
                  recentMockTests.map((t: any) => (
                    <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: 10, padding: '12px 14px' }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#f1f5f9', marginBottom: 2 }}>{t.title}</div>
                        <div style={{ fontSize: 11, color: '#64748b', display: 'flex', gap: 10 }}>
                          <span>⏱ {t.duration} min</span>
                          <span>🏆 {t.totalMarks} pts</span>
                          <span style={{ color: t.difficulty === 'Easy' ? '#10b981' : t.difficulty === 'Hard' ? '#ef4444' : '#fbbf24' }}>
                            {t.difficulty}
                          </span>
                        </div>
                      </div>
                      <Link to={`/mock-tests/${t.id}`} className="btn btn-primary btn-sm" style={{ padding: '6px 12px', fontSize: 11, borderRadius: 8 }}>
                        Start 🧭
                      </Link>
                    </div>
                  ))
                )
              )}

              {contestTab === 'top' && (
                topMockTests.length === 0 ? (
                  <p style={{ color: '#64748b', fontSize: 13, margin: 0 }}>No top contests available.</p>
                ) : (
                  topMockTests.map((t: any) => (
                    <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: 10, padding: '12px 14px' }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#f1f5f9', marginBottom: 2 }}>{t.title}</div>
                        <div style={{ fontSize: 11, color: '#64748b', display: 'flex', gap: 10 }}>
                          <span>👥 {t.participants || 0} participants</span>
                          <span>⏱ {t.duration} min</span>
                          <span style={{ color: t.difficulty === 'Easy' ? '#10b981' : t.difficulty === 'Hard' ? '#ef4444' : '#fbbf24' }}>
                            {t.difficulty}
                          </span>
                        </div>
                      </div>
                      <Link to={`/mock-tests/${t.id}`} className="btn btn-primary btn-sm" style={{ padding: '6px 12px', fontSize: 11, borderRadius: 8 }}>
                        Start 🧭
                      </Link>
                    </div>
                  ))
                )
              )}

              {contestTab === 'upcoming' && contests.length > 0 && (
                <Link to="/contests" className="btn btn-secondary btn-sm" style={{ textAlign: 'center', justifyContent: 'center', marginTop: 'auto', fontSize: 11, padding: 8 }}>
                  View All Platform Contests →
                </Link>
              )}
              {contestTab !== 'upcoming' && mockTests.length > 0 && (
                <Link to="/mock-tests" className="btn btn-secondary btn-sm" style={{ textAlign: 'center', justifyContent: 'center', marginTop: 'auto', fontSize: 11, padding: 8 }}>
                  Enter Mock Arena →
                </Link>
              )}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="card fade-in-scale">
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
      <div className="card fade-in-scale" style={{
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
