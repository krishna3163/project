import { useEffect, useState, useCallback } from 'react'
import { api } from '../context/AuthContext'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import {
  Search,
  Code2,
  Check,
  Briefcase,
  Award,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Shuffle,
  Star,
  Sparkles,
  Clock
} from 'lucide-react'

interface Problem {
  id: string
  title: string
  difficulty: string
  tags: string[]
  leetcodeLink: string
  userSolvedList: string[]
}

interface Page<T> {
  content: T[]
  totalElements: number
  totalPages: number
  number: number
}

const DIFFICULTIES = ['ALL', 'EASY', 'MEDIUM', 'HARD']

const TOPIC_CAPSULES = [
  { name: 'Array', count: 2171 },
  { name: 'String', count: 874 },
  { name: 'Hash Table', count: 815 },
  { name: 'Math', count: 678 },
  { name: 'Dynamic Programming', count: 656 },
  { name: 'Sorting', count: 518 }
]

const EXTRA_TOPIC_CAPSULES = [
  { name: 'Two Pointers', count: 170 },
  { name: 'Binary Search', count: 245 },
  { name: 'Stack', count: 155 },
  { name: 'Greedy', count: 320 },
  { name: 'Depth-First Search', count: 298 },
  { name: 'Tree', count: 195 },
  { name: 'Matrix', count: 180 },
  { name: 'Recursion', count: 90 }
]

const FILTER_BUTTONS = ['All Topics', 'Algorithms', 'Database', 'Shell', 'Concurrency']

const TRENDING_COMPANIES = [
  { name: 'Google', count: 2281 },
  { name: 'Amazon', count: 1958 },
  { name: 'Microsoft', count: 1180 },
  { name: 'Apple', count: 305 },
  { name: 'Uber', count: 367 },
  { name: 'Meta', count: 842 },
  { name: 'Netflix', count: 190 }
]

