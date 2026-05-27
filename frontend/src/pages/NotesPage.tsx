import { useEffect, useState } from 'react'
import { api } from '../context/AuthContext'
import toast from 'react-hot-toast'
import { FileText, Trash2, ExternalLink, Plus } from 'lucide-react'

interface Note {
  id: string
  title: string
  subject: string
  fileUrl: string
  originalFileName: string
  fileType: string
  uploadedAt: string
}

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title: '', subject: '', fileUrl: '', originalFileName: '', fileType: 'PDF' })
  const [saving, setSaving] = useState(false)

  const fetchNotes = () => {
    api.get('/api/notes').then(r => setNotes(r.data.content || [])).catch(() => {}).finally(() => setLoading(false))
  }
  useEffect(() => { fetchNotes() }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim() || !form.fileUrl.trim()) { toast.error('Title and file URL required'); return }
    setSaving(true)
    try {
      await api.post('/api/notes', form)
      toast.success('Note saved!')
      setShowForm(false)
      setForm({ title: '', subject: '', fileUrl: '', originalFileName: '', fileType: 'PDF' })
      fetchNotes()
    } catch { toast.error('Failed to save note') }
    finally { setSaving(false) }
  }

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/api/notes/${id}`)
      toast.success('Note deleted')
      setNotes(n => n.filter(x => x.id !== id))
    } catch { toast.error('Failed to delete') }
  }

  return (
    <div className="page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
        <div>
          <h1 style={{ marginBottom: 4 }}>Notes</h1>
          <p style={{ color: '#64748b', fontSize: 13 }}>{notes.length} notes uploaded</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(v => !v)} id="btn-add-note">
          <Plus size={16} /> Add Note
        </button>
      </div>

      {/* Add form */}
      {showForm && (
        <div className="card fade-in" style={{ marginBottom: 24 }}>
          <h3 style={{ marginBottom: 16 }}>Add New Note</h3>
          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="grid grid-2">
              <div>
                <label className="label">Title *</label>
                <input className="input" placeholder="e.g. Arrays & Strings" value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required />
              </div>
              <div>
                <label className="label">Subject</label>
                <input className="input" placeholder="e.g. DSA" value={form.subject}
                  onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} />
              </div>
            </div>
            <div>
              <label className="label">File URL (Cloudinary/Drive link) *</label>
              <input className="input" type="url" placeholder="https://..." value={form.fileUrl}
                onChange={e => setForm(f => ({ ...f, fileUrl: e.target.value }))} required />
            </div>
            <div className="grid grid-2">
              <div>
                <label className="label">File Name</label>
                <input className="input" placeholder="filename.pdf" value={form.originalFileName}
                  onChange={e => setForm(f => ({ ...f, originalFileName: e.target.value }))} />
              </div>
              <div>
                <label className="label">File Type</label>
                <select className="input" value={form.fileType}
                  onChange={e => setForm(f => ({ ...f, fileType: e.target.value }))}>
                  <option>PDF</option>
                  <option>IMAGE</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="submit" className="btn btn-primary" disabled={saving} id="btn-save-note">
                {saving ? 'Saving...' : 'Save Note'}
              </button>
              <button type="button" className="btn btn-outline" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="grid grid-3">
          {Array(6).fill(0).map((_, i) => <div key={i} className="skeleton" style={{ height: 140 }} />)}
        </div>
      ) : notes.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 48 }}>
          <FileText size={48} color="#6366f1" style={{ margin: '0 auto 16px', opacity: 0.5 }} />
          <h3>No notes yet</h3>
          <p style={{ color: '#64748b', marginTop: 8 }}>Upload your first note to get started!</p>
        </div>
      ) : (
        <div className="grid grid-3">
          {notes.map(note => (
            <div key={note.id} className="card stagger">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 10,
                  background: 'rgba(34,211,238,0.15)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <FileText size={20} color="#22d3ee" />
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <a href={note.fileUrl} target="_blank" rel="noopener noreferrer"
                    className="btn-icon" style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ExternalLink size={14} />
                  </a>
                  <button className="btn-icon" style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(239,68,68,0.1)', borderColor: 'rgba(239,68,68,0.2)', color: '#ef4444' }}
                    onClick={() => handleDelete(note.id)} id={`delete-note-${note.id}`}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              <h3 style={{ fontSize: 15, marginTop: 12 }}>{note.title}</h3>
              {note.subject && <span className="tag" style={{ marginTop: 6 }}>{note.subject}</span>}
              <p style={{ color: '#64748b', fontSize: 12, marginTop: 8 }}>
                {new Date(note.uploadedAt).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
