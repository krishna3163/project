import { useEffect, useState, useCallback } from 'react'
import { api } from '../context/AuthContext'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import { Search, CheckCircle2, Circle, Code2 } from 'lucide-react'

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
const TAGS = ['Array', 'String', 'Dynamic Programming', 'Tree', 'Graph', 'Linked List', 'Stack', 'Binary Search', 'Backtracking', 'Greedy', 'Hash Map', 'Heap']

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

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400)
    return () => clearTimeout(t)
  }, [search])

  const fetchProblems = useCallback(async () => {
    setLoading(true)
    try {
      const params: Record<string, string | number> = { page: currentPage, size: 20 }
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

  useEffect(() => { fetchProblems() }, [fetchProblems])

  const toggleSolved = async (problem: Problem) => {
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
      toast.error('Failed to update')
    } finally {
      setSolving(null)
    }
  }

  const difficultyColor = (d: string) => ({
    EASY: '#10b981', MEDIUM: '#f59e0b', HARD: '#ef4444'
  }[d] || '#94a3b8')

  return (
    <div className="page">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <div style={{
          width: 44, height: 44, borderRadius: 12,
          background: 'rgba(99,102,241,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Code2 size={24} color="#818cf8" />
        </div>
        <div>
          <h1 style={{ marginBottom: 2 }}>DSA Tracker</h1>
          <p style={{ color: '#64748b', fontSize: 13 }}>
            {page ? `${page.totalElements} problems · ` : ''}
            Track your problem-solving journey
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: 24, padding: 20 }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Search */}
          <div style={{ position: 'relative', flex: '1 1 200px', minWidth: 200 }}>
            <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
            <input
              id="dsa-search"
              className="input"
              placeholder="Search problems..."
              value={search}
              onChange={e => { setSearch(e.target.value); setCurrentPage(0) }}
              style={{ paddingLeft: 36 }}
            />
          </div>
          {/* Difficulty */}
          <div style={{ display: 'flex', gap: 6 }}>
            {DIFFICULTIES.map(d => (
              <button
                key={d}
                onClick={() => { setDifficulty(d); setCurrentPage(0); setSearch(''); setTag('') }}
                className="btn btn-sm"
                style={{
                  background: difficulty === d ? (d === 'ALL' ? 'rgba(99,102,241,0.3)' : `${difficultyColor(d)}22`) : 'transparent',
                  color: difficulty === d ? (d === 'ALL' ? '#818cf8' : difficultyColor(d)) : '#64748b',
                  border: `1px solid ${difficulty === d ? (d === 'ALL' ? 'rgba(99,102,241,0.4)' : difficultyColor(d) + '44') : 'rgba(99,102,241,0.1)'}`,
                }}
                id={`filter-${d.toLowerCase()}`}
              >{d}</button>
            ))}
          </div>
          {/* Tags */}
          <select
            className="input"
            style={{ width: 'auto', cursor: 'pointer' }}
            value={tag}
            onChange={e => { setTag(e.target.value); setCurrentPage(0); setSearch(''); setDifficulty('ALL') }}
            id="dsa-tag-filter"
          >
            <option value="">All Tags</option>
            {TAGS.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </div>

      {/* Problems list */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 24 }}>
            {Array(8).fill(0).map((_, i) => (
              <div key={i} className="skeleton" style={{ height: 56, marginBottom: 8 }} />
            ))}
          </div>
        ) : !page || page.content.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center', color: '#64748b' }}>
            <Code2 size={40} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
            <p>No problems found. Try adjusting your filters.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <div className="min-w-600">
                {/* Header row */}
                <div style={{
                  display: 'grid', gridTemplateColumns: '2.5rem 1fr 100px 1fr 80px',
              padding: '12px 20px',
              borderBottom: '1px solid rgba(99,102,241,0.1)',
              color: '#64748b', fontSize: 12, fontWeight: 600,
            }}>
              <span></span>
              <span>TITLE</span>
              <span>DIFFICULTY</span>
              <span>TAGS</span>
              <span>LINK</span>
            </div>
            {page.content.map((p, i) => {
              const solved = user ? p.userSolvedList.includes(user.userId) : false
              return (
                <div key={p.id}
                  className="fade-in"
                  style={{
                    display: 'grid', gridTemplateColumns: '2.5rem 1fr 100px 1fr 80px',
                    padding: '14px 20px', alignItems: 'center',
                    borderBottom: '1px solid rgba(99,102,241,0.06)',
                    background: solved ? 'rgba(16,185,129,0.04)' : 'transparent',
                    animationDelay: `${Math.min(i * 0.03, 0.5)}s`,
                    transition: 'background 0.2s ease, transform 0.22s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.2s ease',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = solved ? 'rgba(16,185,129,0.08)' : 'rgba(99,102,241,0.05)'
                    e.currentTarget.style.transform = 'translateX(4px)'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = solved ? 'rgba(16,185,129,0.04)' : 'transparent'
                    e.currentTarget.style.transform = 'translateX(0)'
                  }}
                >
                  <button
                    onClick={() => toggleSolved(p)}
                    disabled={solving === p.id}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer', padding: 4,
                      transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}
                    onMouseEnter={e => { if (!e.currentTarget.disabled) e.currentTarget.style.transform = 'scale(1.25) rotate(10deg)' }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1) rotate(0deg)' }}
                    id={`solve-${p.id}`}
                  >
                    {solving === p.id ? (
                      <div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
                    ) : solved ? (
                      <CheckCircle2 size={20} color="#10b981" style={{ filter: 'drop-shadow(0 0 4px rgba(16,185,129,0.5))' }} />
                    ) : (
                      <Circle size={20} color="#64748b" />
                    )}
                  </button>
                  <span style={{
                    fontSize: 14, fontWeight: 500,
                    color: solved ? '#10b981' : '#f1f5f9',
                    textDecoration: solved ? 'line-through' : 'none',
                    opacity: solved ? 0.75 : 1,
                    transition: 'color 0.2s ease, opacity 0.2s ease',
                  }}>{p.title}</span>
                  <span style={{
                    fontSize: 12, fontWeight: 600,
                    color: difficultyColor(p.difficulty),
                    background: `${difficultyColor(p.difficulty)}15`,
                    padding: '2px 8px', borderRadius: 20,
                    display: 'inline-block',
                    border: `1px solid ${difficultyColor(p.difficulty)}30`,
                    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                  }}>{p.difficulty}</span>
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {p.tags.slice(0, 3).map(t => <span key={t} className="tag">{t}</span>)}
                    {p.tags.length > 3 && <span className="tag">+{p.tags.length - 3}</span>}
                  </div>
                  {p.leetcodeLink ? (
                    <a href={p.leetcodeLink} target="_blank" rel="noopener noreferrer"
                      className="btn btn-secondary btn-sm"
                      style={{ textDecoration: 'none', justifyContent: 'center' }}>
                      Solve
                    </a>
                  ) : <span />}
                </div>
              )
            })}
              </div>
            </div>
            {/* Pagination */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, padding: 20, alignItems: 'center' }}>
              <button className="btn btn-outline btn-sm"
                disabled={currentPage === 0}
                onClick={() => setCurrentPage(p => p - 1)}
                id="dsa-prev">← Prev</button>
              <span style={{ color: '#64748b', fontSize: 13 }}>
                Page {(page?.number || 0) + 1} of {page?.totalPages || 1}
              </span>
              <button className="btn btn-outline btn-sm"
                disabled={(page?.number || 0) >= (page?.totalPages || 1) - 1}
                onClick={() => setCurrentPage(p => p + 1)}
                id="dsa-next">Next →</button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
