import { useEffect, useState } from 'react'
import { api, useAuth } from '../context/AuthContext'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Trophy, Clock, Users, Play, Search, Filter, Plus, X, FileJson, FormInput, HelpCircle, Trash2 } from 'lucide-react'

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

  // Create Contest State
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [createTitle, setCreateTitle] = useState('')
  const [createDesc, setCreateDesc] = useState('')
  const [createDuration, setCreateDuration] = useState(30)
  const [createDifficulty, setCreateDifficulty] = useState('Medium')
  const [createTopics, setCreateTopics] = useState('')
  const [createType, setCreateType] = useState('practice')
  const [inputStyle, setInputStyle] = useState<'manual' | 'json'>('manual')

  // Manual Builder Questions State
  const [manualQuestions, setManualQuestions] = useState<any[]>([
    { text: '', options: ['', '', '', ''], correctOption: 0, explanation: '', marks: 10 }
  ])

  // Bulk JSON Input State
  const [jsonText, setJsonText] = useState(
`[
  {
    "text": "What is the average time complexity of searching in a Hash Map?",
    "options": ["O(N)", "O(log N)", "O(1)", "O(N log N)"],
    "correctOption": 2,
    "explanation": "Hash tables offer average constant time O(1) searches.",
    "marks": 10
  }
]`
  )

  useEffect(() => {
    fetchTests()

    // Fetch user analytics
    if (user?.userId) {
      api.get(`/api/mock-tests/analytics/${user.userId}`)
        .then(r => setAnalytics(r.data))
        .catch(() => {})
    }
  }, [user])

  const fetchTests = () => {
    api.get('/api/mock-tests', { params: { size: 50 } })
      .then(r => setTests(r.data.content || []))
      .catch(() => toast.error('Failed to load mock tests'))
      .finally(() => setLoading(false))
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

  const handleAddManualQuestion = () => {
    setManualQuestions([...manualQuestions, { text: '', options: ['', '', '', ''], correctOption: 0, explanation: '', marks: 10 }])
  }

  const handleRemoveManualQuestion = (idx: number) => {
    if (manualQuestions.length <= 1) {
      toast.error('Contest must contain at least one question!')
      return
    }
    setManualQuestions(manualQuestions.filter((_, i) => i !== idx))
  }

  const handleManualOptionChange = (qIdx: number, oIdx: number, val: string) => {
    const copy = [...manualQuestions]
    copy[qIdx].options[oIdx] = val
    setManualQuestions(copy)
  }

  const handleManualQuestionChange = (qIdx: number, field: string, val: any) => {
    const copy = [...manualQuestions]
    copy[qIdx][field] = val
    setManualQuestions(copy)
  }

  const handleCreateContest = async () => {
    if (!createTitle.trim()) {
      toast.error('Please enter a contest title')
      return
    }

    const topicsArr = createTopics.split(',').map(s => s.trim()).filter(Boolean)
    let finalQuestions = []

    if (inputStyle === 'json') {
      try {
        const parsed = JSON.parse(jsonText)
        if (!Array.isArray(parsed)) throw new Error('Root must be an array of questions')
        
        finalQuestions = parsed.map((q, idx) => {
          if (!q.text) throw new Error(`Question ${idx + 1} is missing 'text'`)
          if (!Array.isArray(q.options) || q.options.length < 2) {
            throw new Error(`Question ${idx + 1} must carry an 'options' array containing at least 2 options`)
          }
          if (typeof q.correctOption !== 'number' || q.correctOption < 0 || q.correctOption >= q.options.length) {
            throw new Error(`Question ${idx + 1} has an invalid 'correctOption' index`)
          }
          return {
            id: `q_${idx + 1}`,
            text: q.text,
            type: 'mcq',
            options: q.options,
            correctOption: q.correctOption,
            explanation: q.explanation || '',
            marks: q.marks || 10
          }
        })
      } catch (err: any) {
        toast.error(`JSON parse validation failed: ${err.message}`)
        return
      }
    } else {
      // Validate manual questions
      for (let i = 0; i < manualQuestions.length; i++) {
        const mq = manualQuestions[i]
        if (!mq.text.trim()) {
          toast.error(`Question ${i + 1} text is required`)
          return
        }
        if (mq.options.some((o: string) => !o.trim())) {
          toast.error(`Question ${i + 1} has empty choice fields`)
          return
        }
      }
      finalQuestions = manualQuestions.map((mq, idx) => ({
        id: `q_${idx + 1}`,
        text: mq.text,
        type: 'mcq',
        options: mq.options,
        correctOption: parseInt(mq.correctOption),
        explanation: mq.explanation,
        marks: parseInt(mq.marks) || 10
      }))
    }

    const payload = {
      title: createTitle,
      description: createDesc,
      type: createType,
      duration: createDuration,
      totalMarks: finalQuestions.reduce((sum, q) => sum + q.marks, 0),
      difficulty: createDifficulty,
      topics: topicsArr,
      questions: finalQuestions
    }

    try {
      const res = await api.post('/api/mock-tests', payload)
      toast.success('Contest created and listed! 🏆')
      setShowCreateModal(false)
      setTests([res.data, ...tests])

      // Reset Form State
      setCreateTitle('')
      setCreateDesc('')
      setCreateDuration(30)
      setCreateDifficulty('Medium')
      setCreateTopics('')
      setCreateType('practice')
      setManualQuestions([{ text: '', options: ['', '', '', ''], correctOption: 0, explanation: '', marks: 10 }])
    } catch {
      toast.error('Failed to create contest')
    }
  }

  return (
    <div className="page" style={{ color: '#f8fafc', paddingBottom: 60 }}>
      {/* Title Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 20, marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, background: 'linear-gradient(90deg, #818cf8, #a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: 6 }}>
            PrepNest Mock Arena
          </h1>
          <p style={{ color: '#94a3b8', fontSize: 14 }}>Practice at your own pace or compete in high-stakes timed coding challenges.</p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => setShowCreateModal(true)}
          style={{ display: 'flex', alignItems: 'center', gap: 8 }}
          id="btn-trigger-create-contest"
        >
          <Plus size={16} />
          Create Contest 🏆
        </button>
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

      {/* Create Contest Modal */}
      {showCreateModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(8, 12, 20, 0.85)',
          backdropFilter: 'blur(12px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: 20
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: 24,
            width: '100%',
            maxWidth: 760,
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: 32,
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)',
            position: 'relative'
          }} className="scale-in">
            {/* Close Button */}
            <button
              onClick={() => setShowCreateModal(false)}
              style={{
                position: 'absolute', top: 20, right: 20,
                background: 'rgba(255, 255, 255, 0.05)',
                border: 'none', borderRadius: '50%',
                width: 32, height: 32,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', color: '#94a3b8'
              }}
              id="btn-close-create-modal"
            >
              <X size={16} />
            </button>

            <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 4, background: 'linear-gradient(90deg, #6366f1, #22d3ee)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Create Custom MCQ Contest 🏆
            </h2>
            <p style={{ color: '#64748b', fontSize: 13, marginBottom: 24 }}>Design a practice set or competition for PrepNest candidates.</p>

            {/* General Details */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>
              <div>
                <label style={{ fontSize: 12, color: '#94a3b8', display: 'block', marginBottom: 6 }}>Contest Title</label>
                <input
                  className="input"
                  placeholder="e.g. Dynamic Programming Masters Contest"
                  value={createTitle}
                  onChange={e => setCreateTitle(e.target.value)}
                  id="contest-title"
                />
              </div>

              <div>
                <label style={{ fontSize: 12, color: '#94a3b8', display: 'block', marginBottom: 6 }}>Description</label>
                <textarea
                  className="input"
                  placeholder="Describe the rules, target audience, or covered syllabus..."
                  value={createDesc}
                  onChange={e => setCreateDesc(e.target.value)}
                  style={{ minHeight: 60, resize: 'vertical' }}
                  id="contest-desc"
                />
              </div>

              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 140 }}>
                  <label style={{ fontSize: 12, color: '#94a3b8', display: 'block', marginBottom: 6 }}>Duration (Minutes)</label>
                  <input
                    className="input"
                    type="number"
                    value={createDuration}
                    onChange={e => setCreateDuration(parseInt(e.target.value) || 0)}
                    id="contest-duration"
                  />
                </div>

                <div style={{ flex: 1, minWidth: 140 }}>
                  <label style={{ fontSize: 12, color: '#94a3b8', display: 'block', marginBottom: 6 }}>Difficulty</label>
                  <select
                    className="input"
                    value={createDifficulty}
                    onChange={e => setCreateDifficulty(e.target.value)}
                    style={{ cursor: 'pointer' }}
                    id="contest-difficulty"
                  >
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>

                <div style={{ flex: 1, minWidth: 140 }}>
                  <label style={{ fontSize: 12, color: '#94a3b8', display: 'block', marginBottom: 6 }}>Contest Mode</label>
                  <select
                    className="input"
                    value={createType}
                    onChange={e => setCreateType(e.target.value)}
                    style={{ cursor: 'pointer' }}
                    id="contest-type"
                  >
                    <option value="practice">Practice Mode (Multiple attempts)</option>
                    <option value="competition">Competition Mode (Strict 1 timed attempt)</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: 12, color: '#94a3b8', display: 'block', marginBottom: 6 }}>Covered Topics (Comma separated)</label>
                <input
                  className="input"
                  placeholder="e.g. DP, Recursion, Memoization"
                  value={createTopics}
                  onChange={e => setCreateTopics(e.target.value)}
                  id="contest-topics"
                />
              </div>
            </div>

            <hr style={{ border: 'none', borderBottom: '1px solid rgba(255,255,255,0.06)', margin: '24px 0' }} />

            {/* Selection of input style */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 15, display: 'flex', alignItems: 'center', gap: 6 }}>
                Questions Database Setup
              </h3>
              <div style={{ display: 'flex', gap: 8, background: 'rgba(0,0,0,0.2)', padding: 3, borderRadius: 8 }}>
                <button
                  type="button"
                  onClick={() => setInputStyle('manual')}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px',
                    borderRadius: 6, border: 'none', fontSize: 12, cursor: 'pointer',
                    background: inputStyle === 'manual' ? '#6366f1' : 'transparent',
                    color: inputStyle === 'manual' ? '#fff' : '#64748b',
                    transition: 'all 0.15s'
                  }}
                  id="btn-select-manual"
                >
                  <FormInput size={13} /> Form Builder
                </button>
                <button
                  type="button"
                  onClick={() => setInputStyle('json')}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px',
                    borderRadius: 6, border: 'none', fontSize: 12, cursor: 'pointer',
                    background: inputStyle === 'json' ? '#6366f1' : 'transparent',
                    color: inputStyle === 'json' ? '#fff' : '#64748b',
                    transition: 'all 0.15s'
                  }}
                  id="btn-select-json"
                >
                  <FileJson size={13} /> JSON Bulk Paste
                </button>
              </div>
            </div>

            {/* Input Blocks */}
            {inputStyle === 'json' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, background: 'rgba(99,102,241,0.05)', border: '1px solid rgba(99,102,241,0.15)', borderRadius: 10, padding: 12, fontSize: 12, color: '#a5b4fc' }}>
                  <HelpCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
                  <div>
                    <strong>Pasting Guidelines:</strong> Paste a JSON array containing questions. Each question must include <code>"text"</code>, <code>"options"</code> array, and 0-indexed <code>"correctOption"</code>. Optional fields are <code>"explanation"</code> and <code>"marks"</code>.
                  </div>
                </div>

                <textarea
                  className="input"
                  value={jsonText}
                  onChange={e => setJsonText(e.target.value)}
                  style={{ fontFamily: 'monospace', minHeight: 200, fontSize: 12, resize: 'vertical' }}
                  id="json-textarea"
                />
              </div>
            ) : (
              /* Manual Questions Form Builder */
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {manualQuestions.map((q, qIdx) => (
                  <div
                    key={qIdx}
                    style={{
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid rgba(255, 255, 255, 0.04)',
                      borderRadius: 16,
                      padding: 20,
                      position: 'relative'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <span style={{ fontSize: 12, color: '#6366f1', fontWeight: 700 }}>Question #{qIdx + 1}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveManualQuestion(qIdx)}
                        style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#ef4444', display: 'flex', alignItems: 'center', gap: 4, fontSize: 11 }}
                        id={`btn-remove-q-${qIdx}`}
                      >
                        <Trash2 size={12} /> Remove
                      </button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      <div>
                        <label style={{ fontSize: 11, color: '#64748b', display: 'block', marginBottom: 4 }}>Question Text</label>
                        <input
                          className="input"
                          placeholder="What is the output of..."
                          value={q.text}
                          onChange={e => handleManualQuestionChange(qIdx, 'text', e.target.value)}
                          id={`manual-q-text-${qIdx}`}
                        />
                      </div>

                      {/* Options Grid */}
                      <div>
                        <label style={{ fontSize: 11, color: '#64748b', display: 'block', marginBottom: 6 }}>Options Choices</label>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                          {q.options.map((option: string, oIdx: number) => (
                            <input
                              key={oIdx}
                              className="input"
                              placeholder={`Option ${String.fromCharCode(65 + oIdx)}`}
                              value={option}
                              onChange={e => handleManualOptionChange(qIdx, oIdx, e.target.value)}
                              id={`manual-q-${qIdx}-opt-${oIdx}`}
                            />
                          ))}
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                        <div style={{ flex: 1, minWidth: 140 }}>
                          <label style={{ fontSize: 11, color: '#64748b', display: 'block', marginBottom: 4 }}>Correct Option</label>
                          <select
                            className="input"
                            value={q.correctOption}
                            onChange={e => handleManualQuestionChange(qIdx, 'correctOption', e.target.value)}
                            style={{ cursor: 'pointer' }}
                            id={`manual-q-correct-${qIdx}`}
                          >
                            <option value={0}>Option A</option>
                            <option value={1}>Option B</option>
                            <option value={2}>Option C</option>
                            <option value={3}>Option D</option>
                          </select>
                        </div>

                        <div style={{ flex: 1, minWidth: 140 }}>
                          <label style={{ fontSize: 11, color: '#64748b', display: 'block', marginBottom: 4 }}>Marks / Score</label>
                          <input
                            className="input"
                            type="number"
                            value={q.marks}
                            onChange={e => handleManualQuestionChange(qIdx, 'marks', e.target.value)}
                            id={`manual-q-marks-${qIdx}`}
                          />
                        </div>
                      </div>

                      <div>
                        <label style={{ fontSize: 11, color: '#64748b', display: 'block', marginBottom: 4 }}>Explanation (Optional)</label>
                        <input
                          className="input"
                          placeholder="Explain why this choice is correct..."
                          value={q.explanation}
                          onChange={e => handleManualQuestionChange(qIdx, 'explanation', e.target.value)}
                          id={`manual-q-explanation-${qIdx}`}
                        />
                      </div>
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={handleAddManualQuestion}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: 12 }}
                  id="btn-add-question"
                >
                  <Plus size={14} /> Add Another Question
                </button>
              </div>
            )}

            {/* Actions */}
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 32 }}>
              <button
                className="btn btn-secondary"
                onClick={() => setShowCreateModal(false)}
                id="btn-cancel-create"
              >
                Discard
              </button>
              <button
                className="btn btn-primary"
                onClick={handleCreateContest}
                id="btn-submit-contest"
              >
                Publish Contest 🚀
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
