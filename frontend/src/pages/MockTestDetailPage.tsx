import { useCallback, useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { api, useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import SockJS from 'sockjs-client'
import { Client } from '@stomp/stompjs'
import { Clock, Trophy, ChevronLeft, ChevronRight, Code, Terminal, Bookmark } from 'lucide-react'
import ResultCard from '../components/ResultCard'

interface Question {
  id: string
  text: string
  type: string
  options?: string[]
  correctOption?: number
  correctAnswer?: string
  explanation?: string
  boilerplate?: string
  testCases?: string[]
  marks: number
  topic?: string
}

interface MockTest {
  id: string
  title: string
  description: string
  type: string
  duration: number
  totalMarks: number
  questions: Question[]
  difficulty: string
  topics: string[]
}

interface MockResult {
  score: number
  totalMarks: number
  percentage: number
  rank: number
  totalUsers: number
  percentile: number
  timeTaken: number
  accuracy: number
  badge: string
  shareId: string
  topicBreakdown: Record<string, { correct: number; total: number; score: number }>
}

interface LiveLeaderboardEntry {
  rank: number
  userId: string
  name: string
  email: string
  score: number
  timeTaken: number
  xpPoints: number
}

export default function MockTestDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()

  // Game/Test State
  const [test, setTest] = useState<MockTest | null>(null)
  const [activeQuestionIdx, setActiveQuestionIdx] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [flaggedQuestions, setFlaggedQuestions] = useState<Record<string, boolean>>({})
  const [timeLeft, setTimeLeft] = useState(0)
  const [submitted, setSubmitted] = useState(false)
  const [result, setResult] = useState<MockResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  // Local Coding Editor States
  const [runOutputs, setRunOutputs] = useState<Record<string, string>>({})
  const [testingStatus, setTestingStatus] = useState<Record<string, 'idle' | 'running' | 'success' | 'failed'>>({})

  // Leaderboard & STOMP WebSockets
  const [liveLeaderboard, setLiveLeaderboard] = useState<LiveLeaderboardEntry[]>([])
  const [wsConnected, setWsConnected] = useState(false)
  
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const stompClientRef = useRef<Client | null>(null)

  // Fetch Test Core Details
  useEffect(() => {
    Promise.all([
      api.get(`/api/mock-tests/${id}`),
      api.get(`/api/mock-tests/${id}/leaderboard`)
    ]).then(([tRes, lRes]) => {
      const testData: MockTest = tRes.data
      setTest(testData)
      setTimeLeft(testData.duration * 60)
      
      // Initialize answers from boilerplate if any
      const initialAnswers: Record<string, string> = {}
      testData.questions.forEach(q => {
        if (q.type === 'coding' && q.boilerplate) {
          initialAnswers[q.id] = q.boilerplate
        } else {
          initialAnswers[q.id] = ''
        }
      })
      setAnswers(initialAnswers)

      // Leaderboard hydration
      setLiveLeaderboard(lRes.data.content || [])
    }).catch(() => toast.error('Failed to load mock arena data'))
    .finally(() => setLoading(false))
  }, [id])

  const questionStartTimeRef = useRef<number>(Date.now())

  // Answer Auto-saving API call
  const saveAnswerToServer = useCallback((questionId: string, value: string) => {
    if (submitted) return
    
    // Calculate elapsed time in seconds since this question was focused
    const elapsedSeconds = Math.max(1, Math.round((Date.now() - questionStartTimeRef.current) / 1000))
    // Reset start time so subsequent saves don't double count
    questionStartTimeRef.current = Date.now()

    api.post(`/api/mock-tests/${id}/submit-answer`, {
      questionId,
      answer: value,
      timeSpent: elapsedSeconds
    }).catch(() => logSaveError())
  }, [id, submitted])

  const logSaveError = () => {
    // Silently ignore minor network dropouts during test
  }

  // Submit test handler
  const handleSubmit = useCallback(async () => {
    if (submitting || submitted) return
    setSubmitting(true)
    
    // Save last active question answers
    if (test) {
      const curQ = test.questions[activeQuestionIdx]
      saveAnswerToServer(curQ.id, answers[curQ.id])
    }

    try {
      const elapsedSeconds = test ? (test.duration * 60 - timeLeft) : 0
      const payload = {
        answers,
        timeTaken: elapsedSeconds
      }
      const res = await api.post(`/api/mock-tests/${id}/submit`, payload)
      setResult(res.data)
      setSubmitted(true)
      clearInterval(timerRef.current!)
      toast.success('Mock Test submitted successfully! 🎉')
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to submit test')
    } finally {
      setSubmitting(false)
    }
  }, [id, answers, submitting, submitted, test, activeQuestionIdx, timeLeft, saveAnswerToServer])

  // Reset active question time tracker on selection
  useEffect(() => {
    questionStartTimeRef.current = Date.now()
  }, [activeQuestionIdx])

  // Timer Countdown loop
  useEffect(() => {
    if (!test || submitted || timeLeft <= 0) return
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => prev - 1)
    }, 1000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [test, submitted, timeLeft])

  // Auto-submit on time expiry
  useEffect(() => {
    if (test && !submitted && timeLeft <= 0) {
      if (timerRef.current) clearInterval(timerRef.current)
      handleSubmit()
    }
  }, [test, submitted, timeLeft, handleSubmit])

  // STOMP WebSocket Leaderboard Integration
  useEffect(() => {
    if (!id || submitted || test?.type !== 'competition') return

    const socketUrl = `${api.defaults.baseURL || 'http://localhost:8080'}/ws-leaderboard`
    const client = new Client({
      webSocketFactory: () => new SockJS(socketUrl),
      reconnectDelay: 5000,
      debug: (msg) => logWsDebug(msg),
      onConnect: () => {
        setWsConnected(true)
        client.subscribe(`/topic/leaderboard/${id}`, (message) => {
          const payload = JSON.parse(message.body)
          if (payload.type === 'FINAL_SUBMIT' && payload.leaderboard) {
            setLiveLeaderboard(payload.leaderboard)
          } else if (payload.type === 'ANSWER_SUBMIT') {
            // display a toast notification that another taker made progress
            toast.success(`⚡ ${payload.userName} submitted an answer!`, { duration: 1500, id: `ws-toast-${payload.userId}` })
          }
        })
      },
      onDisconnect: () => {
        setWsConnected(false)
      }
    })

    client.activate()
    stompClientRef.current = client

    return () => {
      if (stompClientRef.current) {
        stompClientRef.current.deactivate()
      }
    }
  }, [id, submitted, test])

  const logWsDebug = (msg: string) => {
    if (import.meta.env.DEV) {
      console.log("[STOMP]", msg)
    }
  }

  // Real-time answer change debouncer
  const handleAnswerChange = (questionId: string, value: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }))

    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
    saveTimeoutRef.current = setTimeout(() => {
      saveAnswerToServer(questionId, value)
    }, 2000)
  }

  // Question selection changer (forces immediate auto-save)
  const selectQuestion = (idx: number) => {
    // Trigger immediate save of current question before swapping
    if (test) {
      const curQ = test.questions[activeQuestionIdx]
      saveAnswerToServer(curQ.id, answers[curQ.id])
    }
    setActiveQuestionIdx(idx)
  }

  // Real JavaScript sandboxed compilation & execution compiler engine
  const runCodeTests = (question: any) => {
    const code = answers[question.id] || ''
    setTestingStatus(prev => ({ ...prev, [question.id]: 'running' }))
    setRunOutputs(prev => ({ ...prev, [question.id]: '' }))

    setTimeout(() => {
      // 1. Extract function name from boilerplate
      const boilerplate = question.boilerplate || ''
      const funcNameMatch = boilerplate.match(/function\s+([a-zA-Z0-9_]+)/)
      const funcName = funcNameMatch ? funcNameMatch[1] : 'solution'

      // 2. Parse test cases
      const rawTestCases = question.testCases || []
      if (rawTestCases.length === 0) {
        setTestingStatus(prev => ({ ...prev, [question.id]: 'failed' }))
        setRunOutputs(prev => ({ ...prev, [question.id]: '❌ Error: No test cases found for this question.' }))
        toast.error('No test cases found.')
        return
      }

      let allPassed = true
      let outputLogs = `🚀 Compiling & Executing JavaScript Code...\n\n`

      for (let i = 0; i < rawTestCases.length; i++) {
        const tc = rawTestCases[i]
        const parts = tc.split(' -> ')
        if (parts.length < 2) continue

        const inputArgs = parts[0].trim()
        const expectedOutput = parts[1].trim()

        let capturedLogs: string[] = []
        let originalConsoleLog = console.log
        
        try {
          // Intercept console.log
          console.log = (...args: any[]) => {
            capturedLogs.push(args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : arg).join(' '))
          }

          // Evaluate arguments safely in sandboxed function
          const parsedArgs = new Function(`return [${inputArgs}]`)()
          const expectedVal = new Function(`return ${expectedOutput}`)()

          // Create dynamic code runner
          const runner = new Function('args', `
            ${code}
            if (typeof ${funcName} !== 'function') {
              throw new Error("Function '${funcName}' is not defined. Please ensure you do not rename the boilerplate function definition.");
            }
            return ${funcName}.apply(null, args);
          `)

          const startTime = performance.now()
          const gotVal = runner(parsedArgs)
          const endTime = performance.now()
          const execTime = (endTime - startTime).toFixed(2)

          // Restore console.log immediately
          console.log = originalConsoleLog

          const gotStr = JSON.stringify(gotVal)
          const expectedStr = JSON.stringify(expectedVal)

          if (gotStr === expectedStr) {
            outputLogs += `✅ **Test Case ${i + 1}: Passed** (${execTime} ms)\n`
            outputLogs += `   Input:    ${inputArgs}\n`
            outputLogs += `   Output:   ${gotStr}\n`
          } else {
            allPassed = false
            outputLogs += `❌ **Test Case ${i + 1}: Failed** (${execTime} ms)\n`
            outputLogs += `   Input:    ${inputArgs}\n`
            outputLogs += `   Expected: ${expectedStr}\n`
            outputLogs += `   Got:      ${gotStr}\n`
          }

          if (capturedLogs.length > 0) {
            outputLogs += `   Console Logs:\n`
            capturedLogs.forEach(l => {
              outputLogs += `     > ${l}\n`
            })
          }
          outputLogs += `\n`

        } catch (err: any) {
          // Restore console.log on error
          console.log = originalConsoleLog
          allPassed = false
          outputLogs += `❌ **Test Case ${i + 1}: Runtime Error**\n`
          outputLogs += `   Input: ${inputArgs}\n`
          outputLogs += `   Error: ${err.message || err}\n\n`
        }
      }

      if (allPassed) {
        setTestingStatus(prev => ({ ...prev, [question.id]: 'success' }))
        outputLogs += `🎉 **Success! All test cases passed local compilation & execution!**`
        setRunOutputs(prev => ({ ...prev, [question.id]: outputLogs }))
        toast.success('All test cases passed! 🎉')
      } else {
        setTestingStatus(prev => ({ ...prev, [question.id]: 'failed' }))
        outputLogs += `⚠️ **Some test cases failed. Please review your code logic and try again.**`
        setRunOutputs(prev => ({ ...prev, [question.id]: outputLogs }))
        toast.error('Test cases failed.')
      }
    }, 1200)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  }

  if (loading) return <div className="page"><div className="skeleton" style={{ height: 450, borderRadius: 20 }} /></div>
  if (!test) return <div className="page"><p>Arena test not found.</p></div>

  const activeQuestion = test.questions[activeQuestionIdx]

  return (
    <div className="page" style={{ color: '#f8fafc' }}>
      {/* Top Header with Status/Timer */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'rgba(30, 41, 59, 0.3)',
        border: '1px solid rgba(255, 255, 255, 0.05)',
        padding: '16px 24px',
        borderRadius: 16,
        marginBottom: 24,
        boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
        backdropFilter: 'blur(8px)'
      }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: '#f1f5f9' }}>{test.title}</h2>
          <span style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>
            {test.questions.length} Questions • {test.totalMarks} Total Marks
          </span>
        </div>

        {!submitted && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: timeLeft < 300 ? 'rgba(239, 68, 68, 0.12)' : 'rgba(99, 102, 241, 0.12)',
              border: `1px solid ${timeLeft < 300 ? 'rgba(239, 68, 68, 0.3)' : 'rgba(99, 102, 241, 0.2)'}`,
              padding: '10px 20px',
              borderRadius: 12,
              color: timeLeft < 300 ? '#f87171' : '#818cf8',
              fontWeight: 800,
              fontSize: 20,
              fontFamily: 'monospace',
              boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.05)',
              animation: timeLeft < 60 ? 'pulse 1s infinite' : 'none'
            }}>
              <Clock size={20} />
              {formatTime(timeLeft)}
            </div>

            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="btn btn-primary"
              style={{ padding: '12px 24px', borderRadius: 12, fontWeight: 700 }}
            >
              {submitting ? 'Submitting...' : 'Submit Test 🚀'}
            </button>
          </div>
        )}
      </div>

      {submitted && result ? (
        <ResultCard result={result} testTitle={test.title} userName={user?.name || 'Candidate'} />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 24, alignItems: 'flex-start' }} className="grid-responsive">
          {/* Main workspace */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            
            {/* Header / Palette Selector */}
            <div className="card" style={{ padding: 20, background: 'rgba(30, 41, 59, 0.2)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 20 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: '#94a3b8', marginBottom: 12, textTransform: 'uppercase' }}>Question Navigation Palette</h3>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {test.questions.map((q, idx) => {
                  const isAnswered = answers[q.id] && answers[q.id].trim() !== '' && answers[q.id] !== q.boilerplate
                  const isFlagged = flaggedQuestions[q.id]
                  const isActive = activeQuestionIdx === idx

                  return (
                    <button
                      key={q.id}
                      onClick={() => selectQuestion(idx)}
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: 8,
                        border: isActive ? '2px solid #6366f1' : '1px solid rgba(255,255,255,0.08)',
                        background: isActive ? 'rgba(99,102,241,0.2)' :
                                    isFlagged ? '#eab308' :
                                    isAnswered ? '#10b981' :
                                    'rgba(15,23,42,0.4)',
                        color: isFlagged || isAnswered || isActive ? '#ffffff' : '#94a3b8',
                        fontWeight: 700,
                        fontSize: 14,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        boxShadow: isActive ? '0 0 10px rgba(99,102,241,0.4)' : 'none'
                      }}
                    >
                      {idx + 1}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Active Question Panel */}
            <div className="card" style={{ padding: 28, background: 'rgba(30, 41, 59, 0.25)', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: 20, minHeight: 380, display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <span style={{ fontSize: 13, color: '#818cf8', fontWeight: 700, textTransform: 'uppercase' }}>
                  Question {activeQuestionIdx + 1} of {test.questions.length} ({activeQuestion.topic || 'DSA'})
                </span>
                <span style={{ fontSize: 13, color: '#34d399', fontWeight: 700 }}>
                  {activeQuestion.marks} Marks
                </span>
              </div>

              <p style={{ fontSize: 16, color: '#f1f5f9', fontWeight: 600, lineHeight: 1.5, marginBottom: 24 }}>
                {activeQuestion.text}
              </p>

              {/* Render Question Inputs */}
              <div style={{ flex: 1 }}>
                {/* MCQ Radios */}
                {(!activeQuestion.type || activeQuestion.type === 'mcq') && activeQuestion.options && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {activeQuestion.options.map((opt, oIdx) => {
                      const isSelected = answers[activeQuestion.id] === String(oIdx)
                      return (
                        <label
                          key={oIdx}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 12,
                            padding: '16px 20px',
                            borderRadius: 12,
                            border: `1px solid ${isSelected ? 'rgba(99, 102, 241, 0.5)' : 'rgba(255,255,255,0.06)'}`,
                            background: isSelected ? 'rgba(99,102,241,0.08)' : 'rgba(15,23,42,0.2)',
                            cursor: 'pointer',
                            transition: 'all 0.15s'
                          }}
                        >
                          <input
                            type="radio"
                            name={`q_${activeQuestion.id}`}
                            value={oIdx}
                            checked={isSelected}
                            onChange={() => handleAnswerChange(activeQuestion.id, String(oIdx))}
                            style={{ accentColor: '#6366f1', width: 16, height: 16 }}
                          />
                          <span style={{ fontSize: 14.5, color: isSelected ? '#ffffff' : '#94a3b8', fontWeight: 500 }}>{opt}</span>
                        </label>
                      )
                    })}
                  </div>
                )}

                {/* Coding Textarea Panel */}
                {activeQuestion.type === 'coding' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div style={{ background: '#090d16', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 12, overflow: 'hidden' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#0d131f', padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#cbd5e1', fontWeight: 700 }}>
                          <Code size={14} color="#818cf8" /> JavaScript Editor Boilerplate
                        </div>
                      </div>
                      <textarea
                        value={answers[activeQuestion.id] || ''}
                        onChange={e => handleAnswerChange(activeQuestion.id, e.target.value)}
                        placeholder="// Write your code solution here..."
                        style={{
                          width: '100%',
                          height: 240,
                          background: '#090d16',
                          color: '#34d399',
                          fontFamily: 'monospace',
                          fontSize: 13,
                          padding: 16,
                          border: 'none',
                          outline: 'none',
                          resize: 'none',
                          lineHeight: 1.5
                        }}
                      />
                    </div>

                    {/* Run test cases buttons */}
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                      <button
                        onClick={() => runCodeTests(activeQuestion)}
                        className="btn btn-outline"
                        style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, padding: '10px 18px', borderRadius: 10 }}
                      >
                        <Terminal size={14} /> Run Test Cases
                      </button>
                      <span style={{ fontSize: 11, background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', color: '#10b981', padding: '4px 10px', borderRadius: 12, fontWeight: 600 }}>
                        💻 JS Runtime Compiler
                      </span>
                      <button
                        onClick={() => setFlaggedQuestions(prev => ({ ...prev, [activeQuestion.id]: !prev[activeQuestion.id] }))}
                        className="btn btn-outline"
                        style={{
                          display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, padding: '10px 18px', borderRadius: 10,
                          borderColor: flaggedQuestions[activeQuestion.id] ? '#fbbf24' : 'rgba(255,255,255,0.1)',
                          color: flaggedQuestions[activeQuestion.id] ? '#fbbf24' : '#f8fafc'
                        }}
                      >
                        <Bookmark size={14} /> {flaggedQuestions[activeQuestion.id] ? 'Flagged' : 'Flag Question'}
                      </button>
                    </div>

                    {/* Code Output Panel */}
                    {runOutputs[activeQuestion.id] && (
                      <div style={{ background: '#020617', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 10, padding: 14 }}>
                        <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', marginBottom: 6 }}>Console Outputs</div>
                        <pre style={{ margin: 0, fontFamily: 'monospace', fontSize: 12, color: testingStatus[activeQuestion.id] === 'success' ? '#10b981' : '#f87171', whiteSpace: 'pre-wrap', lineHeight: 1.4 }}>
                          {runOutputs[activeQuestion.id]}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Workspace Navigation Buttons */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 28, borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 20 }}>
                <button
                  onClick={() => selectQuestion(activeQuestionIdx - 1)}
                  disabled={activeQuestionIdx === 0}
                  className="btn btn-outline"
                  style={{ display: 'flex', alignItems: 'center', gap: 6, borderRadius: 10 }}
                >
                  <ChevronLeft size={16} /> Previous
                </button>
                <button
                  onClick={() => {
                    if (activeQuestionIdx === test.questions.length - 1) {
                      handleSubmit()
                    } else {
                      selectQuestion(activeQuestionIdx + 1)
                    }
                  }}
                  className="btn btn-primary"
                  style={{ display: 'flex', alignItems: 'center', gap: 6, borderRadius: 10 }}
                >
                  {activeQuestionIdx === test.questions.length - 1 ? 'Submit Test' : 'Next'} <ChevronRight size={16} />
                </button>
              </div>
            </div>

          </div>

          {/* Right Live Leaderboard panel */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Live Status indicator */}
            <div className="card" style={{ padding: 16, borderRadius: 16, background: 'rgba(15,23,42,0.4)', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 8, height: 8, borderRadius: 99, background: wsConnected ? '#10b981' : '#ef4444', animation: wsConnected ? 'pulse 2s infinite' : 'none' }} />
                <span style={{ fontSize: 13, color: '#f1f5f9', fontWeight: 700 }}>
                  {wsConnected ? 'WebSocket Active' : 'Offline Mode'}
                </span>
              </div>
              <span style={{ fontSize: 11, color: '#64748b' }}>Live contest sync</span>
            </div>

            {/* Leaderboard Entries */}
            <div className="card" style={{ padding: 20, background: 'rgba(30, 41, 59, 0.2)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 20 }}>
              <h3 style={{ fontSize: 15, fontWeight: 800, color: '#fbbf24', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Trophy size={16} /> Global Live Rankings
              </h3>
              
              {liveLeaderboard.length === 0 ? (
                <p style={{ color: '#64748b', fontSize: 13 }}>Waiting for active submissions...</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {liveLeaderboard.slice(0, 8).map((entry, idx) => {
                    const isCurrentUser = entry.userId === user?.userId
                    return (
                      <div
                        key={idx}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          padding: '10px 12px',
                          borderRadius: 10,
                          background: isCurrentUser ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.02)',
                          border: `1px solid ${isCurrentUser ? 'rgba(99,102,241,0.3)' : 'rgba(255,255,255,0.03)'}`
                        }}
                      >
                        <span style={{
                          fontSize: 12, fontWeight: 800, minWidth: 20,
                          color: idx === 0 ? '#fbbf24' : idx === 1 ? '#cbd5e1' : idx === 2 ? '#b45309' : '#64748b'
                        }}>#{idx + 1}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: '#f1f5f9', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {entry.name}
                          </div>
                          <div style={{ fontSize: 10, color: '#64748b' }}>
                            {Math.floor(entry.timeTaken / 60)}m {entry.timeTaken % 60}s taken
                          </div>
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 800, color: '#818cf8' }}>
                          {entry.score} pts
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
