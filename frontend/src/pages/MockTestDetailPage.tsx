import { useCallback, useEffect, useRef, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { api } from '../context/AuthContext'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import html2canvas from 'html2canvas'
import { Clock, Share2, Medal } from 'lucide-react'

interface Question {
  id: string
  text: string
  options: string[]
  marks: number
}
interface MockTest {
  id: string
  title: string
  questions: Question[]
  duration: number
  totalMarks: number
}
interface MockResult {
  score: number
  rank: number
  totalUsers: number
  badge: string
}

export default function MockTestDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [sp] = useSearchParams()
  const { user } = useAuth()

  const [test, setTest] = useState<MockTest | null>(null)
  const [tab, setTab] = useState<'test' | 'leaderboard'>(sp.get('tab') === 'leaderboard' ? 'leaderboard' : 'test')
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [timeLeft, setTimeLeft] = useState(0)
  const [submitted, setSubmitted] = useState(false)
  const [result, setResult] = useState<MockResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [leaderboard, setLeaderboard] = useState<any[]>([])
  const shareCardRef = useRef<HTMLDivElement>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    Promise.all([
      api.get(`/api/mock-tests/${id}`),
      api.get(`/api/mock-tests/${id}/leaderboard`)
    ]).then(([t, l]) => {
      setTest(t.data)
      setTimeLeft(t.data.duration * 60)
      setLeaderboard(l.data.content || [])
    }).catch(() => toast.error('Failed to load test'))
    .finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    if (!test || submitted) return
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!)
          handleSubmit()
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [test, submitted])

  const handleSubmit = useCallback(async () => {
    if (submitting || submitted) return
    setSubmitting(true)
    try {
      const res = await api.post(`/api/mock-tests/${id}/submit`, answers)
      setResult(res.data)
      setSubmitted(true)
      clearInterval(timerRef.current!)
      toast.success('Test submitted! Results ready 🎉')
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Submission failed')
    } finally {
      setSubmitting(false)
    }
  }, [id, answers, submitting, submitted])

  const shareCard = async () => {
    if (!shareCardRef.current) return
    try {
      const canvas = await html2canvas(shareCardRef.current, { backgroundColor: null })
      canvas.toBlob(blob => {
        if (!blob) return
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'my-rank-card.png'
        a.click()
        URL.revokeObjectURL(url)
      })
    } catch {
      toast.error('Could not generate share card')
    }
  }

  const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
  const badgeColor = { GOLD: '#f59e0b', SILVER: '#94a3b8', BRONZE: '#b45309', PARTICIPANT: '#6366f1' }

  if (loading) return <div className="page"><div className="skeleton" style={{ height: 400 }} /></div>
  if (!test) return <div className="page"><p>Test not found.</p></div>

  return (
    <div className="page">
      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {(['test', 'leaderboard'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`btn btn-sm ${tab === t ? 'btn-primary' : 'btn-outline'}`}>
            {t === 'test' ? '📝 Test' : '🏆 Leaderboard'}
          </button>
        ))}
      </div>

      {tab === 'test' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <h2>{test.title}</h2>
            {!submitted && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                background: timeLeft < 300 ? 'rgba(239,68,68,0.15)' : 'rgba(99,102,241,0.15)',
                border: `1px solid ${timeLeft < 300 ? 'rgba(239,68,68,0.3)' : 'rgba(99,102,241,0.3)'}`,
                padding: '8px 16px', borderRadius: 10,
                color: timeLeft < 300 ? '#ef4444' : '#818cf8',
                fontWeight: 700, fontSize: 18,
              }}>
                <Clock size={18} />
                {fmt(timeLeft)}
              </div>
            )}
          </div>

          {submitted && result ? (
            <div className="fade-in">
              {/* Result summary */}
              <div className="card" style={{ marginBottom: 20, textAlign: 'center', padding: 40 }}>
                <Medal size={56} color={badgeColor[result.badge as keyof typeof badgeColor]} style={{ margin: '0 auto 16px' }} />
                <h2 style={{ marginBottom: 8 }}>🎉 Test Completed!</h2>
                <div style={{ display: 'flex', justifyContent: 'center', gap: 32, marginTop: 24, flexWrap: 'wrap' }}>
                  {[
                    { label: 'Score', value: result.score },
                    { label: 'Rank', value: `#${result.rank}` },
                    { label: 'Participants', value: result.totalUsers },
                    { label: 'Badge', value: result.badge },
                  ].map(({ label, value }) => (
                    <div key={label} style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 28, fontWeight: 800, color: '#818cf8' }}>{value}</div>
                      <div style={{ color: '#64748b', fontSize: 13 }}>{label}</div>
                    </div>
                  ))}
                </div>
                <button className="btn btn-primary" style={{ marginTop: 24 }} onClick={shareCard} id="btn-share-card">
                  <Share2 size={16} /> Download Rank Card
                </button>
              </div>

              {/* Shareable card (hidden DOM for html2canvas) */}
              <div style={{ position: 'absolute', left: -9999, top: 0 }}>
                <div ref={shareCardRef} className="share-card">
                  <div style={{ position: 'relative', zIndex: 1 }}>
                    <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 8 }}>DSA Tracker Platform</div>
                    <h2 style={{ color: '#f1f5f9', marginBottom: 4 }}>{user?.name}</h2>
                    <p style={{ color: '#94a3b8', marginBottom: 24, fontSize: 14 }}>{test.title}</p>
                    <div style={{ display: 'flex', gap: 20 }}>
                      {[
                        { label: 'Score', val: result.score, color: '#818cf8' },
                        { label: 'Rank', val: `#${result.rank}`, color: '#22d3ee' },
                        { label: 'Badge', val: result.badge, color: badgeColor[result.badge as keyof typeof badgeColor] },
                      ].map(({ label, val, color }) => (
                        <div key={label} style={{
                          flex: 1, background: 'rgba(255,255,255,0.05)',
                          borderRadius: 12, padding: '16px 12px', textAlign: 'center',
                        }}>
                          <div style={{ fontSize: 22, fontWeight: 800, color }}>{val}</div>
                          <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>{label}</div>
                        </div>
                      ))}
                    </div>
                    <div style={{ marginTop: 20, fontSize: 12, color: '#475569' }}>dsa-tracker.vercel.app</div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Questions */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {test.questions.map((q, i) => (
                  <div key={q.id} className="card">
                    <p style={{ fontWeight: 600, marginBottom: 16, fontSize: 15 }}>
                      <span style={{ color: '#6366f1', marginRight: 8 }}>Q{i + 1}.</span>
                      {q.text}
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {q.options.map((opt, idx) => (
                        <label key={idx} style={{
                          display: 'flex', alignItems: 'center', gap: 12,
                          padding: '12px 16px', borderRadius: 10, cursor: 'pointer',
                          border: `1px solid ${answers[q.id] === idx ? 'rgba(99,102,241,0.5)' : 'rgba(99,102,241,0.1)'}`,
                          background: answers[q.id] === idx ? 'rgba(99,102,241,0.12)' : 'rgba(99,102,241,0.04)',
                          transition: 'all 0.15s',
                        }}>
                          <input
                            type="radio"
                            name={q.id}
                            value={idx}
                            checked={answers[q.id] === idx}
                            onChange={() => setAnswers(prev => ({ ...prev, [q.id]: idx }))}
                            style={{ accentColor: '#6366f1' }}
                            id={`q${i}-opt${idx}`}
                          />
                          <span style={{ fontSize: 14 }}>{opt}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 24 }}>
                <button
                  className="btn btn-primary btn-lg"
                  onClick={handleSubmit}
                  disabled={submitting}
                  id="btn-submit-test"
                >
                  {submitting ? <><div className="spinner" style={{ width: 16, height: 16 }} /> Submitting...</> : 'Submit Test 🚀'}
                </button>
              </div>
            </>
          )}
        </>
      )}

      {tab === 'leaderboard' && (
        <div className="card">
          <h3 style={{ marginBottom: 20 }}>🏆 Leaderboard – Top 100</h3>
          {leaderboard.length === 0 ? (
            <p style={{ color: '#64748b' }}>No results yet. Be the first!</p>
          ) : (
            <div className="overflow-x-auto">
              <div className="min-w-600" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {leaderboard.map((r: any, i) => (
                <div key={r.id} style={{
                  display: 'flex', alignItems: 'center', gap: 16,
                  padding: '12px 16px', borderRadius: 10,
                  background: i < 3 ? 'rgba(99,102,241,0.1)' : 'rgba(99,102,241,0.04)',
                  border: `1px solid ${i < 3 ? 'rgba(99,102,241,0.25)' : 'rgba(99,102,241,0.08)'}`,
                }}>
                  <span style={{ width: 28, fontWeight: 700, fontSize: 16, color: ['#f59e0b', '#94a3b8', '#b45309'][i] || '#64748b' }}>
                    #{i + 1}
                  </span>
                  <span style={{ flex: 1, fontSize: 14, color: '#f1f5f9' }}>{r.userId}</span>
                  <span style={{ fontWeight: 700, color: '#818cf8' }}>{r.score} pts</span>
                  <span className={`badge badge-${(r.badge || '').toLowerCase()}`}>{r.badge}</span>
                </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