export default function DsaTrackerPage() {
  const { user } = useAuth()
  const [page, setPage] = useState<Page<Problem> | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [difficulty, setDifficulty] = useState('ALL')
  const [tag, setTag] = useState('')
  const [currentPage, setCurrentPage] = useState(0)
  const [solving, setSolving] = useState<string | null>(null)
  const [companySearch, setCompanySearch] = useState('')
  const [expandTags, setExpandTags] = useState(false)
  const [favorites, setFavorites] = useState<string[]>([])
  
  // Real-time Countdown Timer
  const [timeLeft, setTimeLeft] = useState('12:00:00')
  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date()
      const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
      const diff = endOfDay.getTime() - now.getTime()
      const hours = Math.floor(diff / (1000 * 60 * 60))
      const minutes = Math.floor((diff / (1000 * 60)) % 60)
      const seconds = Math.floor((diff / 1000) % 60)
      setTimeLeft(
        `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')} left`
      )
    }
    updateCountdown()
    const timer = setInterval(updateCountdown, 1000)
    return () => clearInterval(timer)
  }, [])

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400)
    return () => clearTimeout(t)
  }, [search])

  const fetchProblems = useCallback(async () => {
    setLoading(true)
    try {
      const params: Record<string, string | number> = { page: currentPage, size: 15 }
      if (debouncedSearch.trim()) params.search = debouncedSearch.trim()
      else if (difficulty !== 'ALL') params.difficulty = difficulty
      else if (tag) params.tag = tag
      const res = await api.get('/api/dsa', { params })
      setPage(res.data)
    } catch {
      toast.error('Failed to load problems')
    } finally {
      setLoading(false)
    }
  }, [currentPage, debouncedSearch, difficulty, tag])

  useEffect(() => {
    fetchProblems()
  }, [fetchProblems])

  const toggleSolved = useCallback(async (problem: Problem) => {
    if (!user) return
    const isSolved = problem.userSolvedList.includes(user.userId)
    setSolving(problem.id)
    try {
      if (isSolved) {
        await api.delete(`/api/dsa/${problem.id}/solve`)
        toast('Marked as unsolved', { icon: '↩️' })
      } else {
        await api.post(`/api/dsa/${problem.id}/solve`)
        toast.success('Problem solved! +10 XP 🎉')
      }
      fetchProblems()
    } catch {
      toast.error('Failed to update status')
    } finally {
      setSolving(null)
    }
  }, [user, fetchProblems])

  const toggleFavorite = (id: string) => {
    if (favorites.includes(id)) {
      setFavorites(favorites.filter(fid => fid !== id))
      toast('Removed from favorites', { icon: 'ℹ️' })
    } else {
      setFavorites([...favorites, id])
      toast.success('Added to favorites! ⭐')
    }
  }

  const handleRandomPick = () => {
    if (!page || !page.content.length) return
    const randomIndex = Math.floor(Math.random() * page.content.length)
    const randomProblem = page.content[randomIndex]
    toast(`Shuffle Picked: ${randomProblem.title}! 🎲`, { icon: '🎯' })
    if (randomProblem.leetcodeLink) {
      window.open(randomProblem.leetcodeLink, '_blank')
    }
  }

  // Generate deterministic acceptance rate for a problem based on its title hash
  const getAcceptanceRate = (title: string) => {
    let hash = 0
    for (let i = 0; i < title.length; i++) {
      hash = title.charCodeAt(i) + ((hash << 5) - hash)
    }
    const rate = 42 + Math.abs(hash % 45) // range 42% - 87%
    return `${rate.toFixed(1)}%`
  }

  const difficultyColor = (d: string) => ({
    EASY: '#00b8a3', MEDIUM: '#ffc01e', HARD: '#ff375f'
  }[d] || '#94a3b8')

  const formatDifficultyLabel = (d: string) => {
    if (d === 'MEDIUM') return 'Med.'
    return d.charAt(0) + d.slice(1).toLowerCase()
  }

  const solvedCount = page?.content.filter(p => user && p.userSolvedList.includes(user.userId)).length || 0
  const totalCount = page?.content.length || 15
  const percentSolved = Math.round((solvedCount / totalCount) * 100) || 0
  const daysInMonth = Array.from({ length: 31 }, (_, i) => i + 1)
  const checkedDays = [2, 3, 5, 8, 9, 12, 14, 15, 18, 19, 22, 23, 24, 25, 26, 30]

  const currentMonthName = new Date().toLocaleString('default', { month: 'short' })
  const currentMonthNumber = new Date().getMonth() + 1

  return (
    <div className="leetcode-container">
      {/* Grid wrapper matching the LeetCode screen exact columns */}
      <div className="leetcode-grid">
        {/* Left main area (Problems & Lists) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          
          {/* Header Top Banners (Premium Carousel Look) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
            {/* Banner 1 */}
            <div className="leetcode-banner" style={{ background: 'linear-gradient(135deg, #0b0914, #161329)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ position: 'relative', zIndex: 2 }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: '#f1f5f9', margin: '0 0 4px', letterSpacing: '0.3px' }}>PrepNest at Your</h3>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#818cf8' }}>Fingertips</span>
                <p style={{ fontSize: 10, color: '#94a3b8', margin: '8px 0 0', opacity: 0.8 }}>Access high-quality trackable coding tasks anywhere.</p>
              </div>
              <div style={{ position: 'absolute', right: -12, bottom: -12, opacity: 0.35, background: 'radial-gradient(circle, #6366f1 0%, transparent 70%)', width: 90, height: 90 }} />
            </div>

            {/* Banner 2 */}
            <div className="leetcode-banner" style={{ background: 'linear-gradient(135deg, #022c22, #064e3b)', border: '1px solid rgba(16,185,129,0.15)' }}>
              <div style={{ position: 'relative', zIndex: 2 }}>
                <h3 style={{ fontSize: 13, fontWeight: 700, color: '#10b981', margin: '0 0 4px' }}>PrepNest Interview Course:</h3>
                <p style={{ fontSize: 11, color: '#a7f3d0', margin: 0, fontWeight: 500, lineHeight: 1.4 }}>System Design for Interviews and Beyond</p>
                <div style={{ display: 'inline-block', marginTop: 10, fontSize: 9, background: 'rgba(16,185,129,0.2)', color: '#34d399', padding: '2px 6px', borderRadius: 4, fontWeight: 700 }}>EXPLORE COURSE</div>
              </div>
            </div>

            {/* Banner 3 */}
            <div className="leetcode-banner" style={{ background: 'linear-gradient(135deg, #2e1065, #3b0764)', border: '1px solid rgba(139,92,246,0.15)' }}>
              <div style={{ position: 'relative', zIndex: 2 }}>
                <h3 style={{ fontSize: 13, fontWeight: 700, color: '#c084fc', margin: '0 0 4px' }}>PrepNest Interview Course:</h3>
                <p style={{ fontSize: 11, color: '#e9d5ff', margin: 0, fontWeight: 500, lineHeight: 1.4 }}>Data Structures & Algorithms Mastery</p>
                <div style={{ display: 'inline-block', marginTop: 10, fontSize: 9, background: 'rgba(139,92,246,0.2)', color: '#d8b4fe', padding: '2px 6px', borderRadius: 4, fontWeight: 700 }}>GET PREP ACTIVE</div>
              </div>
            </div>
          </div>

          {/* Topic Capsules Row (Interactive pills) */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', background: '#262626', padding: '12px 16px', borderRadius: 8, border: '1px solid #333333' }}>
            {TOPIC_CAPSULES.map(tc => (
              <button
                key={tc.name}
                onClick={() => { setTag(tag === tc.name ? '' : tc.name); setCurrentPage(0); setSearch(''); setDifficulty('ALL') }}
                className={`topic-capsule-btn ${tag === tc.name ? 'active' : ''}`}
              >
                <span>{tc.name}</span>
                <span className="topic-badge-count">{tc.count}</span>
              </button>
            ))}
            
            {expandTags && EXTRA_TOPIC_CAPSULES.map(tc => (
              <button
                key={tc.name}
                onClick={() => { setTag(tag === tc.name ? '' : tc.name); setCurrentPage(0); setSearch(''); setDifficulty('ALL') }}
                className={`topic-capsule-btn ${tag === tc.name ? 'active' : ''}`}
              >
                <span>{tc.name}</span>
                <span className="topic-badge-count">{tc.count}</span>
              </button>
            ))}

            <button
              onClick={() => setExpandTags(!expandTags)}
              style={{ background: 'none', border: 'none', color: '#9ca3af', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, padding: '4px 8px', marginLeft: 'auto' }}
              className="expand-btn-hover"
            >
              {expandTags ? (
                <>Collapse <ChevronUp size={14} /></>
              ) : (
                <>Expand <ChevronDown size={14} /></>
              )}
            </button>
          </div>

          {/* Filters Sub-Tabs Header Navigation */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, borderBottom: '1px solid #282828', paddingBottom: 8 }}>
            <div style={{ display: 'flex', gap: 8 }}>
              {FILTER_BUTTONS.map(fb => {
                const isActive = (fb === 'All Topics' && !tag) || tag === fb
                return (
                  <button
                    key={fb}
                    onClick={() => { setTag(fb === 'All Topics' ? '' : fb); setCurrentPage(0) }}
                    className={`tab-filter-btn ${isActive ? 'active' : ''}`}
                  >
                    {fb}
                  </button>
                )
              })}
            </div>
            
            {/* Difficulty Tabs */}
            <div style={{ display: 'flex', gap: 4, background: '#262626', padding: 4, borderRadius: 8, border: '1px solid #333' }}>
              {DIFFICULTIES.map(d => (
                <button
                  key={d}
                  onClick={() => { setDifficulty(d); setCurrentPage(0); setSearch(''); setTag('') }}
                  className={`diff-tab-btn ${difficulty === d ? 'active' : ''}`}
                  style={{ color: difficulty === d ? difficultyColor(d) : '#94a3b8' }}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          {/* Main Problems Card (Glassmorphism & Sleek Border) */}
          <div style={{ background: '#262626', borderRadius: 8, border: '1px solid #333333', padding: 18 }}>
            
            {/* Search, Solved Progress Ring, Random Pick */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, gap: 16, flexWrap: 'wrap' }}>
              
              {/* Left Side: Search Bar */}
              <div style={{ position: 'relative', flex: 1, minWidth: 220, maxWidth: 320 }}>
                <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                <input
                  type="text"
                  placeholder="Search questions..."
                  value={search}
                  onChange={e => { setSearch(e.target.value); setCurrentPage(0) }}
                  style={{
                    width: '100%',
                    background: '#1a1a1a',
                    border: '1px solid #3a3a3a',
                    borderRadius: 6,
                    padding: '8px 12px 8px 36px',
                    fontSize: 13,
                    color: '#eff3f6',
                    outline: 'none',
                    transition: 'border-color 0.2s'
                  }}
                  className="search-input-field"
                />
              </div>

              {/* Right Side: Circular Progress Solved Bar & Random Pick Button */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
                {/* Conic circular solved ring */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    background: `conic-gradient(#00b8a3 ${percentSolved}%, #3a3a3a 0%)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 0 8px rgba(0,184,163,0.15)'
                  }}>
                    <div style={{
                      width: 30,
                      height: 30,
                      borderRadius: '50%',
                      background: '#1a1a1a',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 10,
                      fontWeight: 700,
                      color: '#00b8a3'
                    }}>{percentSolved}%</div>
                  </div>
                  <span style={{ fontSize: 13, color: '#9ca3af', fontWeight: 500 }}>
                    <strong style={{ color: '#eff3f6' }}>{solvedCount}</strong> / {totalCount} Solved
                  </span>
                </div>

                {/* Shuffle / Random pick */}
                <button
                  onClick={handleRandomPick}
                  style={{
                    background: '#333333',
                    border: '1px solid #444444',
                    borderRadius: 6,
                    padding: '8px 12px',
                    color: '#eff3f6',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: 12,
                    fontWeight: 600,
                    transition: 'all 0.2s'
                  }}
                  className="shuffle-button"
                  title="Random pick a question"
                >
                  <Shuffle size={14} color="#8a8a8a" />
                  <span>Random</span>
                </button>
              </div>
            </div>

            {/* Problems List Table */}
            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {Array(6).fill(0).map((_, i) => (
                  <div key={i} className="skeleton" style={{ height: 42, borderRadius: 6, background: '#2c2c2c' }} />
                ))}
              </div>
            ) : !page || page.content.length === 0 ? (
              <div style={{ padding: 48, textAlign: 'center', color: '#64748b' }}>
                <Code2 size={40} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
                <p>No questions found in PrepNest bank. Try adjusting filters!</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {/* Table Header */}
                <div style={{ display: 'grid', gridTemplateColumns: '3rem 1fr 100px 100px 50px', padding: '10px 12px', alignItems: 'center', borderBottom: '1px solid #333333', color: '#8a8a8a', fontSize: 12, fontWeight: 600 }}>
                  <div>Status</div>
                  <div>Title</div>
                  <div>Acceptance</div>
                  <div>Difficulty</div>
                  <div style={{ justifySelf: 'center' }}>Favorite</div>
                </div>

                {/* Table Rows */}
                {page.content.map((p, idx) => {
                  const solved = user ? p.userSolvedList.includes(user.userId) : false
                  const isFavorited = favorites.includes(p.id)
                  const displayIndex = (currentPage * 15) + idx + 1
                  
                  return (
                    <div
                      key={p.id}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '3rem 1fr 100px 100px 50px',
                        padding: '12px 12px',
                        alignItems: 'center',
                        borderRadius: 4,
                        background: idx % 2 === 0 ? '#262626' : '#232323',
                        borderBottom: '1px solid #2c2c2c',
                        transition: 'background 0.2s, transform 0.2s'
                      }}
                      className="problems-table-row"
                    >
                      {/* Check mark toggle */}
                      <button
                        onClick={() => toggleSolved(p)}
                        disabled={solving === p.id}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', width: 'fit-content' }}
                        title={solved ? "Mark as unsolved" : "Mark as solved"}
                      >
                        {solving === p.id ? (
                          <div className="spinner" style={{ width: 14, height: 14, borderWidth: 1.5, borderColor: '#00b8a3 #00b8a3 transparent transparent' }} />
                        ) : solved ? (
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 16, height: 16, borderRadius: '50%', background: '#00b8a3' }}>
                            <Check size={11} color="#1a1a1a" style={{ strokeWidth: 4 }} />
                          </div>
                        ) : (
                          <div style={{ width: 14, height: 14, borderRadius: '50%', border: '1.5px solid #5a5a5a' }} className="checkbox-empty" />
                        )}
                      </button>

                      {/* Problem Title */}
                      <a
                        href={p.leetcodeLink || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          fontSize: 13,
                          fontWeight: 500,
                          color: solved ? '#00b8a3' : '#eff3f6',
                          textDecoration: 'none',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          transition: 'color 0.2s'
                        }}
                        className="problem-title-link"
                      >
                        {displayIndex}. {p.title}
                      </a>

                      {/* Acceptance column using dynamic det hash */}
                      <span style={{ fontSize: 13, color: '#8a8a8a', fontFamily: 'monospace' }}>
                        {getAcceptanceRate(p.title)}
                      </span>

                      {/* Difficulty (Plain color text, Medium is Med.) */}
                      <span style={{ fontSize: 13, fontWeight: 600, color: difficultyColor(p.difficulty) }}>
                        {formatDifficultyLabel(p.difficulty)}
                      </span>

                      {/* Bookmark Star button */}
                      <button
                        onClick={() => toggleFavorite(p.id)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', justifySelf: 'center', display: 'flex', alignItems: 'center' }}
                        title={isFavorited ? "Remove from favorites" : "Save to favorites"}
                      >
                        <Star
                          size={15}
                          color={isFavorited ? '#ffc01e' : '#5a5a5a'}
                          fill={isFavorited ? '#ffc01e' : 'none'}
                          style={{ transition: 'transform 0.15s ease' }}
                          className="favorite-star-icon"
                        />
                      </button>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Pagination */}
            {page && page.totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginTop: 18, alignItems: 'center' }}>
                <button
                  disabled={currentPage === 0}
                  onClick={() => setCurrentPage(p => p - 1)}
                  style={{
                    background: '#333333',
                    border: '1px solid #444444',
                    color: currentPage === 0 ? '#5a5a5a' : '#eff3f6',
                    borderRadius: 6,
                    padding: '5px 12px',
                    cursor: currentPage === 0 ? 'not-allowed' : 'pointer',
                    fontSize: 12,
                    fontWeight: 600,
                    transition: 'all 0.2s'
                  }}
                  className="page-nav-btn"
                >
                  <ChevronLeft size={14} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />
                  Prev
                </button>
                <span style={{ fontSize: 12, color: '#8a8a8a', fontWeight: 500 }}>
                  {currentPage + 1} / {page.totalPages}
                </span>
                <button
                  disabled={currentPage >= page.totalPages - 1}
                  onClick={() => setCurrentPage(p => p + 1)}
                  style={{
                    background: '#333333',
                    border: '1px solid #444444',
                    color: currentPage >= page.totalPages - 1 ? '#5a5a5a' : '#eff3f6',
                    borderRadius: 6,
                    padding: '5px 12px',
                    cursor: currentPage >= page.totalPages - 1 ? 'not-allowed' : 'pointer',
                    fontSize: 12,
                    fontWeight: 600,
                    transition: 'all 0.2s'
                  }}
                  className="page-nav-btn"
                >
                  Next
                  <ChevronRight size={14} style={{ display: 'inline', marginLeft: 4, verticalAlign: 'middle' }} />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar Widgets */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          
          {/* Calendar Check-in Streak Grid Card */}
          <div style={{ background: '#262626', borderRadius: 8, border: '1px solid #333333', padding: 16, position: 'relative', overflow: 'hidden' }}>
            
            {/* Custom CSS Metallic Gold Emblem Badge in Top Right */}
            <div className="metallic-gold-badge" title={`${currentMonthName} Streak Badge`}>
              <div className="badge-inner">
                <span className="badge-number">{currentMonthNumber}</span>
                <span className="badge-text">{currentMonthName}</span>
              </div>
            </div>

            {/* Streak Header */}
            <div style={{ marginBottom: 12, width: '78%' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: '#eff3f6' }}>
                <Clock size={14} color="#00b8a3" />
                <span>Day 29</span>
              </div>
              <div style={{ fontSize: 11, color: '#a8a8a8', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ background: 'rgba(0,184,163,0.15)', color: '#00b8a3', padding: '1px 6px', borderRadius: 10, fontSize: 10, fontWeight: 700 }}>
                  {timeLeft}
                </span>
              </div>
            </div>

            {/* Streak count indicator */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '6px 10px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.04)', marginBottom: 14 }}>
              <span style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600 }}>Active Check-ins</span>
              <span style={{ fontSize: 11, color: '#ffc01e', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                🔥 {user ? '12 Days' : '0 Days'}
              </span>
            </div>

            {/* Streak 31 Days Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, textAlign: 'center' }}>
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                <span key={i} style={{ fontSize: 10, fontWeight: 700, color: '#5a5a5a', marginBottom: 4 }}>{d}</span>
              ))}
              {daysInMonth.map(day => {
                const isChecked = checkedDays.includes(day)
                return (
                  <div
                    key={day}
                    style={{
                      aspectRatio: '1',
                      borderRadius: '50%',
                      background: isChecked ? 'rgba(0,140,255,0.12)' : 'rgba(255,255,255,0.02)',
                      border: `1px solid ${isChecked ? '#008cff' : 'rgba(255,255,255,0.05)'}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 10,
                      fontWeight: 700,
                      color: isChecked ? '#008cff' : '#8a8a8a',
                      cursor: 'pointer',
                      boxShadow: isChecked ? '0 0 6px rgba(0,140,255,0.15)' : 'none',
                      transition: 'all 0.15s ease'
                    }}
                    className={`calendar-day-circle ${isChecked ? 'checked-day' : ''}`}
                    onClick={() => toast(`${currentMonthName} ${day}: ${isChecked ? 'Checked in! 🔥' : 'No check-in record'}`)}
                  >
                    {isChecked ? '✓' : day}
                  </div>
                )
              })}
            </div>

            {/* Progress / Redeem Bottom bar */}
            <div style={{ marginTop: 14, borderTop: '1px solid #333', paddingTop: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, color: '#8a8a8a' }}>
              <span style={{ color: '#00b8a3', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 3 }}>
                <Sparkles size={11} /> 0 XP points
              </span>
              <button
                onClick={() => toast('No points to redeem today. Keep coding to earn rewards!')}
                style={{ background: 'none', border: 'none', color: '#ffc01e', cursor: 'pointer', fontSize: 11, fontWeight: 700 }}
                className="redeem-text-btn"
              >
                Redeem Rewards
              </button>
            </div>
          </div>

          {/* Weekly Quest progress (Adapted from Weekly Premium card) */}
          <div style={{ background: '#262626', borderRadius: 8, border: '1px solid #333333', padding: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#eff3f6', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Award size={14} color="#ffc01e" />
                <span>Weekly Quest Progress</span>
              </div>
              <span style={{ fontSize: 9, background: 'rgba(255,192,30,0.15)', color: '#ffc01e', padding: '1px 6px', borderRadius: 4, fontWeight: 700 }}>1 day left</span>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 4, position: 'relative' }}>
              {/* Progress Line */}
              <div style={{ position: 'absolute', left: '10%', right: '10%', top: '50%', height: 2, background: '#333333', zIndex: 0 }} />
              
              {['W1', 'W2', 'W3', 'W4', 'W5'].map((week, idx) => {
                const isSelected = idx === 4 // W5 is selected, just like screenshot
                return (
                  <button
                    key={week}
                    onClick={() => toast(`Weekly Sprint ${week} Selected!`)}
                    style={{
                      zIndex: 1,
                      background: isSelected ? '#ffc01e' : '#1e1e1e',
                      border: `1.5px solid ${isSelected ? '#ffc01e' : '#3a3a3a'}`,
                      borderRadius: '50%',
                      width: 32,
                      height: 32,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 10,
                      fontWeight: 800,
                      color: isSelected ? '#1a1a1a' : '#8a8a8a',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      boxShadow: isSelected ? '0 0 10px rgba(255,192,30,0.4)' : 'none'
                    }}
                    className="week-badge-btn"
                  >
                    {week}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Trending Companies List (Pills and Search filter) */}
          <div style={{ background: '#262626', borderRadius: 8, border: '1px solid #333333', padding: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#eff3f6', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Briefcase size={14} color="#008cff" />
                <span>Trending Companies</span>
              </div>
              <div style={{ display: 'flex', gap: 4 }}>
                <button style={chevronMiniStyle} onClick={() => toast('Prev company list')}><ChevronLeft size={12} /></button>
                <button style={chevronMiniStyle} onClick={() => toast('Next company list')}><ChevronRight size={12} /></button>
              </div>
            </div>

            {/* Company Search bar */}
            <div style={{ position: 'relative', marginBottom: 12 }}>
              <Search size={12} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
              <input
                type="text"
                placeholder="Search a company..."
                value={companySearch}
                onChange={e => setCompanySearch(e.target.value)}
                style={{
                  width: '100%',
                  background: '#1a1a1a',
                  border: '1px solid #3a3a3a',
                  borderRadius: 6,
                  padding: '6px 10px 6px 28px',
                  fontSize: 11,
                  color: '#eff3f6',
                  outline: 'none'
                }}
              />
            </div>

            {/* List grid */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {TRENDING_COMPANIES.filter(tc => tc.name.toLowerCase().includes(companySearch.toLowerCase())).map(tc => (
                <div
                  key={tc.name}
                  onClick={() => { setSearch(tc.name); setCurrentPage(0); setTag('') }}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: '#1e1e1e',
                    border: '1px solid #2e2e2e',
                    padding: '8px 12px',
                    borderRadius: 6,
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  className="company-item-row"
                >
                  <span style={{ fontSize: 12, color: '#eff3f6', fontWeight: 500 }}>{tc.name}</span>
                  <span style={{
                    fontSize: 10,
                    color: '#1a1a1a',
                    background: '#ffc01e',
                    padding: '2px 8px',
                    borderRadius: 12,
                    fontWeight: 700
                  }}>
                    {tc.count} Qs
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Styled custom CSS embedded for pixel-perfect transitions, scrolls and gold/blue badges */}
      <style>{`
        .leetcode-container {
          background-color: #1a1a1a;
          min-height: 100vh;
          color: #eff3f6;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
          padding: 20px 24px;
        }
        
        .leetcode-grid {
          display: grid;
          grid-template-columns: 1fr 310px;
          gap: 24px;
          max-width: 1300px;
          margin: 0 auto;
        }

        .leetcode-banner {
          border-radius: 8px;
          padding: 16px 20px;
          height: 120px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          position: relative;
          overflow: hidden;
          transition: transform 0.25s ease, box-shadow 0.25s ease;
        }
        .leetcode-banner:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 18px rgba(0, 0, 0, 0.4);
        }

        .topic-capsule-btn {
          background: #2c2c2c;
          border: 1px solid #3a3a3a;
          border-radius: 20px;
          color: #eff3f6;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          font-size: 13px;
          font-weight: 500;
          transition: all 0.2s ease;
        }
        .topic-capsule-btn:hover {
          background: #333333;
          border-color: #5a5a5a;
        }
        .topic-capsule-btn.active {
          background: rgba(255, 255, 255, 0.1);
          border-color: #00b8a3;
          color: #00b8a3;
        }

        .topic-badge-count {
          font-size: 10px;
          opacity: 0.8;
          background: #1e1e1e;
          padding: 1px 6px;
          border-radius: 10px;
          color: #8a8a8a;
        }

        .expand-btn-hover:hover {
          color: #ffffff !important;
        }

        .tab-filter-btn {
          background: transparent;
          color: #8a8a8a;
          border: none;
          border-radius: 20px;
          padding: 8px 16px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .tab-filter-btn:hover {
          color: #ffffff;
        }
        .tab-filter-btn.active {
          background: #ffffff;
          color: #1a1a1a;
        }

        .diff-tab-btn {
          background: transparent;
          border: none;
          border-radius: 6px;
          padding: 6px 12px;
          font-size: 11px;
          font-weight: 700;
          cursor: pointer;
          transition: background 0.2s;
        }
        .diff-tab-btn:hover {
          background: rgba(255,255,255,0.03);
        }
        .diff-tab-btn.active {
          background: #3c3c3c;
        }

        .search-input-field:focus {
          border-color: #5a5a5a !important;
        }

        .shuffle-button:hover {
          background: #3e3e3e !important;
          border-color: #555555 !important;
        }

        .problems-table-row:hover {
          background-color: #2b2b2b !important;
        }
        .problems-table-row:hover .problem-title-link {
          color: #00b8a3 !important;
        }
        .problems-table-row:hover .favorite-star-icon {
          color: #ffc01e !important;
        }

        .checkbox-empty:hover {
          border-color: #8a8a8a !important;
        }

        .page-nav-btn:hover:not(:disabled) {
          background: #3e3e3e !important;
          border-color: #5a5a5a !important;
        }

        .metallic-gold-badge {
          position: absolute;
          top: -12px;
          right: -10px;
          width: 90px;
          height: 90px;
          background: radial-gradient(circle, #e6c875 0%, #a38127 75%, #634d12 100%);
          clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
          display: flex;
          align-items: center;
          justifyContent: center;
          box-shadow: 0 4px 10px rgba(0,0,0,0.5), inset 0 2px 4px rgba(255,255,255,0.3);
          transform: rotate(5deg) scale(0.7);
          border: 1px solid #7c6019;
          transition: transform 0.25s ease;
        }
        .metallic-gold-badge:hover {
          transform: rotate(0deg) scale(0.75);
        }
        
        .badge-inner {
          display: flex;
          flex-direction: column;
          align-items: center;
          color: #1a1a1a;
          font-weight: 800;
          line-height: 1.1;
        }
        .badge-number {
          font-size: 20px;
          text-shadow: 1px 1px 1px rgba(255,255,255,0.4);
        }
        .badge-text {
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .checked-day:hover {
          box-shadow: 0 0 10px rgba(0,140,255,0.4) !important;
        }

        .redeem-text-btn:hover {
          text-decoration: underline;
        }

        .week-badge-btn:hover {
          transform: scale(1.08);
        }

        .company-item-row:hover {
          background-color: #2b2b2b !important;
          border-color: #444 !important;
        }

        .spinner {
          animation: spin 0.8s linear infinite;
          border-radius: 50%;
          border-style: solid;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        @media (max-width: 992px) {
          .leetcode-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  )
}

const chevronMiniStyle: React.CSSProperties = {
  background: '#333333',
  border: 'none',
  borderRadius: 4,
  padding: 4,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#8a8a8a',
  width: 22,
  height: 22
}
