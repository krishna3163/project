import { useRef } from 'react'
import html2canvas from 'html2canvas'
import { Download, Linkedin, Twitter, Medal, Award, Star, Compass } from 'lucide-react'
import toast from 'react-hot-toast'

interface TopicScore {
  correct: number
  total: number
  score: number
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
  topicBreakdown: Record<string, TopicScore>
}

interface ResultCardProps {
  result: MockResult
  testTitle: string
  userName: string
}

export default function ResultCard({ result, testTitle, userName }: Readonly<ResultCardProps>) {
  const cardRef = useRef<HTMLDivElement>(null)

  const downloadCard = async () => {
    if (!cardRef.current) return
    try {
      const canvas = await html2canvas(cardRef.current, {
        scale: 2,
        backgroundColor: '#0f172a',
        logging: false,
        useCORS: true
      })
      const link = document.createElement('a')
      link.download = `PrepNest-RankCard-${result.shareId || 'share'}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
      toast.success('Rank card downloaded successfully! 🚀')
    } catch (err) {
      toast.error('Failed to generate rank card image')
    }
  }

  const shareOnLinkedIn = () => {
    const url = encodeURIComponent(`${window.location.origin}/share/${result.shareId}`)
    const text = encodeURIComponent(`I ranked #${result.rank} with a score of ${result.score}/${result.totalMarks} on the PrepNest mock test "${testTitle}"! 🎯 Let's level up together!`)
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}&summary=${text}`, '_blank')
  }

  const shareOnTwitter = () => {
    const text = encodeURIComponent(`I ranked #${result.rank} with a score of ${result.score}/${result.totalMarks} on PrepNest's "${testTitle}"! 🎯 #${result.badge} Badge earned! @PrepNest #DSA`)
    const url = encodeURIComponent(`${window.location.origin}/share/${result.shareId}`)
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank')
  }

  const badgeColor = {
    GOLD: { bg: 'rgba(245,158,11,0.15)', border: 'rgba(245,158,11,0.3)', text: '#fbbf24', icon: <Medal size={48} color="#fbbf24" /> },
    SILVER: { bg: 'rgba(148,163,184,0.15)', border: 'rgba(148,163,184,0.3)', text: '#cbd5e1', icon: <Award size={48} color="#cbd5e1" /> },
    BRONZE: { bg: 'rgba(180,83,9,0.15)', border: 'rgba(180,83,9,0.3)', text: '#f97316', icon: <Star size={48} color="#f97316" /> },
    PARTICIPANT: { bg: 'rgba(99,102,241,0.15)', border: 'rgba(99,102,241,0.3)', text: '#818cf8', icon: <Compass size={48} color="#818cf8" /> }
  }

  const currentBadge = badgeColor[result.badge as keyof typeof badgeColor] || badgeColor.PARTICIPANT

  return (
    <div style={{ maxWidth: 760, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Premium Glassmorphic Shareable Card */}
      <div
        ref={cardRef}
        style={{
          background: 'linear-gradient(135deg, #1e1b4b, #0f172a)',
          border: '1px solid rgba(99, 102, 241, 0.2)',
          borderRadius: 24,
          padding: '36px 32px',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Futuristic Background Glows */}
        <div style={{
          position: 'absolute', top: '-20%', right: '-10%', width: 300, height: 300,
          background: 'radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, transparent 70%)',
          pointerEvents: 'none'
        }} />
        <div style={{
          position: 'absolute', bottom: '-20%', left: '-10%', width: 300, height: 300,
          background: 'radial-gradient(circle, rgba(236, 72, 153, 0.1) 0%, transparent 70%)',
          pointerEvents: 'none'
        }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <span style={{
                background: currentBadge.bg,
                border: `1px solid ${currentBadge.border}`,
                color: currentBadge.text,
                padding: '4px 12px',
                borderRadius: 99,
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: '1px'
              }}>{result.badge} LEVEL</span>
            </div>
            <h2 style={{ fontSize: 26, fontWeight: 800, color: '#f8fafc', marginBottom: 4 }}>{userName}</h2>
            <p style={{ color: '#94a3b8', fontSize: 14 }}>{testTitle}</p>
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 80,
            height: 80,
            borderRadius: 20,
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            boxShadow: '0 8px 16px rgba(0, 0, 0, 0.2)'
          }}>
            {currentBadge.icon}
          </div>
        </div>

        {/* Dynamic Statistics Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 16, margin: '28px 0' }}>
          {[
            { label: 'Score Obtained', value: `${result.score}/${result.totalMarks}`, sub: `${result.percentage.toFixed(1)}% Score`, color: '#60a5fa' },
            { label: 'Global Standing', value: `#${result.rank}`, sub: `Top ${result.percentile.toFixed(2)}%`, color: '#34d399' },
            { label: 'Accuracy Rating', value: `${(result.accuracy * 100).toFixed(0)}%`, sub: `Correct Answers`, color: '#fbbf24' },
            { label: 'Completion Duration', value: `${Math.floor(result.timeTaken / 60)}m ${result.timeTaken % 60}s`, sub: `Total Time Spent`, color: '#f472b6' }
          ].map((stat, i) => (
            <div key={i} style={{
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid rgba(255, 255, 255, 0.04)',
              borderRadius: 16,
              padding: '16px 12px',
              textAlign: 'center',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
            }}>
              <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', marginBottom: 6 }}>{stat.label}</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: stat.color, marginBottom: 2 }}>{stat.value}</div>
              <div style={{ fontSize: 12, color: '#94a3b8' }}>{stat.sub}</div>
            </div>
          ))}
        </div>

        {/* Branding Footer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 16 }}>
          <span style={{ fontSize: 13, color: '#64748b', fontWeight: 700 }}>PrepNest</span>
          <span style={{ fontSize: 11, color: '#475569' }}>dsa-tracker.prepnest.io</span>
        </div>
      </div>

      {/* Social Sharing & Controls Grid */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <button
          onClick={downloadCard}
          className="btn btn-primary"
          style={{ flex: 1, minWidth: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px 24px', borderRadius: 12, fontWeight: 600 }}
        >
          <Download size={16} /> Save Rank Card
        </button>
        <button
          onClick={shareOnLinkedIn}
          className="btn btn-outline"
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 20px', borderRadius: 12, fontWeight: 600 }}
        >
          <Linkedin size={16} color="#0077b5" /> Share on LinkedIn
        </button>
        <button
          onClick={shareOnTwitter}
          className="btn btn-outline"
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 20px', borderRadius: 12, fontWeight: 600 }}
        >
          <Twitter size={16} color="#1da1f2" /> Share on Twitter
        </button>
      </div>

      {/* Topic-Wise Breakdown Analysis */}
      <div className="card" style={{ padding: 24, borderRadius: 20, background: 'rgba(30, 41, 59, 0.4)', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
        <h3 style={{ fontSize: 18, fontWeight: 800, color: '#f1f5f9', marginBottom: 16 }}>Topic-Wise Performance Analytics</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {Object.entries(result.topicBreakdown || {}).map(([topic, stat]) => (
            <div key={topic}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
                <span style={{ color: '#94a3b8', fontWeight: 600 }}>{topic}</span>
                <span style={{ color: '#f1f5f9', fontWeight: 700 }}>{stat.correct}/{stat.total} pts ({stat.score.toFixed(0)}%)</span>
              </div>
              <div style={{ height: 8, background: 'rgba(255, 255, 255, 0.05)', borderRadius: 99, overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${stat.score}%`,
                  borderRadius: 99,
                  background: stat.score >= 80 ? 'linear-gradient(90deg, #10b981, #34d399)' :
                              stat.score >= 60 ? 'linear-gradient(90deg, #f59e0b, #fbbf24)' :
                              'linear-gradient(90deg, #ef4444, #f87171)',
                  transition: 'width 1s ease-in-out'
                }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
