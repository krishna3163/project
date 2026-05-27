import { useEffect, useState } from 'react'
import { api } from '../context/AuthContext'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Trophy, Clock, Users, ChevronRight } from 'lucide-react'

interface MockTest {
  id: string
  title: string
  questions: any[]
  duration: number
  totalMarks: number
  createdAt: string
}

export default function MockTestsPage() {
  const [tests, setTests] = useState<MockTest[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/api/mock-tests', { params: { size: 20 } })
      .then(r => setTests(r.data.content || []))
      .catch(() => toast.error('Failed to load tests'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
        <div>
          <h1 style={{ marginBottom: 4 }}>Mock Tests</h1>
          <p style={{ color: '#64748b', fontSize: 13 }}>Practice & compete with others</p>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-3">
          {Array(6).fill(0).map((_, i) => <div key={i} className="skeleton" style={{ height: 180 }} />)}
        </div>
      ) : tests.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 48 }}>
          <Trophy size={48} color="#6366f1" style={{ margin: '0 auto 16px', opacity: 0.6 }} />
          <h3 style={{ marginBottom: 8 }}>No tests available yet</h3>
          <p style={{ color: '#64748b' }}>Check back later for new mock tests.</p>
        </div>
      ) : (
        <div className="grid grid-3">
          {tests.map(test => (
            <div key={test.id} className="card stagger" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12,
                background: 'rgba(245,158,11,0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Trophy size={22} color="#f59e0b" />
              </div>
              <h3 style={{ fontSize: 16 }}>{test.title}</h3>
              <div style={{ display: 'flex', gap: 16, color: '#64748b', fontSize: 13 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <Users size={13} />{test.questions?.length || 0} Qs
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <Clock size={13} />{test.duration} min
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <Trophy size={13} />{test.totalMarks} marks
                </span>
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 'auto' }}>
                <Link to={`/mock-tests/${test.id}`} className="btn btn-primary btn-sm"
                  style={{ flex: 1, justifyContent: 'center' }}>
                  Start Test <ChevronRight size={14} />
                </Link>
                <Link to={`/mock-tests/${test.id}?tab=leaderboard`} className="btn btn-outline btn-sm">
                  Board
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
