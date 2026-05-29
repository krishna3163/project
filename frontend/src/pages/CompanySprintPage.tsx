import { useEffect, useState } from 'react'
import { api } from '../context/AuthContext'
import toast from 'react-hot-toast'
import { Sparkles, Calendar, ChevronRight, CheckCircle, Code, AlertCircle, Loader2 } from 'lucide-react'

interface Problem {
  id: string
  title: string
  difficulty: string
  tags: string[]
  leetcodeLink: string
  companies: string[]
  frequency: number
  userSolvedList: string[]
}

const COMPANIES = ['Google', 'Amazon', 'Microsoft']

// 7-day Focused Sprint structure
const SPRINT_DAYS = [
  { day: 1, title: 'Arrays & Hash Maps', tagFilter: ['Array', 'Hash Map'] },
  { day: 2, title: 'Strings & Sliding Window', tagFilter: ['String', 'Sliding Window'] },
  { day: 3, title: 'Linked Lists & Stacks', tagFilter: ['Linked List', 'Stack'] },
  { day: 4, title: 'Binary Search', tagFilter: ['Binary Search'] },
  { day: 5, title: 'Trees & DFS/BFS', tagFilter: ['Tree', 'DFS', 'BFS'] },
  { day: 6, title: 'Dynamic Programming & Greedy', tagFilter: ['Dynamic Programming', 'Greedy'] },
  { day: 7, title: 'Graphs & Backtracking', tagFilter: ['Graph', 'Backtracking'] },
]

