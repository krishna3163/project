import { useEffect, useState } from 'react'
import { api } from '../context/AuthContext'
import toast from 'react-hot-toast'
import { ChevronDown, ChevronUp, BookOpen } from 'lucide-react'

interface Resource { title: string; url: string; type: string }
interface Stage { week: number; title: string; topics: string[]; resources: Resource[] }
interface Roadmap { id: string; companyName: string; logoUrl: string; stages: Stage[] }

const COMPANY_EMOJIS: Record<string, string> = {
  Google: '🌈', Amazon: '📦', Microsoft: '🪟', Apple: '🍎', Meta: '📘',
  Netflix: '🎬', Uber: '🚗', Flipkart: '🛒', Paytm: '💳', default: '🏢',
}

export default function RoadmapsPage() {
  const [roadmaps, setRoadmaps] = useState<Roadmap[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<Set<number>>(new Set([1]))

  useEffect(() => {
    api.get('/api/roadmaps').then(r => {
      setRoadmaps(r.data)
      if (r.data.length > 0) setSelected(r.data[0].id)
    }).catch(() => toast.error('Failed to load roadmaps')).finally(() => setLoading(false))
  }, [])

  const currentRoadmap = roadmaps.find(r => r.id === selected)

  return (
    <div className="page">
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ marginBottom: 4 }}>Company Roadmaps</h1>
        <p style={{ color: '#64748b', fontSize: 13 }}>Week-by-week preparation guide for top companies</p>
      </div>

      {loading ? (
        <div className="skeleton" style={{ height: 400 }} />
      ) : (
        <div className="roadmap-layout">
          {/* Company selector */}
          <div className="roadmap-sidebar" style={{ width: 200, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {roadmaps.map(r => (
                <button key={r.id}
                  onClick={() => setSelected(r.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '12px 14px', borderRadius: 10, border: 'none', cursor: 'pointer',
                    background: selected === r.id ? 'rgba(99,102,241,0.2)' : 'rgba(99,102,241,0.05)',
                    borderLeft: `3px solid ${selected === r.id ? '#6366f1' : 'transparent'}`,
                    color: selected === r.id ? '#f1f5f9' : '#94a3b8',
                    fontSize: 14, fontWeight: 500, fontFamily: 'Inter, sans-serif',
                    textAlign: 'left', transition: 'all 0.15s',
                  }}
                  id={`roadmap-${r.companyName.toLowerCase()}`}
                >
                  <span style={{ fontSize: 20 }}>{COMPANY_EMOJIS[r.companyName] || COMPANY_EMOJIS.default}</span>
                  {r.companyName}
                </button>
              ))}
          </div>

          {/* Roadmap detail */}
          {currentRoadmap && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div className="card" style={{ marginBottom: 4, padding: '20px 24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 32 }}>{COMPANY_EMOJIS[currentRoadmap.companyName] || '🏢'}</span>
                  <div>
                    <h2 style={{ marginBottom: 2 }}>{currentRoadmap.companyName} Roadmap</h2>
                    <p style={{ color: '#64748b', fontSize: 13 }}>{currentRoadmap.stages.length} weeks of structured preparation</p>
                  </div>
                </div>
              </div>

              {currentRoadmap.stages.map(stage => {
                const isOpen = expanded.has(stage.week)
                return (
                  <div key={stage.week} className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    <button
                      onClick={() => setExpanded(prev => {
                        const next = new Set(prev)
                        if (next.has(stage.week)) next.delete(stage.week)
                        else next.add(stage.week)
                        return next
                      })}
                      style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        width: '100%', padding: '16px 20px', background: 'none', border: 'none',
                        cursor: 'pointer', color: '#f1f5f9', fontFamily: 'Inter, sans-serif',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{
                          width: 36, height: 36, borderRadius: 8,
                          background: 'linear-gradient(135deg, #6366f1, #818cf8)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 13, fontWeight: 700, color: '#fff',
                        }}>W{stage.week}</div>
                        <div style={{ textAlign: 'left' }}>
                          <div style={{ fontWeight: 600, fontSize: 15 }}>{stage.title}</div>
                          <div style={{ color: '#64748b', fontSize: 12 }}>{stage.topics.length} topics</div>
                        </div>
                      </div>
                      {isOpen ? <ChevronUp size={18} color="#64748b" /> : <ChevronDown size={18} color="#64748b" />}
                    </button>

                    {isOpen && (
                      <div style={{ padding: '0 20px 20px' }} className="fade-in">
                        <div className="divider" style={{ marginTop: 0 }} />
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
                          {stage.topics.map(t => (
                            <span key={t} className="tag" style={{ fontSize: 13 }}>{t}</span>
                          ))}
                        </div>
                        {stage.resources?.length > 0 && (
                          <>
                            <p style={{ color: '#94a3b8', fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
                              📚 Resources
                            </p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                              {stage.resources.map((res, i) => (
                                <a key={i} href={res.url} target="_blank" rel="noopener noreferrer"
                                  style={{
                                    display: 'flex', alignItems: 'center', gap: 10,
                                    padding: '8px 12px', borderRadius: 8, textDecoration: 'none',
                                    background: 'rgba(99,102,241,0.06)',
                                    border: '1px solid rgba(99,102,241,0.12)',
                                    color: '#94a3b8', fontSize: 13,
                                  }}>
                                  <BookOpen size={13} color="#6366f1" />
                                  {res.title}
                                  <span style={{
                                    marginLeft: 'auto', fontSize: 11,
                                    background: 'rgba(99,102,241,0.15)',
                                    padding: '1px 6px', borderRadius: 10, color: '#818cf8',
                                  }}>{res.type}</span>
                                </a>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
