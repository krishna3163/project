import { useState } from 'react'
import { Star, X, Send } from 'lucide-react'

interface PeerReviewModalProps {
  onClose: () => void
  onSubmit: (rating: number, feedback: string) => void
  submitting: boolean
}

export default function PeerReviewModal({ onClose, onSubmit, submitting }: PeerReviewModalProps) {
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [feedback, setFeedback] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (rating === 0) return
    onSubmit(rating, feedback)
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 24
    }}>
      <div style={{
        background: '#0f172a', width: '100%', maxWidth: 500, borderRadius: 16,
        border: '1px solid rgba(99,102,241,0.2)', boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
        overflow: 'hidden', animation: 'scaleUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
      }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: 18, color: '#f1f5f9' }}>Interview Completed! 🎉</h2>
          <button onClick={onClose} className="btn-icon" style={{ color: '#94a3b8' }}>
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} style={{ padding: 24 }}>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <p style={{ color: '#94a3b8', margin: '0 0 16px 0' }}>How would you rate your peer's communication and problem-solving skills?</p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  type="button"
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRating(star)}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer', padding: 4,
                    transform: (hoverRating || rating) >= star ? 'scale(1.1)' : 'scale(1)',
                    transition: 'transform 0.1s'
                  }}
                >
                  <Star
                    size={32}
                    color={(hoverRating || rating) >= star ? '#f59e0b' : '#334155'}
                    fill={(hoverRating || rating) >= star ? '#f59e0b' : 'none'}
                  />
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', marginBottom: 8, color: '#cbd5e1', fontSize: 14 }}>
              Constructive Feedback (Anonymous)
            </label>
            <textarea
              className="input"
              style={{ width: '100%', minHeight: 100, resize: 'vertical' }}
              placeholder="What did they do well? What could they improve?"
              value={feedback}
              onChange={e => setFeedback(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
            <button type="button" className="btn btn-outline" onClick={onClose}>
              Skip
            </button>
            <button type="submit" className="btn btn-primary" disabled={rating === 0 || submitting || !feedback.trim()}>
              {submitting ? 'Submitting...' : <><Send size={16} /> Submit Review</>}
            </button>
          </div>
        </form>
      </div>
      <style>{`
        @keyframes scaleUp {
          from { opacity: 0; transform: scale(0.95) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  )
}
