import { useEffect, useState } from 'react'
import { api } from '../context/AuthContext'
import toast from 'react-hot-toast'
import { Briefcase, Upload, Star, Sparkles, Users, BookOpen, MessageSquare, Award, ShieldCheck } from 'lucide-react'
import ReactMarkdown from 'react-markdown'

interface CommunityReview {
  id: string
  reviewerUserId: string
  reviewerName: string
  feedbackText: string
  rating: number
  createdAt: string
}

interface Resume {
  id: string
  fileName: string
  fileUrl: string
  analysisScore: number
  suggestions: string[]
  matchedKeywords: string[]
  aiFeedback?: string
  atsScore: number
  uploadedAt: string
  requestFeedback: boolean
  communityReviews: CommunityReview[]
}

interface SampleResume {
  id: string
  name: string
  placedAt: string
  atsScore: number
  role: string
  fileUrl: string
  fileName: string
}

interface AtsStats {
  totalAnalyzed: number
  averageScore: number
  highestScore: number
}

export default function ResumePage() {
  const [resumes, setResumes] = useState<Resume[]>([])
  const [feed, setFeed] = useState<Resume[]>([])
  const [samples, setSamples] = useState<SampleResume[]>([])
  const [stats, setStats] = useState<AtsStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ fileName: '', fileUrl: '' })
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<'my-resumes' | 'community-feed' | 'placed-samples'>('my-resumes')
  
  // Community review writing state
  const [selectedFeedResume, setSelectedFeedResume] = useState<Resume | null>(null)
  const [reviewForm, setReviewForm] = useState({ feedbackText: '', rating: 5 })
  const [submittingReview, setSubmittingReview] = useState(false)

  const fetchResumes = () => {
    api.get('/api/resumes').then(r => setResumes(r.data.content || [])).catch(() => {}).finally(() => setLoading(false))
  }

  const fetchFeed = () => {
    api.get('/api/resumes/feed').then(r => setFeed(r.data)).catch(() => {})
  }

  const fetchSamples = () => {
    api.get('/api/resumes/samples').then(r => setSamples(r.data)).catch(() => {})
  }

  const fetchStats = () => {
    api.get('/api/resumes/stats').then(r => setStats(r.data)).catch(() => {})
  }

  useEffect(() => { 
    fetchResumes()
    fetchFeed()
    fetchSamples()
    fetchStats()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.fileUrl.trim()) { toast.error('File URL required'); return }
    setSaving(true)
    try {
      await api.post('/api/resumes', form)
      toast.success('Resume submitted! AI text parsing & ATS analysis started.')
      setForm({ fileName: '', fileUrl: '' })
      setTimeout(() => {
        fetchResumes()
        fetchStats()
      }, 3000)
    } catch { toast.error('Failed to submit resume') }
    finally { setSaving(false) }
  }

  const handleToggleFeedback = async (resumeId: string) => {
    try {
      const res = await api.post(`/api/resumes/${resumeId}/request-feedback`)
      setResumes(prev => prev.map(r => r.id === resumeId ? { ...r, requestFeedback: res.data.requestFeedback } : r))
      toast.success(res.data.requestFeedback ? 'Resume shared with community for feedback! 📣' : 'Removed from community feed.')
      fetchFeed()
    } catch {
      toast.error('Failed to update sharing preference')
    }
  }

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedFeedResume) return
    setSubmittingReview(true)
    try {
      await api.post(`/api/resumes/${selectedFeedResume.id}/review`, reviewForm)
      toast.success('🎉 Feedback submitted! +50 XP awarded!')
      setReviewForm({ feedbackText: '', rating: 5 })
      setSelectedFeedResume(null)
      fetchFeed()
    } catch {
      toast.error('Failed to submit review')
    } finally {
      setSubmittingReview(false)
    }
  }

  const scoreColor = (s: number) => s >= 70 ? '#10b981' : s >= 40 ? '#f59e0b' : '#ef4444'

  return (
    <div className="page fade-in">
      <div style={{ display: 'flex', justifyItems: 'center', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ marginBottom: 4 }}>Resume Ecosystem</h1>
          <p style={{ color: '#64748b', fontSize: 13 }}>ATS optimization, community peer feedback, and placed student resume guides</p>
        </div>

        {/* ATS Score benchmark widget */}
        {stats && (
          <div style={{ display: 'flex', gap: 16, background: 'rgba(99,102,241,0.05)', padding: '10px 20px', borderRadius: 12, border: '1px solid rgba(99,102,241,0.15)', alignItems: 'center' }}>
            <div style={{ textAlign: 'center' }}>
              <span style={{ fontSize: 11, color: '#94a3b8', display: 'block', fontWeight: 600 }}>COMMUNITY AVG</span>
              <strong style={{ fontSize: 18, color: '#f1f5f9' }}>{stats.averageScore}%</strong>
            </div>
            <div style={{ width: 1, height: 28, background: 'rgba(255,255,255,0.1)' }} />
            <div style={{ textAlign: 'center' }}>
              <span style={{ fontSize: 11, color: '#f59e0b', display: 'block', fontWeight: 600 }}>TOP SCORE</span>
              <strong style={{ fontSize: 18, color: '#f59e0b' }}>{stats.highestScore}%</strong>
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, borderBottom: '1px solid rgba(255,255,255,0.06)', marginBottom: 28 }}>
        <button
          onClick={() => setActiveTab('my-resumes')}
          className={`btn ${activeTab === 'my-resumes' ? 'btn-primary' : 'btn-outline'}`}
          style={{ borderBottomLeftRadius: 0, borderBottomRightRadius: 0, border: activeTab === 'my-resumes' ? 'none' : '1px solid rgba(255,255,255,0.05)' }}
        >
          <Upload size={14} /> My Resumes
        </button>
        <button
          onClick={() => setActiveTab('community-feed')}
          className={`btn ${activeTab === 'community-feed' ? 'btn-primary' : 'btn-outline'}`}
          style={{ borderBottomLeftRadius: 0, borderBottomRightRadius: 0, border: activeTab === 'community-feed' ? 'none' : '1px solid rgba(255,255,255,0.05)' }}
        >
          <Users size={14} /> Community Reviews ({feed.length})
        </button>
        <button
          onClick={() => setActiveTab('placed-samples')}
          className={`btn ${activeTab === 'placed-samples' ? 'btn-primary' : 'btn-outline'}`}
          style={{ borderBottomLeftRadius: 0, borderBottomRightRadius: 0, border: activeTab === 'placed-samples' ? 'none' : '1px solid rgba(255,255,255,0.05)' }}
        >
          <BookOpen size={14} /> Placed Samples ({samples.length})
        </button>
      </div>

      {/* TAB 1: My Resumes */}
      {activeTab === 'my-resumes' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
          
          {/* Submit form */}
          <div className="card" style={{ padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <Upload size={20} color="#818cf8" />
              <h3>Analyze & Rank Your Resume</h3>
            </div>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <p style={{ color: '#94a3b8', fontSize: 13, margin: 0 }}>
                Enter the path/link to your PDF resume (e.g. hosted on Google Drive or Cloudinary). Our Apache Tika parser will extract keywords and benchmark it against target recruiter criteria.
              </p>
              <div className="grid grid-2">
                <div>
                  <label className="label" style={{ fontSize: 12 }}>File Name</label>
                  <input className="input" placeholder="e.g. Resume_SDE_2026.pdf" value={form.fileName}
                    onChange={e => setForm(f => ({ ...f, fileName: e.target.value }))} style={{ fontSize: 13 }} />
                </div>
                <div>
                  <label className="label" style={{ fontSize: 12 }}>Resume PDF URL *</label>
                  <input type="url" className="input" placeholder="https://..." value={form.fileUrl}
                    onChange={e => setForm(f => ({ ...f, fileUrl: e.target.value }))} required style={{ fontSize: 13 }} />
                </div>
              </div>
              <button type="submit" className="btn btn-primary" disabled={saving} id="btn-analyze-resume" style={{ alignSelf: 'flex-start' }}>
                <Star size={14} />
                {saving ? 'Analyzing...' : 'Analyze Resume'}
              </button>
            </form>
          </div>

          {/* User's History list */}
          {loading ? (
            <div className="skeleton" style={{ height: 200 }} />
          ) : resumes.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: 40 }}>
              <Briefcase size={36} color="#6366f1" style={{ margin: '0 auto 12px', opacity: 0.4 }} />
              <h3>No resumes submitted</h3>
              <p style={{ color: '#64748b', fontSize: 13, marginTop: 4 }}>Submit a resume PDF URL above to receive detailed AI keyword metrics.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              {resumes.map(r => (
                <div key={r.id} className="card" style={{ padding: 24 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
                    <div>
                      <h3 style={{ margin: '0 0 4px 0' }}>{r.fileName}</h3>
                      <span style={{ color: '#64748b', fontSize: 12 }}>
                        Uploaded {new Date(r.uploadedAt).toLocaleDateString()}
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 32, fontWeight: 800, color: scoreColor(r.atsScore) }}>
                          {r.atsScore || r.analysisScore}%
                        </div>
                        <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>ATS Score</div>
                      </div>
                      <button
                        onClick={() => handleToggleFeedback(r.id)}
                        className={`btn btn-sm ${r.requestFeedback ? 'btn-primary' : 'btn-outline'}`}
                        style={{ fontSize: 11, height: 32 }}
                      >
                        <Users size={12} /> {r.requestFeedback ? 'Feedback Active' : 'Request Feedback'}
                      </button>
                    </div>
                  </div>

                  {/* Suggestions & Report */}
                  {r.aiFeedback && (
                    <div style={{ marginTop: 16 }}>
                      <h4 style={{ color: '#f59e0b', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, margin: '0 0 10px 0' }}>
                        <Sparkles size={14} /> AI Optimization Report
                      </h4>
                      <div className="card" style={{ background: 'rgba(15,23,42,0.4)', padding: '16px 20px', fontSize: 13, color: '#e2e8f0', border: '1px solid rgba(245,158,11,0.15)', overflowX: 'auto' }}>
                        <ReactMarkdown>{r.aiFeedback}</ReactMarkdown>
                      </div>
                    </div>
                  )}

                  {/* Peer Reviews Display */}
                  {r.communityReviews && r.communityReviews.length > 0 && (
                    <div style={{ marginTop: 24, borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 20 }}>
                      <h4 style={{ fontSize: 13, color: '#818cf8', display: 'flex', alignItems: 'center', gap: 6, margin: '0 0 14px 0' }}>
                        <MessageSquare size={14} /> Community Peer Feedback ({r.communityReviews.length})
                      </h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {r.communityReviews.map(review => (
                          <div key={review.id} style={{ background: 'rgba(255,255,255,0.02)', padding: 14, borderRadius: 10, border: '1px solid rgba(255,255,255,0.04)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                              <strong style={{ fontSize: 12, color: '#cbd5e1' }}>{review.reviewerName}</strong>
                              <div style={{ display: 'flex', gap: 2 }}>
                                {Array.from({ length: 5 }).map((_, starIdx) => (
                                  <Star key={starIdx} size={11} fill={starIdx < review.rating ? '#f59e0b' : 'none'} color={starIdx < review.rating ? '#f59e0b' : '#475569'} />
                                ))}
                              </div>
                            </div>
                            <p style={{ margin: 0, fontSize: 13, color: '#94a3b8', lineHeight: 1.5 }}>{review.feedbackText}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                    <a href={r.fileUrl} target="_blank" rel="noopener noreferrer" className="btn btn-outline btn-sm" style={{ textDecoration: 'none', fontSize: 12, height: 32 }}>
                      View Original PDF
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Community Reviews Feed */}
      {activeTab === 'community-feed' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, alignItems: 'start' }}>
          
          {/* Feed List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <h3 style={{ margin: '0 0 8px 0', fontSize: 16, color: '#cbd5e1' }}>Resumes Awaiting Review</h3>
            {feed.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: 40 }}>
                <Users size={32} color="#64748b" style={{ margin: '0 auto 12px', opacity: 0.4 }} />
                <p style={{ color: '#94a3b8', fontSize: 13 }}>No student resumes in the review feed currently.</p>
              </div>
            ) : (
              feed.map(peerResume => (
                <div key={peerResume.id} className="card" style={{ padding: 18, border: selectedFeedResume?.id === peerResume.id ? '1px solid #6366f1' : '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <div>
                      <h4 style={{ margin: '0 0 2px 0', fontSize: 14 }}>{peerResume.fileName}</h4>
                      <span style={{ fontSize: 11, color: '#64748b' }}>ATS score: {peerResume.atsScore}%</span>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedFeedResume(peerResume)
                        setReviewForm({ feedbackText: '', rating: 5 })
                      }}
                      className="btn btn-primary btn-sm"
                      style={{ fontSize: 11, height: 28 }}
                    >
                      <Star size={10} /> Write Review
                    </button>
                  </div>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <a href={peerResume.fileUrl} target="_blank" rel="noopener noreferrer" className="btn btn-outline btn-sm" style={{ fontSize: 11, height: 26, textDecoration: 'none' }}>
                      Inspect PDF Link
                    </a>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Write Review Panel */}
          <div className="card" style={{ padding: 24, position: 'sticky', top: 20 }}>
            <h3 style={{ margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: 8, color: '#f1f5f9' }}>
              <Award size={18} color="#f59e0b" /> Peer Review Editor
            </h3>

            {selectedFeedResume ? (
              <form onSubmit={handleReviewSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ padding: 12, background: 'rgba(99,102,241,0.05)', borderRadius: 8, border: '1px solid rgba(99,102,241,0.1)' }}>
                  <span style={{ fontSize: 11, color: '#94a3b8', display: 'block' }}>REVIEWING FILE</span>
                  <strong style={{ fontSize: 13, color: '#a5b4fc' }}>{selectedFeedResume.fileName}</strong>
                </div>

                {/* Rating select */}
                <div>
                  <label className="label" style={{ fontSize: 12, marginBottom: 6 }}>Resume Rating</label>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {[1,2,3,4,5].map(val => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setReviewForm(f => ({ ...f, rating: val }))}
                        style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                      >
                        <Star size={24} fill={reviewForm.rating >= val ? '#f59e0b' : 'none'} color={reviewForm.rating >= val ? '#f59e0b' : '#334155'} />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Feedback text */}
                <div>
                  <label className="label" style={{ fontSize: 12, marginBottom: 6 }}>Constructive Feedback</label>
                  <textarea
                    className="input"
                    placeholder="Provide specific improvements about their project descriptions, technologies listed, formatting, or ATS compatibility..."
                    style={{ width: '100%', minHeight: 120, fontSize: 13, resize: 'vertical' }}
                    value={reviewForm.feedbackText}
                    onChange={e => setReviewForm(f => ({ ...f, feedbackText: e.target.value }))}
                    required
                  />
                </div>

                <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                  <button type="button" className="btn btn-outline btn-sm" onClick={() => setSelectedFeedResume(null)}>Cancel</button>
                  <button type="submit" className="btn btn-primary btn-sm" disabled={submittingReview}>
                    {submittingReview ? 'Submitting...' : 'Submit Feedback +50 XP'}
                  </button>
                </div>
              </form>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b' }}>
                <Star size={36} color="#334155" style={{ marginBottom: 12 }} />
                <p style={{ margin: 0, fontSize: 13 }}>Select a resume from the list on the left to inspect its PDF and leave professional feedback for XP points.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: Placed SDE Resumes */}
      {activeTab === 'placed-samples' && (
        <div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 20 }}>
            <ShieldCheck size={20} color="#10b981" />
            <h3 style={{ margin: 0 }}>Verified Placed SDE Resumes</h3>
          </div>
          <p style={{ color: '#94a3b8', fontSize: 13, marginBottom: 24, maxWidth: 700 }}>
            Review original formatting, structure, and keyword strategies of former students placed successfully at top tier product companies.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
            {samples.map(sample => (
              <div key={sample.id} className="card" style={{ padding: 20, display: 'flex', flexDirection: 'column', justifyItems: 'flex-start', borderLeft: '4px solid #10b981' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, background: 'rgba(16,185,129,0.1)', color: '#10b981', padding: '2px 8px', borderRadius: 12 }}>
                    {sample.placedAt}
                  </span>
                  <span style={{ fontSize: 13, fontWeight: 800, color: '#f59e0b' }}>
                    ATS {sample.atsScore}%
                  </span>
                </div>
                <h4 style={{ margin: '0 0 2px 0', fontSize: 15, color: '#f1f5f9' }}>{sample.name}</h4>
                <span style={{ fontSize: 12, color: '#64748b', marginBottom: 16 }}>{sample.role}</span>
                
                <a
                  href={sample.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-outline btn-sm"
                  style={{ marginTop: 'auto', fontSize: 11, alignSelf: 'flex-start', textDecoration: 'none' }}
                >
                  Inspect Sample Resume
                </a>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
