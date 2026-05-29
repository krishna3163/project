import { useState, useEffect } from 'react'
import { useAuth, api } from '../context/AuthContext'
import toast from 'react-hot-toast'
import { Calendar as CalendarIcon, Clock, Users, Video, X, Loader2, Shuffle, CheckCircle, Award, Star } from 'lucide-react'
import JitsiVideoRoom from '../components/JitsiVideoRoom'
import PeerReviewModal from '../components/PeerReviewModal'

interface InterviewSession {
  id: string
  hostUserId: string
  peerUserId: string | null
  scheduledTime: string
  jitsiRoomName: string | null
  problemId: string | null
  status: 'PENDING' | 'MATCHED' | 'COMPLETED' | 'CANCELLED'
}

interface Problem {
  id: string
  title: string
  difficulty: string
  tags: string[]
  description: string
  leetcodeLink: string
}

export default function MockInterviewPage() {
  const { user } = useAuth()
  const [sessions, setSessions] = useState<InterviewSession[]>([])
  const [loading, setLoading] = useState(true)
  const [scheduling, setScheduling] = useState(false)
  const [activeSession, setActiveSession] = useState<InterviewSession | null>(null)
  const [activeProblem, setActiveProblem] = useState<Problem | null>(null)
  const [loadingProblem, setLoadingProblem] = useState(false)
  const [showReview, setShowReview] = useState<{ sessionId: string } | null>(null)
  const [submittingReview, setSubmittingReview] = useState(false)
  const [notes, setNotes] = useState('')

  // Generate next 7 days for the calendar grid
  const days = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date()
    d.setDate(d.getDate() + i)
    return d
  })

  // 8 standard slot hours
  const hours = ['09', '11', '13', '15', '17', '19', '21', '23']

  useEffect(() => {
    fetchSessions()
  }, [])

  const fetchSessions = async () => {
    try {
      const res = await api.get('/api/interviews/my-schedule')
      setSessions(res.data)
    } catch (err) {
      toast.error('Failed to load schedule')
    } finally {
      setLoading(false)
    }
  }

  // Fetch problem details when active session matches
  useEffect(() => {
    if (activeSession?.problemId) {
      fetchProblemDetails(activeSession.problemId)
    } else {
      setActiveProblem(null);
    }
  }, [activeSession?.problemId])

  const fetchProblemDetails = async (problemId: string) => {
    setLoadingProblem(true)
    try {
      const res = await api.get(`/api/dsa/${problemId}`)
      setActiveProblem(res.data)
    } catch {
      // Fallback details if fetch fails
      setActiveProblem({
        id: problemId,
        title: 'Interview Practice Problem',
        difficulty: 'MEDIUM',
        tags: ['Algorithms', 'Data Structures'],
        description: 'Collaborate with your peer to solve a mock coding question. Walk through time & space complexities first, write clean modular code, and dry-run with test cases.',
        leetcodeLink: 'https://leetcode.com'
      })
    } finally {
      setLoadingProblem(false)
    }
  }

  const handleShuffleProblem = async () => {
    if (!activeSession) return
    setLoadingProblem(true)
    try {
      const res = await api.post(`/api/interviews/${activeSession.id}/regenerate-problem`)
      setActiveSession(res.data)
      toast.success('Generated a new mock interview problem!')
    } catch {
      toast.error('Failed to shuffle problem')
    } finally {
      setLoadingProblem(false)
    }
  }

  const handleCellClick = async (date: Date, hour: string) => {
    const formattedDate = date.toISOString().split('T')[0]
    const timeStr = `${formattedDate}T${hour}:00:00Z`
    
    // Check if slot already exists
    const existing = sessions.find(s => {
      const sDate = new Date(s.scheduledTime)
      return sDate.getUTCFullYear() === date.getUTCFullYear() &&
             sDate.getUTCMonth() === date.getUTCMonth() &&
             sDate.getUTCDate() === date.getUTCDate() &&
             sDate.getUTCHours().toString().padStart(2, '0') === hour
    })

    if (existing) {
      if (existing.status === 'MATCHED') {
        toast('You are already matched for this slot!', { icon: 'ℹ️' })
      } else {
        toast('Slot is already scheduled. Waiting for a peer to match.', { icon: 'ℹ️' })
      }
      return
    }

    setScheduling(true)
    try {
      const res = await api.post('/api/interviews/schedule', { scheduledTime: timeStr })
      setSessions(prev => [...prev.filter(s => s.id !== res.data.id), res.data])
      toast.success(res.data.status === 'MATCHED' ? '🎉 Matched with a peer instantly!' : '📅 Slot booked! Waiting for a peer.')
      fetchSessions()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to book slot')
    } finally {
      setScheduling(false)
    }
  }

  const handleJoin = (session: InterviewSession) => {
    setActiveSession(session)
    setNotes('// Write code cooperatively or take interview notes here\n\nfunction solution() {\n  \n}')
  }

  const handleLeaveCall = () => {
    if (activeSession) {
      setShowReview({ sessionId: activeSession.id })
      setActiveSession(null)
    }
  }

  const handleReviewSubmit = async (rating: number, feedback: string) => {
    if (!showReview) return
    setSubmittingReview(true)
    try {
      await api.post(`/api/interviews/${showReview.sessionId}/review`, { rating, feedback })
      toast.success('Review submitted! +50 XP points awarded! 🌟')
      setShowReview(null)
      fetchSessions()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to submit review')
    } finally {
      setSubmittingReview(false)
    }
  }

  const getSlotStatus = (date: Date, hour: string) => {
    const matched = sessions.find(s => {
      const sDate = new Date(s.scheduledTime)
      return sDate.getUTCFullYear() === date.getUTCFullYear() &&
             sDate.getUTCMonth() === date.getUTCMonth() &&
             sDate.getUTCDate() === date.getUTCDate() &&
             sDate.getUTCHours().toString().padStart(2, '0') === hour
    })

    if (!matched) return null
    return matched
  }

  const difficultyColor = (d: string) => ({
    EASY: '#10b981', MEDIUM: '#f59e0b', HARD: '#ef4444'
  }[d] || '#94a3b8')

  // Split-screen video interview workspace
  if (activeSession && activeSession.jitsiRoomName) {
    return (
      <div style={{ height: 'calc(100vh - 60px)', display: 'grid', gridTemplateColumns: '3fr 2fr', background: '#080c14' }}>
        
        {/* Left pane: Video Call */}
        <div style={{ display: 'flex', flexDirection: 'column', borderRight: '1px solid rgba(99,102,241,0.15)' }}>
          <div style={{ padding: '12px 24px', background: '#0f172a', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(99,102,241,0.1)' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: 16, color: '#f1f5f9' }}>Mock Interview In Progress</h2>
              <span style={{ fontSize: 11, color: '#22d3ee', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Clock size={12} /> Real-time peer-to-peer workspace
              </span>
            </div>
            <button className="btn btn-outline btn-sm" onClick={handleLeaveCall}>
              <X size={14} /> Leave Interview
            </button>
          </div>
          <div style={{ flex: 1, padding: 16 }}>
            <JitsiVideoRoom
              roomName={activeSession.jitsiRoomName}
              displayName={user?.name || 'User'}
              email={user?.email || ''}
              onReadyToClose={handleLeaveCall}
            />
          </div>
        </div>

        {/* Right pane: Problem description & Notepad */}
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#0b111e' }}>
          <div style={{ padding: '16px 20px', background: '#0f172a', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontWeight: 600, fontSize: 14, color: '#f1f5f9' }}>Interview Workspace</span>
            <button className="btn btn-secondary btn-sm" onClick={handleShuffleProblem} disabled={loadingProblem} style={{ fontSize: 12, height: 28 }}>
              {loadingProblem ? <Loader2 size={12} className="spinner" /> : <><Shuffle size={12} /> Shuffle Problem</>}
            </button>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Problem card */}
            {activeProblem ? (
              <div className="card" style={{ background: 'rgba(255,255,255,0.02)', padding: 16, border: '1px solid rgba(99,102,241,0.1)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <h3 style={{ margin: 0, fontSize: 16, color: '#fff' }}>{activeProblem.title}</h3>
                  <span style={{
                    fontSize: 11, fontWeight: 700,
                    color: difficultyColor(activeProblem.difficulty),
                    background: `${difficultyColor(activeProblem.difficulty)}15`,
                    padding: '2px 8px', borderRadius: 12
                  }}>{activeProblem.difficulty}</span>
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
                  {activeProblem.tags.map(t => <span key={t} className="tag" style={{ background: 'rgba(99,102,241,0.1)', color: '#818cf8', fontSize: 11 }}>{t}</span>)}
                </div>
                <p style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.5, whiteSpace: 'pre-wrap', margin: 0 }}>
                  {activeProblem.description}
                </p>
                {activeProblem.leetcodeLink && (
                  <a href={activeProblem.leetcodeLink} target="_blank" rel="noopener noreferrer" className="btn btn-outline btn-sm" style={{ marginTop: 14, fontSize: 11, padding: '4px 10px', textDecoration: 'none' }}>
                    View on LeetCode
                  </a>
                )}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: 20, color: '#64748b' }}>
                <Loader2 className="spinner" /> Loading Problem Statement...
              </div>
            )}

            {/* Collaborative Notepad */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 250 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 8, display: 'flex', justifyItems: 'center', gap: 4 }}>
                <Star size={12} color="#f59e0b" /> Shared Collaborative Notepad
              </div>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                style={{
                  flex: 1, width: '100%', padding: 14,
                  background: '#0d1527', border: '1px solid rgba(99,102,241,0.2)',
                  borderRadius: 12, color: '#a5b4fc', fontFamily: 'monospace',
                  fontSize: 13, resize: 'none', outline: 'none', lineHeight: 1.6
                }}
                placeholder="// Collaborate, design, or solve your coding problem here..."
              />
            </div>
          </div>
        </div>

      </div>
    )
  }

  return (
    <div className="page-container fade-in">
      {showReview && (
        <PeerReviewModal
          onClose={() => setShowReview(null)}
          onSubmit={handleReviewSubmit}
          submitting={submittingReview}
        />
      )}

      {/* Title */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 28, display: 'flex', alignItems: 'center', gap: 12 }}>
            <Users color="#6366f1" /> Mock Interview Matcher
          </h1>
          <p style={{ color: '#94a3b8', margin: '4px 0 0 0' }}>Select an available hour from the interactive grid below to schedule or match instantly with a peer.</p>
        </div>
        <div style={{ display: 'flex', gap: 12, background: 'rgba(99,102,241,0.08)', padding: '10px 18px', borderRadius: 12, border: '1px solid rgba(99,102,241,0.15)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#f1f5f9' }}>
            <Award size={18} color="#f59e0b" />
            <span>Peer Reviewers Earn <strong style={{ color: '#f59e0b' }}>+50 XP</strong></span>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 28, alignItems: 'start' }}>
        
        {/* Interactive Availability Calendar Grid */}
        <div className="card" style={{ padding: 24, overflowX: 'auto' }}>
          <h3 style={{ margin: '0 0 20px 0', display: 'flex', alignItems: 'center', gap: 8, color: '#f1f5f9' }}>
            <CalendarIcon size={18} color="#22d3ee" /> Real-time Availability Grid
          </h3>

          <div style={{ minWidth: 600 }}>
            {/* Grid Header */}
            <div style={{ display: 'grid', gridTemplateColumns: '70px repeat(7, 1fr)', gap: 8, marginBottom: 12, textAlign: 'center' }}>
              <div style={{ alignSelf: 'center', fontSize: 11, fontWeight: 700, color: '#64748b' }}>TIME (UTC)</div>
              {days.map((day, idx) => (
                <div key={idx} style={{ padding: '8px 4px', background: 'rgba(99,102,241,0.05)', borderRadius: 8, border: '1px solid rgba(99,102,241,0.08)' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: idx === 0 ? '#6366f1' : '#cbd5e1' }}>
                    {idx === 0 ? 'TODAY' : day.toLocaleDateString([], { weekday: 'short' })}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: idx === 0 ? '#818cf8' : '#f1f5f9', marginTop: 2 }}>
                    {day.getDate()}
                  </div>
                </div>
              ))}
            </div>

            {/* Grid Rows */}
            {hours.map(hr => (
              <div key={hr} style={{ display: 'grid', gridTemplateColumns: '70px repeat(7, 1fr)', gap: 8, marginBottom: 8, alignItems: 'center' }}>
                {/* Time Label */}
                <div style={{ textAlign: 'center', fontSize: 12, fontWeight: 600, color: '#64748b' }}>
                  {hr}:00
                </div>

                {/* Days cells */}
                {days.map((day, dayIdx) => {
                  const session = getSlotStatus(day, hr)
                  const isHost = session?.hostUserId === user?.userId
                  
                  let bg = 'rgba(255,255,255,0.01)'
                  let border = '1px solid rgba(255,255,255,0.05)'
                  let content = <span style={{ fontSize: 16, color: '#475569', fontWeight: 600 }}>+</span>
                  let cursor = 'pointer'

                  if (session) {
                    cursor = 'default'
                    if (session.status === 'MATCHED') {
                      bg = 'rgba(16,185,129,0.08)'
                      border = '1px solid rgba(16,185,129,0.3)'
                      content = <CheckCircle size={14} color="#10b981" />
                    } else if (session.status === 'PENDING') {
                      bg = isHost ? 'rgba(99,102,241,0.12)' : 'rgba(34,211,238,0.08)'
                      border = isHost ? '1px solid rgba(99,102,241,0.3)' : '1px solid rgba(34,211,238,0.2)'
                      content = <span style={{ fontSize: 10, color: isHost ? '#818cf8' : '#22d3ee', fontWeight: 700 }}>{isHost ? 'MINE' : 'JOIN'}</span>
                      cursor = isHost ? 'default' : 'pointer'
                    } else if (session.status === 'COMPLETED') {
                      bg = 'rgba(100,116,139,0.1)'
                      border = '1px solid rgba(100,116,139,0.2)'
                      content = <span style={{ fontSize: 9, color: '#94a3b8', fontWeight: 700 }}>DONE</span>
                    }
                  }

                  return (
                    <button
                      key={dayIdx}
                      disabled={scheduling || !!(session && isHost) || !!(session && session.status === 'COMPLETED') || !!(session && session.status === 'MATCHED')}
                      onClick={() => handleCellClick(day, hr)}
                      style={{
                        height: 42,
                        background: bg,
                        border: border,
                        borderRadius: 8,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: cursor,
                        transition: 'transform 0.15s, background 0.15s, border-color 0.15s'
                      }}
                      onMouseEnter={e => {
                        if (!e.currentTarget.disabled) {
                          e.currentTarget.style.transform = 'scale(1.05)'
                          e.currentTarget.style.background = 'rgba(99,102,241,0.08)'
                          e.currentTarget.style.borderColor = 'rgba(99,102,241,0.3)'
                        }
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.transform = 'scale(1)'
                        e.currentTarget.style.background = bg
                        e.currentTarget.style.borderColor = session ? border.split(' ')[2] : 'rgba(255,255,255,0.05)'
                      }}
                    >
                      {content}
                    </button>
                  )
                })}
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 16, marginTop: 20, fontSize: 12, color: '#94a3b8', justifyContent: 'center' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ width: 12, height: 12, background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 3 }} /> Scheduled by You</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ width: 12, height: 12, background: 'rgba(34,211,238,0.08)', border: '1px solid rgba(34,211,238,0.2)', borderRadius: 3 }} /> Available from Peer</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ width: 12, height: 12, background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 3 }} /> Matched & Confirmed</span>
          </div>
        </div>

        {/* Upcoming Sessions Panel */}
        <div className="card" style={{ padding: 24 }}>
          <h3 style={{ margin: '0 0 20px 0', display: 'flex', alignItems: 'center', gap: 8, color: '#f1f5f9' }}>
            <Clock size={18} color="#6366f1" /> Your Interview Board
          </h3>
          
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><Loader2 className="spinner" color="#6366f1" /></div>
          ) : sessions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', background: 'rgba(255,255,255,0.01)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.05)' }}>
              <Users size={32} color="#475569" style={{ marginBottom: 12, opacity: 0.5 }} />
              <div style={{ color: '#94a3b8', fontSize: 13 }}>You have no scheduled mock interviews.</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxHeight: 400, overflowY: 'auto', paddingRight: 4 }}>
              {sessions.map(s => {
                const date = new Date(s.scheduledTime)
                const isPast = date.getTime() + 60 * 60 * 1000 < Date.now()
                const canJoin = s.status === 'MATCHED' && !isPast && (date.getTime() - Date.now() < 30 * 60 * 1000) // 30 mins before
                
                return (
                  <div key={s.id} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: 14, background: 'rgba(255,255,255,0.02)', borderRadius: 12,
                    border: '1px solid rgba(255,255,255,0.04)',
                    borderLeft: `4px solid ${s.status === 'MATCHED' ? '#10b981' : s.status === 'COMPLETED' ? '#64748b' : '#6366f1'}`
                  }}>
                    <div>
                      <div style={{ fontWeight: 600, color: '#f1f5f9', fontSize: 13, marginBottom: 2 }}>
                        {date.toLocaleDateString([], { month: 'short', day: 'numeric' })} at {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      <div style={{ fontSize: 11, display: 'flex', gap: 10, color: '#94a3b8' }}>
                        <span>Status: <strong style={{ color: s.status === 'MATCHED' ? '#10b981' : '#818cf8' }}>{s.status}</strong></span>
                        {s.peerUserId && <span>Matched</span>}
                      </div>
                    </div>
                    <div>
                      {s.status === 'PENDING' && (
                        <div style={{ fontSize: 11, color: '#818cf8', background: 'rgba(99,102,241,0.1)', padding: '4px 10px', borderRadius: 12 }}>
                          Pending Peer
                        </div>
                      )}
                      {s.status === 'COMPLETED' && (
                        <div style={{ fontSize: 11, color: '#94a3b8', background: 'rgba(100,116,139,0.1)', padding: '4px 10px', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                          <CheckCircle size={10} /> Done
                        </div>
                      )}
                      {s.status === 'MATCHED' && !isPast && (
                        <button 
                          className="btn btn-primary btn-sm" 
                          disabled={!canJoin}
                          onClick={() => handleJoin(s)}
                          style={{ fontSize: 11, height: 28 }}
                        >
                          <Video size={12} /> {canJoin ? 'Join Call' : 'Starts Soon'}
                        </button>
                      )}
                    </div>
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