export default function CompanySprintPage() {
  const [problems, setProblems] = useState<Problem[]>([])
  const [selectedCompany, setSelectedCompany] = useState('Google')
  const [loading, setLoading] = useState(true)
  const [activeSprintDay, setActiveSprintDay] = useState(1)

  useEffect(() => {
    fetchSprintProblems()
  }, [])

  const fetchSprintProblems = async () => {
    setLoading(true)
    try {
      // Fetch all problems (page=0, size=100)
      const res = await api.get('/api/dsa', { params: { page: 0, size: 100 } })
      setProblems(res.data.content || [])
    } catch {
      toast.error('Failed to load company questions bank')
    } finally {
      setLoading(false)
    }
  }

  // Filter problems matching current company
  const companyProblems = problems.filter(p => p.companies && p.companies.includes(selectedCompany))

  // Filter problems for the active sprint day based on matching tags
  const activeDayConfig = SPRINT_DAYS.find(d => d.day === activeSprintDay)
  const dayProblems = companyProblems.filter(p => {
    if (!activeDayConfig) return false
    return p.tags.some(tag => activeDayConfig.tagFilter.includes(tag))
  }).sort((a, b) => b.frequency - a.frequency) // Sort by ask frequency descending!

  const difficultyColor = (d: string) => ({
    EASY: '#10b981', MEDIUM: '#f59e0b', HARD: '#ef4444'
  }[d] || '#94a3b8')

  return (
    <div className="page fade-in">
      {/* Title */}
      <div style={{ display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: 'rgba(245,158,11,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Sparkles size={24} color="#f59e0b" />
          </div>
          <div>
            <h1 style={{ marginBottom: 2 }}>Company Sprints</h1>
            <p style={{ color: '#64748b', fontSize: 13 }}>
              Highly focused 7-day interview preparation modules matching core product patterns.
            </p>
          </div>
        </div>

        {/* Company selector badges */}
        <div style={{ display: 'flex', gap: 8, background: 'rgba(255,255,255,0.03)', padding: 6, borderRadius: 12, border: '1px solid rgba(255,255,255,0.05)' }}>
          {COMPANIES.map(c => (
            <button
              key={c}
              onClick={() => setSelectedCompany(c)}
              className={`btn btn-sm ${selectedCompany === c ? 'btn-primary' : 'btn-outline'}`}
              style={{ border: 'none', borderRadius: 8, fontSize: 12, height: 28 }}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Main layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 28, alignItems: 'start' }}>
        
        {/* 7-Day timeline navigation */}
        <div className="card" style={{ padding: 20 }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: 15, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Calendar size={16} color="#f59e0b" /> 7-Day Sprint Timeline
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {SPRINT_DAYS.map(day => {
              const isActive = day.day === activeSprintDay
              
              // Count completed problems for this day
              const dayProbs = companyProblems.filter(p => p.tags.some(t => day.tagFilter.includes(t)))
              const solvedCount = dayProbs.filter(p => p.userSolvedList && p.userSolvedList.includes(api.defaults.headers.common['userId'] as string)).length
              
              return (
                <button
                  key={day.day}
                  onClick={() => setActiveSprintDay(day.day)}
                  style={{
                    display: 'flex', alignItems: 'center', justifyItems: 'center',
                    padding: '12px 14px', borderRadius: 10,
                    background: isActive ? 'rgba(245,158,11,0.08)' : 'rgba(255,255,255,0.01)',
                    border: `1px solid ${isActive ? 'rgba(245,158,11,0.3)' : 'rgba(255,255,255,0.04)'}`,
                    cursor: 'pointer', textAlign: 'left',
                    transition: 'background 0.2s, transform 0.2s'
                  }}
                  onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.03)' }}
                  onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.01)' }}
                >
                  <div style={{
                    width: 28, height: 28, borderRadius: 8,
                    background: isActive ? '#f59e0b' : 'rgba(255,255,255,0.05)',
                    color: isActive ? '#000' : '#cbd5e1',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, fontWeight: 800, marginRight: 12
                  }}>
                    {day.day}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: isActive ? '#fff' : '#cbd5e1' }}>{day.title}</div>
                    <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                      {solvedCount}/{dayProbs.length} completed
                    </div>
                  </div>
                  <ChevronRight size={14} color={isActive ? '#f59e0b' : '#475569'} />
                </button>
              )
            })}
          </div>
        </div>

        {/* Day-specific coding problems */}
        <div className="card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', justifyItems: 'center', justifyContent: 'space-between', marginBottom: 20, borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: 14 }}>
            <div>
              <span style={{ fontSize: 11, color: '#f59e0b', fontWeight: 800, textTransform: 'uppercase' }}>DAY {activeSprintDay} SPRINT FOR {selectedCompany}</span>
              <h3 style={{ margin: '2px 0 0 0', fontSize: 16, color: '#fff' }}>{activeDayConfig?.title}</h3>
            </div>
            <span style={{ fontSize: 12, color: '#64748b', alignSelf: 'center' }}>
              {dayProblems.length} targeted questions
            </span>
          </div>

          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><Loader2 className="spinner" color="#f59e0b" /></div>
          ) : dayProblems.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#64748b' }}>
              <AlertCircle size={32} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
              <p style={{ fontSize: 13, margin: 0 }}>No targeted questions in this topic for {selectedCompany} in our current database.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {dayProblems.map(p => {
                const solved = p.userSolvedList && p.userSolvedList.includes(api.defaults.headers.common['userId'] as string)
                return (
                  <div
                    key={p.id}
                    style={{
                      display: 'flex', alignItems: 'center', justifyItems: 'center',
                      padding: '14px 18px', background: solved ? 'rgba(16,185,129,0.04)' : 'rgba(255,255,255,0.01)',
                      border: `1px solid ${solved ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.05)'}`,
                      borderRadius: 12, justifyContent: 'space-between', flexWrap: 'wrap', gap: 12
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        {solved ? <CheckCircle size={15} color="#10b981" /> : <Code size={15} color="#64748b" />}
                        <h4 style={{ margin: 0, fontSize: 14, color: solved ? '#10b981' : '#f1f5f9' }}>{p.title}</h4>
                      </div>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <span style={{
                          fontSize: 10, fontWeight: 700,
                          color: difficultyColor(p.difficulty),
                          background: `${difficultyColor(p.difficulty)}15`,
                          padding: '1px 6px', borderRadius: 10
                        }}>{p.difficulty}</span>
                        <span style={{ fontSize: 11, color: '#64748b' }}>
                          🔥 Asked <strong>{p.frequency}+ times</strong> in last 6 months
                        </span>
                      </div>
                    </div>
                    
                    <a
                      href={p.leetcodeLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: 11, height: 26, textDecoration: 'none' }}
                    >
                      Solve
                    </a>
                  </div>
                )
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
