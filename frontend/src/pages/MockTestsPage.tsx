import { useEffect, useState } from 'react'
import { api, useAuth } from '../context/AuthContext'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Trophy, Clock, Users, Play, Search, Filter } from 'lucide-react'

interface MockTest {
  id: string
  title: string
  description: string
  type: string
  duration: number
  totalMarks: number
  difficulty: string
  topics: string[]
  participants: number
  createdAt: string
}

interface Analytics {
  totalTests: number
  avgScore: number
  bestRank: number
  streak: number
}

export default function MockTestsPage() {
  const { user } = useAuth()
  const [tests, setTests] = useState<MockTest[]>([])
  const [loading, setLoading] = useState(true)
  const [mode, setMode] = useState<'all' | 'competition' | 'practice'>('all')
  const [search, setSearch] = useState('')
  const [difficultyFilter, setDifficultyFilter] = useState('all')
  const [analytics, setAnalytics] = useState<Analytics | null>(null)

  useEffect(() => {
    // Fetch mock tests
    api.get('/api/mock-tests', { params: { size: 50 } })
      .then(r => setTests(r.data.content || []))
      .catch(() => toast.error('Failed to load mock tests'))
      .finally(() => setLoading(false))

    // Fetch user analytics
    if (user?.userId) {
      api.get(`/api/mock-tests/analytics/${user.userId}`)
        .then(r => setAnalytics(r.data))
        .catch(() => logAnalyticsError())
    }
  }, [user])

  const logAnalyticsError = () => {
    // Quietly log or ignore analytics failure
  }

  // Filter logic
  const filteredTests = tests.filter(test => {
    const matchesSearch = test.title.toLowerCase().includes(search.toLowerCase()) ||
      (test.description && test.description.toLowerCase().includes(search.toLowerCase())) ||
      (test.topics && test.topics.some(t => t.toLowerCase().includes(search.toLowerCase())))

    const matchesMode = mode === 'all' ? true : test.type === mode
    const matchesDifficulty = difficultyFilter === 'all' ? true : test.difficulty?.toLowerCase() === difficultyFilter.toLowerCase()

    return matchesSearch && matchesMode && matchesDifficulty
  })

  const getDifficultyColor = (diff: string) => {
    switch (diff?.toLowerCase()) {
      case 'easy': return { bg: 'rgba(16, 185, 129, 0.1)', text: '#10b981', border: 'rgba(16, 185, 129, 0.2)' }
      case 'medium': return { bg: 'rgba(245, 158, 11, 0.1)', text: '#f59e0b', border: 'rgba(245, 158, 11, 0.2)' }
      case 'hard': return { bg: 'rgba(239, 68, 68, 0.1)', text: '#ef4444', border: 'rgba(239, 68, 68, 0.2)' }
      default: return { bg: 'rgba(99, 102, 241, 0.1)', text: '#6366f1', border: 'rgba(99, 102, 241, 0.2)' }
    }
  }

  return (
    <div className="page" style={{ color: '#f8fafc' }}>
      {/* Title Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 20, marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, background: 'linear-gradient(90deg, #818cf8, #a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: 6 }}>PrepNest Mock Arena</h1>
          <p style={{ color: '#94a3b8', fontSize: 14 }}>Practice at your own pace or compete in high-stakes timed coding challenges.</p>
        </div>
      </div>

      {/* Analytics Dashboard Grid */}
      {analytics && analytics.totalTests > 0 && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 16,
          marginBottom: 32,
          background: 'rgba(15, 23, 42, 0.3)',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          padding: 20,
          borderRadius: 20,
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)'
        }}>
          {[
            { label: 'Tests Taken', value: analytics.totalTests, color: '#818cf8', desc: 'Mock test attempts' },
            { label: 'Average Score', value: `${analytics.avgScore}%`, color: '#60a5fa', desc: 'Across all concepts' },
            { label: 'Best Standing', value: `#${analytics.bestRank}`, color: '#34d399', desc: 'Your top global rank' },
            { label: 'Daily Streak', value: `${analytics.streak} Days`, color: '#f472b6', desc: 'Consecutive active days' }
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontSize: 12, color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>{item.label}</span>
              <span style={{ fontSize: 24, fontWeight: 800, color: item.color }}>{item.value}</span>
              <span style={{ fontSize: 11, color: '#94a3b8' }}>{item.desc}</span>
            </div>
          ))}
        </div>
      )}

      {/* Toggles, Search, Filters Container */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 16,
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
        background: 'rgba(30, 41, 59, 0.2)',
        padding: 16,
        borderRadius: 16,
        border: '1px solid rgba(255,255,255,0.03)'
      }}>
        {/* Toggle Mode */}
        <div style={{ display: 'flex', gap: 6, background: 'rgba(15, 23, 42, 0.4)', padding: 4, borderRadius: 10, border: '1px solid rgba(255,255,255,0.04)' }}>
          {[
            { id: 'all', label: 'All Tests' },
            { id: 'competition', label: 'Competitions' },
            { id: 'practice', label: 'Practice Mode' }
          ].map(opt => (
            <button
              key={opt.id}
              onClick={() => setMode(opt.id as any)}
              style={{
                padding: '6px 14px',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                color: mode === opt.id ? '#ffffff' : '#94a3b8',
                background: mode === opt.id ? '#6366f1' : 'transparent',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, flex: 1, justifyContent: 'flex-end', minWidth: 280 }}>
          {/* Search bar */}
          <div style={{ position: 'relative', flex: 1, maxWidth: 300 }}>
            <Search size={16} color="#64748b" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Search tests, topics..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px 8px 36px',
                borderRadius: 10,
                background: 'rgba(15, 23, 42, 0.4)',
                border: '1px solid rgba(255,255,255,0.08)',
                color: '#ffffff',
                fontSize: 13,
                outline: 'none'
              }}
            />
          </div>

          {/* Difficulty Dropdown */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Filter size={14} color="#64748b" />
            <select
              value={difficultyFilter}
              onChange={e => setDifficultyFilter(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: 10,
                background: 'rgba(15, 23, 42, 0.4)',
                border: '1px solid rgba(255,255,255,0.08)',
                color: '#ffffff',
                fontSize: 13,
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="all">All Difficulties</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Grid View */}
      {loading ? (
        <div className="grid grid-3">
          {Array(6).fill(0).map((_, i) => <div key={i} className="skeleton" style={{ height: 210, borderRadius: 20 }} />)}
        </div>
      ) : filteredTests.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '60px 40px', background: 'rgba(30, 41, 59, 0.1)', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
          <Trophy size={48} color="#6366f1" style={{ margin: '0 auto 16px', opacity: 0.4 }} />
          <h3 style={{ fontSize: 18, color: '#f1f5f9', marginBottom: 8 }}>No mock tests matching filters</h3>
          <p style={{ color: '#64748b', fontSize: 13 }}>Try resetting your search query or selecting a different test mode.</p>
        </div>
      ) : (
        <div className="grid grid-3">
          {filteredTests.map(test => {
            const diffColor = getDifficultyColor(test.difficulty)
            return (
              <div
                key={test.id}
                className="card stagger"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 16,
                  background: 'rgba(30, 41, 59, 0.25)',
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                  borderRadius: 20,
                  padding: 24,
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
                  backdropFilter: 'blur(8px)',
                  transition: 'transform 0.2s, border-color 0.2s',
                  position: 'relative'
                }}
              >
                {/* Header Badge */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{
                    fontSize: 10,
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    color: test.type === 'competition' ? '#fbbf24' : '#60a5fa',
                    background: test.type === 'competition' ? 'rgba(245,158,11,0.1)' : 'rgba(96,165,250,0.1)',
                    border: `1px solid ${test.type === 'competition' ? 'rgba(245,158,11,0.2)' : 'rgba(96,165,250,0.2)'}`,
                    padding: '3px 10px',
                    borderRadius: 99
                  }}>{test.type === 'competition' ? '🏆 Competition' : '🧭 Practice'}</span>

                  <span style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: diffColor.text,
                    background: diffColor.bg,
                    border: `1px solid ${diffColor.border}`,
                    padding: '3px 10px',
                    borderRadius: 99
                  }}>{test.difficulty || 'Medium'}</span>
                </div>

                {/* Body Details */}
                <div>
                  <h3 style={{ fontSize: 17, fontWeight: 800, color: '#f1f5f9', marginBottom: 8, lineHeight: 1.3 }}>{test.title}</h3>
                  <p style={{ color: '#94a3b8', fontSize: 12.5, lineBreak: 'anywhere', WebkitLineClamp: 2, display: '-webkit-box', WebkitBoxOrient: 'vertical', overflow: 'hidden', height: 38 }}>
                    {test.description || 'Practice topics including arrays, sorting, trees, and system design.'}
                  </p>
                </div>

                {/* Topics Tags */}
                {test.topics && test.topics.length > 0 && (
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {test.topics.slice(0, 3).map((topic, i) => (
                      <span key={i} style={{ fontSize: 11, color: '#818cf8', background: 'rgba(99,102,241,0.06)', padding: '2px 8px', borderRadius: 6 }}>
                        {topic}
                      </span>
                    ))}
                  </div>
                )}

                {/* Footer Metrics */}
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b', fontSize: 12, borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 12, marginTop: 'auto' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Users size={12} color="#94a3b8" /> {test.participants || 0} taken
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Clock size={12} color="#94a3b8" /> {test.duration} min
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Trophy size={12} color="#fbbf24" /> {test.totalMarks} pts
                  </span>
                </div>

                {/* CTA Buttons */}
                <div style={{ display: 'flex', gap: 8, width: '100%', marginTop: 8 }}>
                  <Link to={`/mock-tests/${test.id}`} className="btn btn-primary btn-sm"
                    style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: 10, fontWeight: 700 }}>
                    <Play size={12} fill="#ffffff" /> Start Test
                  </Link>
                  <Link to={`/mock-tests/${test.id}?tab=leaderboard`} className="btn btn-outline btn-sm"
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 12px', borderRadius: 10 }}>
                    Leaderboard
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
