import { useEffect, useState } from 'react'
import { api } from '../context/AuthContext'
import toast from 'react-hot-toast'
import { Briefcase, Upload, AlertCircle, Star } from 'lucide-react'

interface Resume {
  id: string
  fileName: string
  fileUrl: string
  analysisScore: number
  suggestions: string[]
  matchedKeywords: string[]
  uploadedAt: string
}

export default function ResumePage() {
  const [resumes, setResumes] = useState<Resume[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ fileName: '', fileUrl: '' })
  const [saving, setSaving] = useState(false)

  const fetchResumes = () => {
    api.get('/api/resumes').then(r => setResumes(r.data.content || [])).catch(() => {}).finally(() => setLoading(false))
  }
  useEffect(() => { fetchResumes() }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.fileUrl.trim()) { toast.error('File URL required'); return }
    setSaving(true)
    try {
      await api.post('/api/resumes', form)
      toast.success('Resume submitted for analysis! Results will appear shortly.')
      setForm({ fileName: '', fileUrl: '' })
      setTimeout(fetchResumes, 3000)
    } catch { toast.error('Failed to submit resume') }
    finally { setSaving(false) }
  }

  const scoreColor = (s: number) => s >= 70 ? '#10b981' : s >= 40 ? '#f59e0b' : '#ef4444'

  return (
    <div className="page">
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ marginBottom: 4 }}>Resume Analyzer</h1>
        <p style={{ color: '#64748b', fontSize: 13 }}>Get AI-powered insights to improve your resume</p>
      </div>

      {/* Upload form */}
      <div className="card" style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <Upload size={20} color="#818cf8" />
          <h3>Submit Resume for Analysis</h3>
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <p style={{ color: '#94a3b8', fontSize: 13 }}>
            Upload your PDF to Cloudinary/Google Drive and paste the link below.
            Our AI will extract text using Apache Tika and score your resume.
          </p>
          <div className="grid grid-2">
            <div>
              <label className="label">File Name</label>
              <input className="input" placeholder="resume_2025.pdf" value={form.fileName}
                onChange={e => setForm(f => ({ ...f, fileName: e.target.value }))} />
            </div>
            <div>
              <label className="label">Resume URL (PDF link) *</label>
              <input type="url" className="input" placeholder="https://..." value={form.fileUrl}
                onChange={e => setForm(f => ({ ...f, fileUrl: e.target.value }))} required />
            </div>
          </div>
          <button type="submit" className="btn btn-primary" disabled={saving} id="btn-analyze-resume">
            <Star size={16} />
            {saving ? 'Analyzing...' : 'Analyze Resume'}
          </button>
        </form>
      </div>

      {/* Results */}
      {loading ? (
        <div className="skeleton" style={{ height: 300 }} />
      ) : resumes.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 48 }}>
          <Briefcase size={48} color="#6366f1" style={{ margin: '0 auto 16px', opacity: 0.5 }} />
          <h3>No resumes analyzed yet</h3>
          <p style={{ color: '#64748b', marginTop: 8 }}>Submit your first resume above to get started!</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {resumes.map(r => (
            <div key={r.id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <h3 style={{ marginBottom: 4 }}>{r.fileName || 'Resume'}</h3>
                  <span style={{ color: '#64748b', fontSize: 13 }}>
                    {new Date(r.uploadedAt).toLocaleDateString()}
                  </span>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{
                    fontSize: 36, fontWeight: 800,
                    color: scoreColor(r.analysisScore),
                  }}>{r.analysisScore}%</div>
                  <div style={{ fontSize: 12, color: '#64748b' }}>Resume Score</div>
                </div>
              </div>

              {/* Score bar */}
              <div style={{ marginBottom: 20 }}>
                <div className="progress-bar-track">
                  <div className="progress-bar-fill" style={{
                    width: `${r.analysisScore}%`,
                    background: `linear-gradient(90deg, ${scoreColor(r.analysisScore)}, ${scoreColor(r.analysisScore)}aa)`,
                  }} />
                </div>
              </div>

              {/* Keywords */}
              {r.matchedKeywords?.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#94a3b8', marginBottom: 8 }}>
                    ✅ Matched Keywords ({r.matchedKeywords.length})
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {r.matchedKeywords.map(kw => (
                      <span key={kw} style={{
                        background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)',
                        color: '#10b981', fontSize: 12, padding: '2px 8px', borderRadius: 20, fontWeight: 500,
                      }}>{kw}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Suggestions */}
              {r.suggestions?.length > 0 && (
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#94a3b8', marginBottom: 10 }}>
                    💡 Suggestions to Improve
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {r.suggestions.map((s, i) => (
                      <div key={i} style={{
                        display: 'flex', alignItems: 'flex-start', gap: 10,
                        padding: '10px 14px', borderRadius: 10,
                        background: 'rgba(245,158,11,0.06)',
                        border: '1px solid rgba(245,158,11,0.15)',
                      }}>
                        <AlertCircle size={15} color="#f59e0b" style={{ marginTop: 1, flexShrink: 0 }} />
                        <span style={{ fontSize: 14, color: '#f1f5f9' }}>{s}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <a href={r.fileUrl} target="_blank" rel="noopener noreferrer"
                className="btn btn-outline btn-sm" style={{ marginTop: 16, display: 'inline-flex' }}>
                View Resume
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
