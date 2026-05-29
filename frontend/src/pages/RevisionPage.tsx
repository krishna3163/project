import { useEffect, useState } from 'react'
import { api } from '../context/AuthContext'
import toast from 'react-hot-toast'
import { Clock, CheckCircle, Brain, Loader2, Percent } from 'lucide-react'

interface DsaProblem {
  id: string
  title: string
  difficulty: string
  tags: string[]
  leetcodeLink: string
}

interface DueRevision {
  scheduleId: string
  problem: DsaProblem
  intervalDays: number
  easeFactor: number
  revisionCount: number
  nextRevisionDate: string
  lastRevisedDate: string
}

interface RevisionStats {
  totalRevisions: number
  completedRevisions: number
  dueRevisions: number
  retentionRate: number
}

export default function RevisionPage() {
  const [dueQueue, setDueQueue] = useState<DueRevision[]>([])
  const [stats, setStats] = useState<RevisionStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [completing, setCompleting] = useState<string | null>(null)

  const fetchRevisionData = async () => {
    setLoading(true)
    try {
      const queueRes = await api.get('/api/revisions/due')
      const statsRes = await api.get('/api/revisions/stats')
      setDueQueue(queueRes.data)
      setStats(statsRes.data)
    } catch {
      toast.error('Failed to load spaced repetition schedules')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRevisionData()
  }, [])

  const handleCompleteRevision = async (problemId: string, quality: number) => {
    setCompleting(problemId)
    try {
      await api.post(`/api/revisions/${problemId}/complete`, { quality })
      toast.success('🧠 Revision completed and SM-2 schedule updated! +15 XP')
      // Refresh
      const queueRes = await api.get('/api/revisions/due')
      const statsRes = await api.get('/api/revisions/stats')
      setDueQueue(queueRes.data)
      setStats(statsRes.data)
    } catch {
      toast.error('Failed to complete revision')
    } finally {
      setCompleting(null)
    }
  }

  const difficultyColor = (d: string) => ({
    EASY: '#10b981', MEDIUM: '#f59e0b', HARD: '#ef4444'
  }[d] || '#94a3b8')

  return (
    <div className="page fade-in">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
        <div style={{
          width: 44, height: 44, borderRadius: 12,
          background: 'rgba(99,102,241,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Brain size={24} color="#818cf8" />
        </div>
        <div>
          <h1 style={{ marginBottom: 2 }}>Spaced Repetition Scheduler</h1>
          <p style={{ color: '#64748b', fontSize: 13 }}>
            Re-solve previously solved problems matching Ebbinghaus forgetting intervals to ensure 100% long-term retention.
          </p>
        </div>
      </div>

      {/* Analytics */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20, marginBottom: 28 }}>
          <div className="card" style={{ padding: 20, display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ fontSize: 32, fontWeight: 800, color: '#6366f1' }}>{stats.dueRevisions}</div>
            <div>
              <strong style={{ display: 'block', fontSize: 13, color: '#cbd5e1' }}>Due Revisions</strong>
              <span style={{ fontSize: 11, color: '#64748b' }}>Pending tasks for today</span>
            </div>
          </div>

          <div className="card" style={{ padding: 20, display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ fontSize: 32, fontWeight: 800, color: '#10b981' }}>{stats.retentionRate}%</div>
            <div>
              <strong style={{ display: 'block', fontSize: 13, color: '#cbd5e1' }}>Retention Strength</strong>
              <span style={{ fontSize: 11, color: '#64748b' }}>Ebbinghaus curve benchmark</span>
            </div>
          </div>

          <div className="card" style={{ padding: 20, display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ fontSize: 32, fontWeight: 800, color: '#22d3ee' }}>{stats.totalRevisions}</div>
            <div>
              <strong style={{ display: 'block', fontSize: 13, color: '#cbd5e1' }}>Tracked Problems</strong>
              <span style={{ fontSize: 11, color: '#64748b' }}>Total scheduler items</span>
            </div>
          </div>
        </div>
      )}

      {/* Main Revision Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 28, alignItems: 'start' }}>
        
        {/* Revision Queue */}
        <div className="card" style={{ padding: 24 }}>
          <h3 style={{ margin: '0 0 20px 0', display: 'flex', alignItems: 'center', gap: 8, color: '#f1f5f9' }}>
            <Clock size={18} color="#22d3ee" /> Today's Revision Queue
          </h3>

          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><Loader2 className="spinner" color="#6366f1" /></div>
          ) : dueQueue.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 20px' }}>
              <CheckCircle size={40} color="#10b981" style={{ margin: '0 auto 12px', opacity: 0.6 }} />
              <h4 style={{ color: '#cbd5e1' }}>All caught up!</h4>
              <p style={{ color: '#64748b', fontSize: 12, marginTop: 4 }}>No revisions are currently scheduled for today. Solve more DSA tracker problems to populate the queue!</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {dueQueue.map(item => (
                <div key={item.scheduleId} className="card" style={{ background: 'rgba(255,255,255,0.02)', padding: 18, border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h4 style={{ margin: '0 0 4px 0', fontSize: 15, color: '#f1f5f9' }}>{item.problem.title}</h4>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                        <span style={{
                          fontSize: 10, fontWeight: 700,
                          color: difficultyColor(item.problem.difficulty),
                          background: `${difficultyColor(item.problem.difficulty)}15`,
                          padding: '1px 6px', borderRadius: 10
                        }}>{item.problem.difficulty}</span>
                        {item.problem.tags.slice(0,2).map(tag => (
                          <span key={tag} className="tag" style={{ fontSize: 10, padding: '1px 6px' }}>{tag}</span>
                        ))}
                      </div>
                    </div>
                    <div style={{ fontSize: 11, color: '#64748b', textAlign: 'right' }}>
                      <div>Revised: <strong>{item.revisionCount} times</strong></div>
                      <div>Last: <strong>{item.lastRevisedDate ? new Date(item.lastRevisedDate).toLocaleDateString() : 'Never'}</strong></div>
                    </div>
                  </div>

                  {/* SM-2 Quality selectors */}
                  <div style={{ display: 'flex', justifyItems: 'center', justifyContent: 'space-between', background: 'rgba(0,0,0,0.2)', padding: 10, borderRadius: 10, flexWrap: 'wrap', gap: 10 }}>
                    <span style={{ fontSize: 12, color: '#cbd5e1', alignSelf: 'center' }}>How did you find resolving this?</span>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        onClick={() => handleCompleteRevision(item.problem.id, 1)}
                        disabled={completing === item.problem.id}
                        className="btn btn-sm"
                        style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)', fontSize: 11, height: 26 }}
                      >
                        Hard (Repeat tomorrow)
                      </button>
                      <button
                        onClick={() => handleCompleteRevision(item.problem.id, 2)}
                        disabled={completing === item.problem.id}
                        className="btn btn-sm"
                        style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.2)', fontSize: 11, height: 26 }}
                      >
                        Good (Interval x EF)
                      </button>
                      <button
                        onClick={() => handleCompleteRevision(item.problem.id, 3)}
                        disabled={completing === item.problem.id}
                        className="btn btn-sm"
                        style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.2)', fontSize: 11, height: 26 }}
                      >
                        Easy (Bonus Interval)
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* curve details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div className="card" style={{ padding: 24 }}>
            <h3 style={{ margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: 8, color: '#f1f5f9' }}>
              <Percent size={18} color="#f59e0b" /> Spaced Repetition Science
            </h3>
            <p style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.5, margin: 0 }}>
              The **Ebbinghaus Forgetting Curve** shows how memory decays exponentially over time. 
              By revising solved algorithms precisely at the **1-day, 3-day, 7-day, and 21-day** marks, 
              you reset the retention rate to 100%, flattening the curve and committing topics to permanent memory.
            </p>
            <div style={{ marginTop: 20, padding: 12, background: 'rgba(99,102,241,0.05)', borderRadius: 10, border: '1px solid rgba(99,102,241,0.1)' }}>
              <div style={{ fontSize: 11, color: '#cbd5e1', fontWeight: 600, marginBottom: 8 }}>Ebbinghaus Intervals:</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>1st Revision</span><strong style={{ color: '#818cf8' }}>After 1 day</strong></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>2nd Revision</span><strong style={{ color: '#22d3ee' }}>After 3 days</strong></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>3rd Revision</span><strong style={{ color: '#10b981' }}>After 7 days</strong></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>4th Revision</span><strong style={{ color: '#f59e0b' }}>After 21 days</strong></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
