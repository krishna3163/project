import { useEffect, useState } from 'react'
import { api } from '../context/AuthContext'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, AreaChart, Area
} from 'recharts'
import { BarChart3, Code2, Trophy, FileText, Briefcase } from 'lucide-react'

interface Progress {
  date: string
  dsaSolved: number
  mockScoreAvg: number
  notesCount: number
  resumeScore: number
}

interface Snapshot {
  dsaSolved: number
  notesCount: number
  mockScoreAvg: number
  resumeScore: number
}

const CHART_COLORS = {
  dsa: '#6366f1', mock: '#f59e0b', notes: '#22d3ee', resume: '#10b981'
}

export default function ProgressPage() {
  const [progressData, setProgressData] = useState<Progress[]>([])
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/api/progress/last-30-days'),
      api.get('/api/progress/snapshot'),
    ]).then(([p, s]) => {
      setProgressData(p.data)
      setSnapshot(s.data)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const radarData = snapshot ? [
    { metric: 'DSA', value: Math.min(100, (snapshot.dsaSolved / 200) * 100) },
    { metric: 'Mock Tests', value: snapshot.mockScoreAvg },
    { metric: 'Notes', value: Math.min(100, snapshot.notesCount * 10) },
    { metric: 'Resume', value: snapshot.resumeScore },
    { metric: 'Contests', value: 50 }, // placeholder
    { metric: 'Consistency', value: Math.min(100, progressData.length * 3.33) },
  ] : []

  const chartData = progressData.map(p => ({
    date: new Date(p.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
    DSA: p.dsaSolved,
    'Mock Score': p.mockScoreAvg,
    Notes: p.notesCount,
  }))

  if (loading) return (
    <div className="page">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {Array(3).fill(0).map((_, i) => <div key={i} className="skeleton" style={{ height: 300 }} />)}
      </div>
    </div>
  )

  return (
    <div className="page">
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ marginBottom: 4 }}>Progress Analytics</h1>
        <p style={{ color: '#64748b', fontSize: 13 }}>30-day view of your learning journey</p>
      </div>

      {/* Snapshot cards */}
      {snapshot && (
        <div className="grid grid-4" style={{ marginBottom: 28 }}>
          {[
            { label: 'DSA Solved', value: snapshot.dsaSolved, icon: Code2, color: CHART_COLORS.dsa },
            { label: 'Avg Mock Score', value: `${snapshot.mockScoreAvg.toFixed(0)}%`, icon: Trophy, color: CHART_COLORS.mock },
            { label: 'Notes Uploaded', value: snapshot.notesCount, icon: FileText, color: CHART_COLORS.notes },
            { label: 'Resume Score', value: `${snapshot.resumeScore}%`, icon: Briefcase, color: CHART_COLORS.resume },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="stat-card">
              <div style={{
                width: 40, height: 40, borderRadius: 10,
                background: `${color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <Icon size={20} color={color} />
              </div>
              <div className="stat-value">{value}</div>
              <div className="stat-label">{label}</div>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-2" style={{ marginBottom: 28 }}>
        {/* DSA Problems Trend */}
        <div className="card">
          <h3 style={{ marginBottom: 20 }}>📈 DSA Problems Solved</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="dsaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,102,241,0.1)" />
              <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11 }} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{ background: '#0f172a', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 8, color: '#f1f5f9' }}
              />
              <Area type="monotone" dataKey="DSA" stroke="#6366f1" strokeWidth={2} fill="url(#dsaGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Skills Radar */}
        <div className="card">
          <h3 style={{ marginBottom: 20 }}>🕸 Skills Overview</h3>
          <ResponsiveContainer width="100%" height={220}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="rgba(99,102,241,0.15)" />
              <PolarAngleAxis dataKey="metric" tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <PolarRadiusAxis domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 9 }} />
              <Radar name="You" dataKey="value" stroke="#6366f1" fill="#6366f1" fillOpacity={0.2} />
              <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 8, color: '#f1f5f9' }} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Multi-metric line chart */}
      <div className="card">
        <h3 style={{ marginBottom: 20 }}>📊 30-Day Multi-Metric Trend</h3>
        {chartData.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#64748b' }}>
            <BarChart3 size={40} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
            <p>No data yet. Start solving problems and taking tests!</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,102,241,0.1)" />
              <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11 }} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 8, color: '#f1f5f9' }} />
              <Line type="monotone" dataKey="DSA" stroke="#6366f1" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="Mock Score" stroke="#f59e0b" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="Notes" stroke="#22d3ee" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        )}
        {/* Legend */}
        <div style={{ display: 'flex', gap: 20, marginTop: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
          {[['DSA Solved', '#6366f1'], ['Mock Score', '#f59e0b'], ['Notes', '#22d3ee']].map(([label, color]) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#94a3b8' }}>
              <div style={{ width: 24, height: 3, background: color, borderRadius: 2 }} />
              {label}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
