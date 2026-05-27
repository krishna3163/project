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
    GOLD: {
      bg: 'rgba(251, 191, 36, 0.08)',
      border: 'rgba(251, 191, 36, 0.25)',
      text: '#fbbf24',
      glow: 'rgba(251, 191, 36, 0.25)',
      iconBg: 'radial-gradient(circle, rgba(251, 191, 36, 0.15) 0%, rgba(251, 191, 36, 0.02) 70%)',
      icon: <Medal size={36} color="#fbbf24" style={{ filter: 'drop-shadow(0 0 8px rgba(251, 191, 36, 0.5))' }} />
    },
    SILVER: {
      bg: 'rgba(226, 232, 240, 0.08)',
      border: 'rgba(226, 232, 240, 0.25)',
      text: '#f1f5f9',
      glow: 'rgba(226, 232, 240, 0.2)',
      iconBg: 'radial-gradient(circle, rgba(226, 232, 240, 0.15) 0%, rgba(226, 232, 240, 0.02) 70%)',
      icon: <Award size={36} color="#cbd5e1" style={{ filter: 'drop-shadow(0 0 8px rgba(226, 232, 240, 0.4))' }} />
    },
    BRONZE: {
      bg: 'rgba(249, 115, 22, 0.08)',
      border: 'rgba(249, 115, 22, 0.25)',
      text: '#ff9244',
      glow: 'rgba(249, 115, 22, 0.25)',
      iconBg: 'radial-gradient(circle, rgba(249, 115, 22, 0.15) 0%, rgba(249, 115, 22, 0.02) 70%)',
      icon: <Star size={36} color="#f97316" style={{ filter: 'drop-shadow(0 0 8px rgba(249, 115, 22, 0.5))' }} />
    },
    PARTICIPANT: {
      bg: 'rgba(99, 102, 241, 0.08)',
      border: 'rgba(99, 102, 241, 0.25)',
      text: '#a5b4fc',
      glow: 'rgba(99, 102, 241, 0.25)',
      iconBg: 'radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, rgba(99, 102, 241, 0.02) 70%)',
      icon: <Compass size={36} color="#a5b4fc" style={{ filter: 'drop-shadow(0 0 8px rgba(99, 102, 241, 0.5))' }} />
    }
  }

  const currentBadge = badgeColor[result.badge as keyof typeof badgeColor] || badgeColor.PARTICIPANT

  return (
    <div style={{ maxWidth: 760, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Premium Glassmorphic Shareable Card */}
      <div
        ref={cardRef}
        style={{
          background: 'linear-gradient(135deg, #090c15 0%, #0d1222 50%, #080a10 100%)',
          border: '1px solid rgba(99, 102, 241, 0.16)',
          borderRadius: 28,
          padding: '40px 36px',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Neon Top Highlight bar */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 4,
          background: 'linear-gradient(90deg, #6366f1, #22d3ee, #ec4899, #6366f1)',
          opacity: 0.85
        }} />

        {/* Futuristic Background Glows */}
        <div style={{
          position: 'absolute', top: '-10%', right: '-10%', width: 280, height: 280,
          background: 'radial-gradient(circle, rgba(99, 102, 241, 0.12) 0%, transparent 70%)',
          pointerEvents: 'none'
        }} />
        <div style={{
          position: 'absolute', bottom: '-10%', left: '-10%', width: 280, height: 280,
          background: 'radial-gradient(circle, rgba(236, 72, 153, 0.08) 0%, transparent 70%)',
          pointerEvents: 'none'
        }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <span style={{
                background: currentBadge.bg,
                border: `1px solid ${currentBadge.border}`,
                color: currentBadge.text,
                padding: '6px 14px',
                borderRadius: 99,
                fontSize: 10,
                fontWeight: 800,
                letterSpacing: '1.5px',
                textTransform: 'uppercase',
                boxShadow: `0 2px 10px ${currentBadge.glow}`,
                display: 'inline-block'
              }}>{result.badge} LEVEL</span>
            </div>
            <h2 style={{
              fontSize: 32,
              fontWeight: 900,
              background: 'linear-gradient(135deg, #ffffff 0%, #e2e8f0 50%, #94a3b8 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              marginBottom: 6,
              letterSpacing: '-0.5px'
            }}>{userName}</h2>
            <p style={{ color: '#64748b', fontSize: 14, fontWeight: 500, letterSpacing: '0.2px' }}>{testTitle}</p>
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 72,
            height: 72,
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.02)',
            border: `1px solid ${currentBadge.border}`,
            boxShadow: `0 8px 24px rgba(0, 0, 0, 0.35), inset 0 2px 8px ${currentBadge.glow}`,
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{
              position: 'absolute', inset: 0,
              background: currentBadge.iconBg,
              zIndex: 1
            }} />
            <div style={{ zIndex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {currentBadge.icon}
            </div>
          </div>
        </div>

        {/* Dynamic Statistics Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 16, margin: '32px 0' }}>
          {[
            { label: 'Score Obtained', value: `${result.score}/${result.totalMarks}`, sub: `${result.percentage.toFixed(1)}% Score`, color: '#60a5fa' },
            { label: 'Global Standing', value: `#${result.rank}`, sub: `Top ${result.percentile.toFixed(2)}%`, color: '#34d399' },
            { label: 'Accuracy Rating', value: `${(result.accuracy * 100).toFixed(0)}%`, sub: `Correct Answers`, color: '#fbbf24' },
            { label: 'Completion Duration', value: `${Math.floor(result.timeTaken / 60)}m ${result.timeTaken % 60}s`, sub: `Total Time Spent`, color: '#f472b6' }
          ].map((stat, i) => (
            <div key={i} style={{
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid rgba(255, 255, 255, 0.05)',
              borderRadius: 20,
              padding: '22px 14px',
              textAlign: 'center',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.02)',
              position: 'relative',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              minHeight: 124
            }}>
              <div style={{ fontSize: 10, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', marginBottom: 8, letterSpacing: '0.5px' }}>{stat.label}</div>
              <div style={{ fontSize: 24, fontWeight: 900, color: stat.color, marginBottom: 4, letterSpacing: '-0.5px' }}>{stat.value}</div>
              <div style={{ fontSize: 12, color: '#94a3b8', fontWeight: 500 }}>{stat.sub}</div>
              {/* Neon color-coded accent line at bottom of each card */}
              <div style={{
                position: 'absolute', bottom: 0, left: '15%', right: '15%', height: 3,
                background: stat.color,
                opacity: 0.7,
                borderRadius: '99px 99px 0 0',
                boxShadow: `0 -1px 8px ${stat.color}`
              }} />
            </div>
          ))}
        </div>

        {/* Branding Footer */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderTop: '1px solid rgba(255, 255, 255, 0.06)',
          paddingTop: 20,
          marginTop: 12
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{
              width: 18, height: 18, borderRadius: 5,
              background: 'linear-gradient(135deg, #6366f1, #22d3ee)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 10, fontWeight: 900, color: '#fff'
            }}>P</div>
            <span style={{ fontSize: 13, color: '#e2e8f0', fontWeight: 800, letterSpacing: '0.5px' }}>PrepNest</span>
          </div>
          <span style={{
            fontSize: 11,
            color: '#818cf8',
            fontWeight: 700,
            letterSpacing: '0.5px',
            background: 'rgba(99, 102, 241, 0.06)',
            border: '1px solid rgba(99, 102, 241, 0.12)',
            padding: '4px 12px',
            borderRadius: 99
          }}>
            dsa-tracker.prepnest.io
          </span>
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
