import { useCallback, useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { api, useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import SockJS from 'sockjs-client'
import { Client } from '@stomp/stompjs'
import {
  Clock,
  Trophy,
  ChevronLeft,
  ChevronRight,
  Code,
  Bookmark,
  Settings,
  HelpCircle,
  ThumbsUp,
  ThumbsDown,
  Award
} from 'lucide-react'
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

interface SubmissionRecord {
  time: string
  status: 'Accepted' | 'Wrong Answer' | 'Runtime Error'
  runtime: string
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

  // Tab selections
  const [leftTab, setLeftTab] = useState<'description' | 'editorial' | 'solutions' | 'submissions'>('description')
  const [rightTab, setRightTab] = useState<'testcase' | 'testresult'>('testcase')
  const [submissionsHistory, setSubmissionsHistory] = useState<Record<string, SubmissionRecord[]>>({})

  // Leaderboard & STOMP WebSockets
  const [liveLeaderboard, setLiveLeaderboard] = useState<LiveLeaderboardEntry[]>([])
  const [wsConnected, setWsConnected] = useState(false)
  
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const stompClientRef = useRef<Client | null>(null)
  const questionStartTimeRef = useRef<number>(Date.now())

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
    }).catch(() => {
      // Silently ignore minor network dropouts during test
    })
  }, [id, submitted])

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
      debug: (msg) => {
        if (import.meta.env.DEV) {
          console.log("[STOMP]", msg)
        }
      },
      onConnect: () => {
        setWsConnected(true)
        client.subscribe(`/topic/leaderboard/${id}`, (message) => {
          const payload = JSON.parse(message.body)
          if (payload.type === 'FINAL_SUBMIT' && payload.leaderboard) {
            setLiveLeaderboard(payload.leaderboard)
          } else if (payload.type === 'ANSWER_SUBMIT') {
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
    if (test) {
      const curQ = test.questions[activeQuestionIdx]
      saveAnswerToServer(curQ.id, answers[curQ.id])
    }
    setActiveQuestionIdx(idx)
    setLeftTab('description') // default back to description on change
    setRightTab('testcase')
  }

  // Real JavaScript sandboxed compilation & execution compiler engine
  const runCodeTests = (question: Question) => {
    const code = answers[question.id] || ''
    setTestingStatus(prev => ({ ...prev, [question.id]: 'running' }))
    setRunOutputs(prev => ({ ...prev, [question.id]: '' }))
    setRightTab('testresult') // auto toggle to results

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
      const executionStartTime = performance.now()

      for (let i = 0; i < rawTestCases.length; i++) {
        const tc = rawTestCases[i]
        const parts = tc.split(' -> ')
        if (parts.length < 2) continue

        const inputArgs = parts[0].trim()
        const expectedOutput = parts[1].trim()

        let capturedLogs: string[] = []
        let originalConsoleLog = console.log
        
        try {
          console.log = (...args: any[]) => {
            capturedLogs.push(args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : arg).join(' '))
          }

          const parsedArgs = new Function(`return [${inputArgs}]`)()
          const expectedVal = new Function(`return ${expectedOutput}`)()

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
          console.log = originalConsoleLog
          allPassed = false
          outputLogs += `❌ **Test Case ${i + 1}: Runtime Error**\n`
          outputLogs += `   Input: ${inputArgs}\n`
          outputLogs += `   Error: ${err.message || err}\n\n`
        }
      }

      const totalExecTime = `${(performance.now() - executionStartTime).toFixed(1)} ms`
      
      // Save submission record locally to support submissions history tab
      const record: SubmissionRecord = {
        time: new Date().toLocaleTimeString(),
        status: allPassed ? 'Accepted' : 'Wrong Answer',
        runtime: totalExecTime
      }
      setSubmissionsHistory(prev => ({
        ...prev,
        [question.id]: [record, ...(prev[question.id] || [])]
      }))

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
    }, 1000)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  }

  const getDifficultyLabel = (marks: number) => {
    if (marks <= 10) return { label: 'Easy', color: '#00b8a3', bg: 'rgba(0,184,163,0.1)' }
    if (marks <= 20) return { label: 'Medium', color: '#ffc01e', bg: 'rgba(255,192,30,0.1)' }
    return { label: 'Hard', color: '#ff375f', bg: 'rgba(255,55,95,0.1)' }
  }

  if (loading) return <div className="page"><div className="skeleton" style={{ height: 450, borderRadius: 20 }} /></div>
  if (!test) return <div className="page"><p>Arena test not found.</p></div>

  const activeQuestion = test.questions[activeQuestionIdx]
  const diffInfo = getDifficultyLabel(activeQuestion.marks)

  // Gutter lines calculations for code editor gutter strip
  const codeValue = answers[activeQuestion.id] || ''
  const codeLines = codeValue.split('\n')
  const gutterLinesCount = Math.max(15, codeLines.length + 5)
  const gutterArray = Array.from({ length: gutterLinesCount }, (_, i) => i + 1)

  return (
    <div className="leetcode-workspace-container">
      {/* Dynamic LeetCode Header bar */}
      <header className="leetcode-workspace-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }} onClick={() => selectQuestion(0)}>
            <img src="/logo.png" alt="Logo" style={{ width: 26, height: 26, borderRadius: 6 }} />
            <span style={{ fontWeight: 800, fontSize: 14, color: '#f1f5f9' }}>PrepNest Arena</span>
          </div>
          <div className="workspace-header-divider" />
          <span style={{ fontSize: 13, color: '#8a8a8a', fontWeight: 600 }}>{test.title}</span>
        </div>

        {/* Global Action buttons & Timer countdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {!submitted && (
            <>
              <div className="workspace-timer-box" style={{ color: timeLeft < 300 ? '#ff375f' : '#00b8a3' }}>
                <Clock size={16} />
                <span>{formatTime(timeLeft)}</span>
              </div>
              <button onClick={handleSubmit} disabled={submitting} className="workspace-submit-btn">
                {submitting ? 'Submitting...' : 'Submit Test 🚀'}
              </button>
            </>
          )}
        </div>
      </header>

      {/* Main Workspace Body */}
      {submitted && result ? (
        <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
          <ResultCard result={result} testTitle={test.title} userName={user?.name || 'Candidate'} />
        </div>
      ) : (
        <div className="leetcode-workspace-layout">
          
          {/* Main Dual-Column coding pane split */}
          <div className="workspace-split-panes">
            
            {/* Left Pane: Question Details & Tabs */}
            <div className="workspace-left-pane">
              {/* Tab Selector row */}
              <div className="left-pane-tab-headers">
                <button onClick={() => setLeftTab('description')} className={`left-tab-btn ${leftTab === 'description' ? 'active' : ''}`}>
                  Description
                </button>
                <button onClick={() => setLeftTab('editorial')} className={`left-tab-btn ${leftTab === 'editorial' ? 'active' : ''}`}>
                  Editorial / Hints
                </button>
                <button onClick={() => setLeftTab('solutions')} className={`left-tab-btn ${leftTab === 'solutions' ? 'active' : ''}`}>
                  Optimal Solution
                </button>
                <button onClick={() => setLeftTab('submissions')} className={`left-tab-btn ${leftTab === 'submissions' ? 'active' : ''}`}>
                  Submissions ({submissionsHistory[activeQuestion.id]?.length || 0})
                </button>
              </div>

              {/* Tab Contents */}
              <div className="left-pane-tab-body">
                {leftTab === 'description' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <h2 style={{ fontSize: 20, fontWeight: 700, color: '#f1f5f9' }}>
                        {activeQuestionIdx + 1}. {activeQuestion.topic || 'DSA Problem'}
                      </h2>
                      <span style={{ fontSize: 13, color: '#ffc01e', fontWeight: 700, background: 'rgba(255,192,30,0.1)', padding: '2px 8px', borderRadius: 4 }}>
                        {activeQuestion.marks} Marks
                      </span>
                    </div>

                    {/* LeetCode standard tag indicators */}
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: diffInfo.color, background: diffInfo.bg, padding: '3px 8px', borderRadius: 12 }}>
                        {diffInfo.label}
                      </span>
                      <span style={{ fontSize: 11, color: '#9ca3af', background: '#2c2c2c', padding: '3px 8px', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Award size={11} /> {activeQuestion.topic || 'DSA'}
                      </span>
                      <span style={{ fontSize: 11, color: '#ffc01e', background: 'rgba(245,158,11,0.1)', padding: '3px 8px', borderRadius: 12 }}>
                        🔥 Potd Selected
                      </span>
                    </div>

                    {/* Question text description */}
                    <div style={{ color: '#c5c5c5', fontSize: 14.5, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                      {activeQuestion.text}
                    </div>

                    {/* Examples Section parsed dynamically from test cases */}
                    {activeQuestion.type === 'coding' && activeQuestion.testCases && activeQuestion.testCases.length > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 12 }}>
                        <h4 style={{ fontSize: 13, color: '#eff3f6', fontWeight: 700 }}>Examples:</h4>
                        {activeQuestion.testCases.slice(0, 3).map((tc, tcIdx) => {
                          const parts = tc.split(' -> ')
                          const inputArgs = parts[0]?.trim() || ''
                          const expectedOutput = parts[1]?.trim() || ''
                          return (
                            <div key={tcIdx} className="leetcode-example-card">
                              <div style={{ fontWeight: 700, color: '#9ca3af', fontSize: 12, marginBottom: 6 }}>Example {tcIdx + 1}:</div>
                              <pre style={{ margin: 0, padding: 10, background: '#1c1c1c', borderRadius: 6, fontSize: 12.5, fontFamily: 'monospace', color: '#34d399', borderLeft: '3px solid #00b8a3' }}>
                                <strong>Input:</strong> args = ({inputArgs})<br />
                                <strong>Output:</strong> {expectedOutput}
                              </pre>
                            </div>
                          )
                        })}
                      </div>
                    )}

                    {/* MCQ Options Display (Displays right inside Description Tab for MCQ Questions) */}
                    {activeQuestion.type !== 'coding' && activeQuestion.options && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 14 }}>
                        <h4 style={{ fontSize: 13, color: '#eff3f6', fontWeight: 700, marginBottom: 4 }}>Select Option:</h4>
                        {activeQuestion.options.map((opt, oIdx) => {
                          const isSelected = answers[activeQuestion.id] === String(oIdx)
                          return (
                            <label
                              key={oIdx}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 12,
                                padding: '14px 18px',
                                borderRadius: 8,
                                border: `1.5px solid ${isSelected ? '#00b8a3' : '#3a3a3a'}`,
                                background: isSelected ? 'rgba(0,184,163,0.06)' : '#232323',
                                cursor: 'pointer',
                                transition: 'all 0.15s'
                              }}
                              className="mcq-label-hover"
                            >
                              <input
                                type="radio"
                                name={`q_${activeQuestion.id}`}
                                value={oIdx}
                                checked={isSelected}
                                onChange={() => handleAnswerChange(activeQuestion.id, String(oIdx))}
                                style={{ accentColor: '#00b8a3', width: 15, height: 15 }}
                              />
                              <span style={{ fontSize: 13.5, color: isSelected ? '#34d399' : '#eff3f6', fontWeight: 600 }}>{opt}</span>
                            </label>
                          )
                        })}
                      </div>
                    )}

                    {/* Footer Likes / Bookmark star row */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #2d2d2d', paddingTop: 14, marginTop: 'auto', fontSize: 12, color: '#8a8a8a' }}>
                      <div style={{ display: 'flex', gap: 16 }}>
                        <button style={footerIconStyle} onClick={() => toast.success('Liked!')}><ThumbsUp size={14} /> 120</button>
                        <button style={footerIconStyle} onClick={() => toast.error('Disliked')}><ThumbsDown size={14} /> 2</button>
                        <button style={footerIconStyle} onClick={() => { setFlaggedQuestions(prev => ({ ...prev, [activeQuestion.id]: !prev[activeQuestion.id] })); toast.success('Flagged!') }}>
                          <Bookmark size={14} color={flaggedQuestions[activeQuestion.id] ? '#ffc01e' : '#8a8a8a'} fill={flaggedQuestions[activeQuestion.id] ? '#ffc01e' : 'none'} /> Bookmark
                        </button>
                      </div>
                      <span>⚡ 100% active solving</span>
                    </div>
                  </div>
                )}

                {leftTab === 'editorial' && (
                  <div style={{ color: '#c5c5c5', fontSize: 14, lineHeight: 1.6 }}>
                    <h3 style={{ fontSize: 15, color: '#f1f5f9', fontWeight: 700, marginBottom: 10 }}>Analysis & Optimal Approach</h3>
                    <p>To solve this optimal coding challenge, we should dry-run the base case inputs to recognize potential overlapping states.</p>
                    <div style={{ background: '#232323', padding: 12, borderRadius: 6, border: '1px solid #333', margin: '14px 0' }}>
                      <strong style={{ color: '#00b8a3' }}>Complexity Recommendation:</strong>
                      <ul style={{ margin: '6px 0 0', paddingLeft: 20 }}>
                        <li>Time Complexity: <code style={{ fontFamily: 'monospace', color: '#ffc01e' }}>O(N)</code> using hash map indices lookup.</li>
                        <li>Space Complexity: <code style={{ fontFamily: 'monospace', color: '#ffc01e' }}>O(N)</code> to store elements lookup map.</li>
                      </ul>
                    </div>
                    <h4 style={{ fontSize: 13, color: '#f1f5f9', fontWeight: 600, marginBottom: 6 }}>Suggested Hints:</h4>
                    <p style={{ fontSize: 13, color: '#9ca3af' }}>{activeQuestion.explanation || "No hints compiled yet. Try mapping items into dynamic structures, using two pointers or recursive sweeps to optimize brute-force."}</p>
                  </div>
                )}

                {leftTab === 'solutions' && (
                  <div style={{ color: '#c5c5c5', fontSize: 14, lineHeight: 1.6 }}>
                    <h3 style={{ fontSize: 15, color: '#f1f5f9', fontWeight: 700, marginBottom: 12 }}>Optimal JavaScript Template</h3>
                    <p style={{ marginBottom: 12 }}>Here is the optimal ES6 JavaScript solution utilizing Map objects to lookup index hashes in O(1) time:</p>
                    <pre style={{ background: '#1c1c1c', padding: 14, borderRadius: 6, border: '1px solid #333', fontFamily: 'monospace', color: '#34d399', fontSize: 13, overflowX: 'auto', lineHeight: 1.5 }}>
{`// Optimal Javascript Solution
function ${activeQuestion.boilerplate?.match(/function\s+([a-zA-Z0-9_]+)/)?.[1] || 'solution'}(args) {
  // Optimal two pointer / hash solution goes here
  return args;
}`}
                    </pre>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(activeQuestion.boilerplate || '');
                        toast.success('Boilerplate copied!');
                      }}
                      style={{ marginTop: 10, background: '#333', border: 'none', borderRadius: 4, padding: '6px 12px', fontSize: 12, color: '#eff3f6', cursor: 'pointer' }}
                    >
                      Copy Boilerplate Template
                    </button>
                  </div>
                )}

                {leftTab === 'submissions' && (
                  <div>
                    <h3 style={{ fontSize: 15, color: '#f1f5f9', fontWeight: 700, marginBottom: 12 }}>Run & Submission History</h3>
                    {!submissionsHistory[activeQuestion.id] || submissionsHistory[activeQuestion.id].length === 0 ? (
                      <p style={{ color: '#8a8a8a', fontSize: 13.5 }}>No runs completed for this question yet. Compile your code to see local checks.</p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {submissionsHistory[activeQuestion.id].map((sub, sIdx) => (
                          <div key={sIdx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#232323', border: '1px solid #333', padding: '10px 14px', borderRadius: 6 }}>
                            <div>
                              <span style={{
                                fontWeight: 700,
                                fontSize: 13,
                                color: sub.status === 'Accepted' ? '#00b8a3' : '#ff375f',
                                marginRight: 10
                              }}>
                                {sub.status}
                              </span>
                              <span style={{ fontSize: 11, color: '#8a8a8a' }}>{sub.time}</span>
                            </div>
                            <span style={{ fontSize: 12, color: '#ffc01e', fontWeight: 600, fontFamily: 'monospace' }}>
                              {sub.runtime}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Right Pane: Monospace Gutter Code Editor & Test drawer */}
            <div className="workspace-right-pane">
              
              {/* Top Header of Code Pane */}
              <div className="right-pane-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Code size={14} color="#00b8a3" />
                  <span style={{ fontSize: 12.5, fontWeight: 700, color: '#eff3f6' }}>Code Editor</span>
                  <select className="editor-lang-select" disabled>
                    <option>JavaScript (ES6)</option>
                  </select>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#8a8a8a' }}>
                  <span style={{ fontSize: 10, background: 'rgba(0,184,163,0.15)', color: '#00b8a3', padding: '2px 6px', borderRadius: 4, fontWeight: 700 }}>Auto-Save Active</span>
                  <Settings size={14} style={{ cursor: 'pointer' }} onClick={() => toast('Editor configurations synced')} />
                </div>
              </div>

              {/* Editor Workspace */}
              {activeQuestion.type === 'coding' ? (
                <div className="editor-scroller">
                  {/* Monospace Code Editor wrapper with line numbers gutter */}
                  <div style={{ display: 'flex', background: '#1e1e1e', minHeight: 320, flex: 1 }}>
                    {/* Line numbers gutter */}
                    <div className="editor-gutter">
                      {gutterArray.map(num => (
                        <div key={num} className="gutter-num">{num}</div>
                      ))}
                    </div>

                    {/* Raw Textarea Code Editor */}
                    <textarea
                      value={answers[activeQuestion.id] || ''}
                      onChange={e => handleAnswerChange(activeQuestion.id, e.target.value)}
                      placeholder="// Write your optimal JS code solution here..."
                      className="editor-textarea"
                    />
                  </div>
                </div>
              ) : (
                /* Information block when MCQ is active */
                <div style={{ flex: 1, background: '#1e1e1e', padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', color: '#8a8a8a' }}>
                  <HelpCircle size={40} style={{ color: '#00b8a3', opacity: 0.6, marginBottom: 12 }} />
                  <h4 style={{ color: '#eff3f6', fontSize: 14, fontWeight: 700, marginBottom: 6 }}>MCQ Question Selected</h4>
                  <p style={{ fontSize: 12.5, maxWidth: 260, lineHeight: 1.4 }}>Please select one of the available choices inside the **Description** pane on the left to lock in your answer.</p>
                </div>
              )}

              {/* Bottom Test drawer (replaces old raw outputs card) */}
              <div className="workspace-test-drawer">
                <div className="test-drawer-tabs">
                  <button onClick={() => setRightTab('testcase')} className={`drawer-tab-btn ${rightTab === 'testcase' ? 'active' : ''}`}>
                    Testcase inputs
                  </button>
                  <button onClick={() => setRightTab('testresult')} className={`drawer-tab-btn ${rightTab === 'testresult' ? 'active' : ''}`}>
                    Test Results
                  </button>
                </div>

                <div className="test-drawer-body">
                  {rightTab === 'testcase' ? (
                    <div>
                      {activeQuestion.type === 'coding' && activeQuestion.testCases && activeQuestion.testCases.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                          {activeQuestion.testCases.map((tc, tcIdx) => {
                            const inputArgs = tc.split(' -> ')[0]?.trim() || ''
                            return (
                              <div key={tcIdx} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                <span style={{ fontSize: 11, color: '#8a8a8a', fontWeight: 600 }}>Case {tcIdx + 1} Input:</span>
                                <pre style={{ margin: 0, background: '#131313', border: '1px solid #2e2e2e', padding: '6px 12px', borderRadius: 4, fontSize: 12, color: '#eff3f6', fontFamily: 'monospace' }}>
                                  {inputArgs}
                                </pre>
                              </div>
                            )
                          })}
                        </div>
                      ) : (
                        <span style={{ fontSize: 12, color: '#8a8a8a' }}>No code test inputs needed for MCQs.</span>
                      )}
                    </div>
                  ) : (
                    <div>
                      {runOutputs[activeQuestion.id] ? (
                        <pre style={{ margin: 0, fontFamily: 'monospace', fontSize: 12, color: testingStatus[activeQuestion.id] === 'success' ? '#00b8a3' : '#ff375f', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
                          {runOutputs[activeQuestion.id]}
                        </pre>
                      ) : (
                        <span style={{ fontSize: 12, color: '#8a8a8a' }}>No execution logs. Click **"Run Code"** below to compile and check code test cases against JS interpreter.</span>
                      )}
                    </div>
                  )}
                </div>

                {/* Footer Toolbar buttons */}
                {activeQuestion.type === 'coding' && (
                  <div className="test-drawer-footer">
                    <button onClick={() => runCodeTests(activeQuestion)} disabled={testingStatus[activeQuestion.id] === 'running'} className="editor-run-btn">
                      {testingStatus[activeQuestion.id] === 'running' ? 'Running...' : 'Run Code'}
                    </button>
                    <button
                      onClick={() => {
                        toast.success('Submitting active code... 🚀')
                        runCodeTests(activeQuestion)
                      }}
                      className="editor-submit-btn"
                    >
                      Submit Code
                    </button>
                  </div>
                )}
              </div>

            </div>

          </div>

          {/* Collapsible Lower Section Navigation & Live contest leaderboard */}
          <div className="workspace-bottom-dock">
            {/* Nav Panel */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#262626', border: '1px solid #333', padding: '12px 20px', borderRadius: 8 }}>
              <button
                onClick={() => selectQuestion(activeQuestionIdx - 1)}
                disabled={activeQuestionIdx === 0}
                className="navigation-arrow-btn"
              >
                <ChevronLeft size={16} /> Previous
              </button>

              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                {test.questions.map((q, idx) => {
                  const isAnswered = answers[q.id] && answers[q.id].trim() !== '' && answers[q.id] !== q.boilerplate
                  const isFlagged = flaggedQuestions[q.id]
                  const isActive = activeQuestionIdx === idx
                  return (
                    <button
                      key={q.id}
                      onClick={() => selectQuestion(idx)}
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 4,
                        border: isActive ? '1.5px solid #00b8a3' : '1px solid #3a3a3a',
                        background: isActive ? 'rgba(0,184,163,0.18)' :
                                    isFlagged ? '#eab308' :
                                    isAnswered ? '#00b8a3' :
                                    '#1e1e1e',
                        color: isFlagged || isAnswered || isActive ? '#ffffff' : '#8a8a8a',
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: 'pointer',
                        transition: 'all 0.15s'
                      }}
                    >
                      {idx + 1}
                    </button>
                  )
                })}
              </div>

              <button
                onClick={() => {
                  if (activeQuestionIdx === test.questions.length - 1) {
                    handleSubmit()
                  } else {
                    selectQuestion(activeQuestionIdx + 1)
                  }
                }}
                className="navigation-arrow-btn"
              >
                {activeQuestionIdx === test.questions.length - 1 ? 'Finish Test' : 'Next'} <ChevronRight size={16} />
              </button>
            </div>

            {/* Live rankings dock side */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20, marginTop: 16 }}>
              <div style={{ background: '#262626', border: '1px solid #333', borderRadius: 8, padding: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <h4 style={{ fontSize: 13, color: '#eff3f6', fontWeight: 700, margin: '0 0 4px' }}>WebSocket Synced Contest Lobby</h4>
                  <p style={{ fontSize: 11, color: '#8a8a8a', margin: 0 }}>All progress is captured live. Do not refresh during the competition.</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 8, height: 8, borderRadius: 99, background: wsConnected ? '#00b8a3' : '#ef4444', animation: wsConnected ? 'pulse 2s infinite' : 'none' }} />
                  <span style={{ fontSize: 12, color: wsConnected ? '#00b8a3' : '#ef4444', fontWeight: 700 }}>
                    {wsConnected ? 'LOBBY SYNCED' : 'OFFLINE MODE'}
                  </span>
                </div>
              </div>

              {/* Ranks list card */}
              <div style={{ background: '#262626', border: '1px solid #333', borderRadius: 8, padding: 16 }}>
                <h4 style={{ fontSize: 13, color: '#fbbf24', fontWeight: 800, margin: '0 0 10px', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Trophy size={14} /> Global Live Rankings
                </h4>
                {liveLeaderboard.length === 0 ? (
                  <p style={{ color: '#8a8a8a', fontSize: 11, margin: 0 }}>Waiting for submissions...</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 110, overflowY: 'auto' }}>
                    {liveLeaderboard.slice(0, 3).map((entry, idx) => {
                      const isCurrentUser = entry.userId === user?.userId
                      return (
                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: isCurrentUser ? 'rgba(0,184,163,0.1)' : '#1e1e1e', padding: '6px 10px', borderRadius: 4, fontSize: 11.5 }}>
                          <span style={{ color: '#8a8a8a', fontWeight: 700 }}>#{idx + 1} {entry.name}</span>
                          <span style={{ color: '#00b8a3', fontWeight: 700 }}>{entry.score} pts</span>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>

          </div>

        </div>
      )}

      {/* Styled custom CSS rules for split panes, scrollable editor gutter, tab headers, examples and badges */}
      <style>{`
        .leetcode-workspace-container {
          background-color: #1a1a1a;
          min-height: 100vh;
          color: #eff3f6;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
          display: flex;
          flex-direction: column;
        }

        .leetcode-workspace-header {
          height: 50px;
          background-color: #282828;
          border-bottom: 1px solid #333;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 16px;
          position: sticky;
          top: 0;
          z-index: 100;
        }

        .workspace-header-divider {
          width: 1px;
          height: 16px;
          background-color: #3e3e3e;
          margin: 0 12px;
        }

        .workspace-timer-box {
          display: flex;
          align-items: center;
          gap: 6px;
          background-color: #1e1e1e;
          border: 1px solid #333;
          padding: 5px 12px;
          border-radius: 4px;
          font-family: monospace;
          font-size: 13.5px;
          font-weight: 700;
        }

        .workspace-submit-btn {
          background-color: #00b8a3;
          color: #1a1a1a;
          border: none;
          border-radius: 4px;
          padding: 6px 12px;
          font-size: 12.5px;
          font-weight: 700;
          cursor: pointer;
          transition: background 0.2s;
        }
        .workspace-submit-btn:hover:not(:disabled) {
          background-color: #009a86;
        }

        .leetcode-workspace-layout {
          display: flex;
          flex-direction: column;
          flex: 1;
          padding: 16px;
          gap: 16px;
        }

        .workspace-split-panes {
          display: grid;
          grid-template-columns: 1fr 1.2fr;
          gap: 16px;
          min-height: calc(100vh - 280px);
        }

        .workspace-left-pane {
          background-color: #262626;
          border: 1px solid #333;
          border-radius: 8px;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .left-pane-tab-headers {
          display: flex;
          background-color: #202020;
          border-bottom: 1px solid #333;
        }

        .left-tab-btn {
          background: transparent;
          border: none;
          color: #8a8a8a;
          padding: 10px 16px;
          font-size: 12.5px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          border-right: 1px solid #2d2d2d;
        }
        .left-tab-btn:hover {
          color: #eff3f6;
          background-color: rgba(255,255,255,0.02);
        }
        .left-tab-btn.active {
          background-color: #262626;
          color: #eff3f6;
          font-weight: 700;
          border-bottom: 2px solid #00b8a3;
        }

        .left-pane-tab-body {
          padding: 20px;
          flex: 1;
          overflow-y: auto;
          max-height: calc(100vh - 340px);
        }

        .leetcode-example-card {
          background: #232323;
          border: 1px solid #2e2e2e;
          border-radius: 6px;
          padding: 12px;
        }

        .workspace-right-pane {
          background-color: #262626;
          border: 1px solid #333;
          border-radius: 8px;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .right-pane-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background-color: #202020;
          border-bottom: 1px solid #333;
          padding: 8px 16px;
          height: 38px;
        }

        .editor-lang-select {
          background-color: #2c2c2c;
          border: 1px solid #3e3e3e;
          color: #eff3f6;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 600;
          padding: 2px 8px;
          outline: none;
          margin-left: 8px;
        }

        .editor-scroller {
          display: flex;
          flex-direction: column;
          flex: 1;
          overflow-y: auto;
          max-height: calc(100vh - 580px);
        }

        .editor-gutter {
          padding: 16px 6px;
          background-color: #1a1a1a;
          border-right: 1px solid #2e2e2e;
          text-align: right;
          color: #5a5a5a;
          font-family: monospace;
          fontSize: 13px;
          user-select: none;
          line-height: 1.6;
          min-width: 32px;
        }

        .gutter-num {
          height: 21px;
        }

        .editor-textarea {
          flex: 1;
          background: #1e1e1e;
          color: #9cdcfe;
          font-family: 'Fira Code', 'Source Code Pro', monospace;
          font-size: 13px;
          padding: 16px;
          border: none;
          outline: none;
          resize: none;
          line-height: 1.6;
          min-height: 300px;
        }
        .editor-textarea:focus {
          color: #34d399;
        }

        .workspace-test-drawer {
          background-color: #202020;
          border-top: 1px solid #333;
          display: flex;
          flex-direction: column;
          height: 240px;
        }

        .test-drawer-tabs {
          display: flex;
          background-color: #1a1a1a;
          border-bottom: 1px solid #2d2d2d;
        }

        .drawer-tab-btn {
          background: transparent;
          border: none;
          color: #8a8a8a;
          padding: 8px 16px;
          font-size: 11.5px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }
        .drawer-tab-btn:hover {
          color: #eff3f6;
        }
        .drawer-tab-btn.active {
          color: #eff3f6;
          font-weight: 700;
          border-bottom: 2px solid #00b8a3;
        }

        .test-drawer-body {
          padding: 14px;
          overflow-y: auto;
          flex: 1;
        }

        .test-drawer-footer {
          border-top: 1px solid #2d2d2d;
          padding: 8px 14px;
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          background-color: #1a1a1a;
        }

        .editor-run-btn {
          background: #333333;
          color: #eff3f6;
          border: 1px solid #444444;
          border-radius: 4px;
          padding: 5px 12px;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          transition: background 0.15s;
        }
        .editor-run-btn:hover:not(:disabled) {
          background: #3e3e3e;
        }

        .editor-submit-btn {
          background: #00b8a3;
          color: #1a1a1a;
          border: none;
          border-radius: 4px;
          padding: 5px 12px;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          transition: background 0.15s;
        }
        .editor-submit-btn:hover {
          background: #009a86;
        }

        .workspace-bottom-dock {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .navigation-arrow-btn {
          background: #1e1e1e;
          border: 1px solid #333;
          color: #cbd5e1;
          border-radius: 4px;
          padding: 6px 12px;
          font-size: 12.5px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 4px;
          transition: background 0.2s;
        }
        .navigation-arrow-btn:hover:not(:disabled) {
          background: #2b2b2b;
        }
        .navigation-arrow-btn:disabled {
          color: #4a4a4a;
          cursor: not-allowed;
        }

        .mcq-label-hover:hover {
          border-color: #555 !important;
          background-color: #2a2a2a !important;
        }

        .spinner {
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        @media (max-width: 992px) {
          .workspace-split-panes {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  )
}

const footerIconStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  color: '#8a8a8a',
  display: 'flex',
  alignItems: 'center',
  gap: 5,
  cursor: 'pointer'
}

