import { useEffect, useState } from 'react'
import { api } from '../context/AuthContext'
import toast from 'react-hot-toast'
import { Star, Flame, Award, Edit2, Trophy, Github, Linkedin, Calendar, Phone, ShieldCheck, RefreshCw, Plus, Trash2, X, BarChart2, Users } from 'lucide-react'
import { generateActivityGridDates } from '../utils/activityGrid'

// PII Masking Helpers
function maskPhone(p: string) {
  if (!p) return 'Not provided'
  const cleaned = p.trim()
  if (cleaned.length <= 4) return '****'
  return '*'.repeat(cleaned.length - 4) + cleaned.slice(-4)
}

function maskDob(d: string) {
  if (!d) return 'Not provided'
  const cleaned = d.trim()
  if (cleaned.length >= 4) {
    return cleaned.slice(0, 4) + '-**-**'
  }
  return '****-**-**'
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [syncing, setSyncing] = useState(false)

  // Form Fields State
  const [name, setName] = useState('')
  const [dob, setDob] = useState('')
  const [phone, setPhone] = useState('')
  const [githubLink, setGithubLink] = useState('')
  const [hackerrankLink, setHackerrankLink] = useState('')
  const [hackerearthLink, setHackerearthLink] = useState('')
  const [linkedinLink, setLinkedinLink] = useState('')
  const [leetcodeUsername, setLeetcodeUsername] = useState('')

  // Contest History & Social Compare States
  const [results, setResults] = useState<any[]>([])
  const [tests, setTests] = useState<any[]>([])
  const [friendsList, setFriendsList] = useState<any[]>([]) // fetches my profile [0] and friends [1..N]
  const [newFriendUsername, setNewFriendUsername] = useState('')
  const [addingFriend, setAddingFriend] = useState(false)
  const [selectedFriend, setSelectedFriend] = useState<any>(null) // selected friend for side-by-side modal comparison

  useEffect(() => {
    fetchProfile()
    fetchContestHistory()
    fetchFriendsCompare()
    api.get('/api/mock-tests', { params: { size: 100 } })
      .then(r => setTests(r.data.content || []))
      .catch(() => {})
  }, [])

  const fetchProfile = () => {
    api.get('/api/users/me').then(r => {
      setProfile(r.data)
      setName(r.data.name || '')
      setDob(r.data.dob || '')
      setPhone(r.data.phone || '')
      setGithubLink(r.data.githubLink || '')
      setHackerrankLink(r.data.hackerrankLink || '')
      setHackerearthLink(r.data.hackerearthLink || '')
      setLinkedinLink(r.data.linkedinLink || '')
      setLeetcodeUsername(r.data.leetcodeUsername || '')
    }).catch(() => {}).finally(() => setLoading(false))
  }

  const fetchContestHistory = () => {
    api.get('/api/mock-tests/my-results')
      .then(r => setResults(r.data || []))
      .catch(() => {})
  }

  const fetchFriendsCompare = () => {
    api.get('/api/users/friends/compare')
      .then(r => setFriendsList(r.data || []))
      .catch(() => {})
  }

  const handleSaveProfile = async () => {
    setSaving(true)
    try {
      const res = await api.put('/api/users/profile', {
        name,
        dob,
        phone,
        githubLink,
        hackerrankLink,
        hackerearthLink,
        linkedinLink,
        leetcodeUsername
      })
      setProfile(res.data)
      setEditing(false)
      toast.success('Profile details updated!')
      fetchFriendsCompare() // refresh comparison list
    } catch {
      toast.error('Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const handleSyncProfile = async () => {
    setSyncing(true)
    try {
      const res = await api.post('/api/users/profile/sync')
      setProfile(res.data)
      toast.success('Activity synchronized from all coding platforms!')
      fetchFriendsCompare()
    } catch {
      toast.error('Failed to sync coding platform activities')
    } finally {
      setSyncing(false)
    }
  }

  const handleAddFriend = async () => {
    if (!newFriendUsername.trim()) return
    setAddingFriend(true)
    try {
      await api.post('/api/users/friends', { leetcodeUsername: newFriendUsername.trim() })
      toast.success('Friend added successfully!')
      setNewFriendUsername('')
      fetchFriendsCompare()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to add friend')
    } finally {
      setAddingFriend(false)
    }
  }

  const handleRemoveFriend = async (friendUsername: string) => {
    try {
      await api.delete(`/api/users/friends/${friendUsername}`)
      toast.success('Friend removed!')
      fetchFriendsCompare()
    } catch {
      toast.error('Failed to remove friend')
    }
  }

  if (loading) return <div className="page"><div className="skeleton" style={{ height: 400 }} /></div>

  const initials = profile?.name?.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2) || 'U'

  // Generate date list for activity grid (last 18 weeks = 126 days)
  const activeDatesSet = new Set<string>(profile?.activeDates || [])
  const totalDays = 126
  const dateBlocks: { dateStr: string; isActive: boolean; label: string }[] = []
  const gridDates = generateActivityGridDates(totalDays)

  for (const current of gridDates) {
    const yyyy = current.getFullYear()
    const mm = String(current.getMonth() + 1).padStart(2, '0')
    const dd = String(current.getDate()).padStart(2, '0')
    const dateStr = `${yyyy}-${mm}-${dd}`
    const isActive = activeDatesSet.has(dateStr)

    dateBlocks.push({
      dateStr,
      isActive,
      label: current.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })
    })
  }

  // Chunk into 18 weeks of 7 days
  const weeks: typeof dateBlocks[] = []
  for (let i = 0; i < dateBlocks.length; i += 7) {
    weeks.push(dateBlocks.slice(i, i + 7))
  }

  // Split friends compare data: me is first item, friends are subsequent
  const meProfile = friendsList[0] || profile
  const friendsProfiles = friendsList.slice(1)

  return (
    <div className="page" style={{ maxWidth: 840, margin: '0 auto', paddingBottom: 60 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ margin: 0 }}>Candidate Profile</h1>
        <button
          className="btn btn-primary"
          onClick={handleSyncProfile}
          disabled={syncing}
          style={{ display: 'flex', alignItems: 'center', gap: 8 }}
          id="btn-sync-all-profiles"
        >
          <RefreshCw size={16} className={syncing ? 'spin' : ''} />
          {syncing ? 'Syncing profiles...' : 'Sync Profiles 🔄'}
        </button>
      </div>

      {/* Main card */}
      <div className="card fade-in-scale" style={{ marginBottom: 24, position: 'relative', overflow: 'hidden' }}>
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 100,
          background: 'linear-gradient(90deg, #6366f1, #22d3ee)', opacity: 0.15
        }} />

        <div style={{ display: 'flex', gap: 24, alignItems: 'center', marginTop: 40, padding: '0 20px', flexWrap: 'wrap' }}>
          <div style={{
            width: 90, height: 90, borderRadius: '50%',
            background: 'linear-gradient(135deg, #6366f1, #22d3ee)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 32, fontWeight: 800, color: '#fff',
            boxShadow: '0 0 40px rgba(99,102,241,0.3)',
            border: '4px solid #0f172a', zIndex: 2
          }}>{initials}</div>

          <div style={{ flex: 1, minWidth: 200, zIndex: 2 }}>
            <h2 style={{ margin: '0 0 4px 0', display: 'flex', alignItems: 'center', gap: 10 }}>
              {profile?.name}
              <span style={{ fontSize: 12, background: 'rgba(99,102,241,0.15)', color: '#a5b4fc', padding: '2px 8px', borderRadius: 12 }}>
                Candidate
              </span>
            </h2>
            <p style={{ color: '#64748b', margin: 0, fontSize: 14 }}>{profile?.email}</p>
          </div>

          <div style={{ display: 'flex', gap: 20, zIndex: 2, flexWrap: 'wrap' }}>
            <div style={{ textAlign: 'center', background: 'rgba(255,255,255,0.03)', padding: '12px 20px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center' }}>
                <Star size={18} color="#f59e0b" />
                <span style={{ fontSize: 20, fontWeight: 800, color: '#f59e0b' }}>{profile?.xpPoints || 0}</span>
              </div>
              <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>XP Points</div>
            </div>
            <div style={{ textAlign: 'center', background: 'rgba(255,255,255,0.03)', padding: '12px 20px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center' }}>
                <Flame size={18} color="#ef4444" />
                <span style={{ fontSize: 20, fontWeight: 800, color: '#ef4444' }}>{profile?.dailyStreak || 0}</span>
              </div>
              <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>Day Streak</div>
            </div>
            <div style={{ textAlign: 'center', background: 'rgba(255,255,255,0.03)', padding: '12px 20px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center' }}>
                <Trophy size={18} color="#10b981" />
                <span style={{ fontSize: 20, fontWeight: 800, color: '#10b981' }}>#{profile?.globalRank || 1}</span>
              </div>
              <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>Global Rank</div>
            </div>
          </div>
        </div>
      </div>

      {/* Contribution Calendar Grid */}
      <div className="card fade-in-scale" style={{ marginBottom: 24, padding: 24, animationDelay: '0.1s' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8, fontSize: 16 }}>
            <Flame size={18} color="#ef4444" />
            Unified Activity Grid
          </h3>
          <span style={{ fontSize: 12, color: '#64748b' }}>Aggregate solved stats & public pushes</span>
        </div>

        <div style={{ overflowX: 'auto', paddingBottom: 6 }}>
          <div style={{ display: 'flex', gap: 4, minWidth: 620, justifyContent: 'space-between' }}>
            {weeks.map((week, wIdx) => (
              <div key={wIdx} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {week.map((day) => (
                  <div
                    key={day.dateStr}
                    title={`${day.label}: ${day.isActive ? 'Active Session logged!' : 'No activity logged'}`}
                    style={{
                      width: 11,
                      height: 11,
                      borderRadius: 2,
                      background: day.isActive
                        ? 'linear-gradient(135deg, #10b981, #059669)'
                        : 'rgba(255,255,255,0.05)',
                      border: day.isActive ? '1px solid rgba(16,185,129,0.3)' : '1px solid rgba(255,255,255,0.02)',
                      transition: 'transform 0.15s ease',
                      cursor: 'pointer',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'scale(1.3)'
                      e.currentTarget.style.zIndex = '10'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'scale(1)'
                      e.currentTarget.style.zIndex = 'auto'
                    }}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, fontSize: 12, color: '#64748b' }}>
          <div>Total active days: <strong style={{ color: '#10b981' }}>{activeDatesSet.size} days</strong></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span>Less</span>
            <div style={{ width: 8, height: 8, borderRadius: 1, background: 'rgba(255,255,255,0.05)' }} />
            <div style={{ width: 8, height: 8, borderRadius: 1, background: '#10b981' }} />
            <span>More</span>
          </div>
        </div>
      </div>

      {editing ? (
        /* Edit Profile Form */
        <div className="card slide-down" style={{ marginBottom: 24 }}>
          <h3 style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Edit2 size={18} color="#6366f1" />
            Edit Profile & Coding Accounts
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ fontSize: 13, color: '#94a3b8', display: 'block', marginBottom: 6 }}>Full Name</label>
              <input
                className="input"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Enter name"
                id="edit-name"
              />
            </div>

            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 200 }}>
                <label style={{ fontSize: 13, color: '#94a3b8', display: 'block', marginBottom: 6 }}>
                  Date of Birth (YYYY-MM-DD)
                </label>
                <input
                  className="input"
                  value={dob}
                  onChange={e => setDob(e.target.value)}
                  placeholder="e.g. 1999-12-31"
                  id="edit-dob"
                />
              </div>

              <div style={{ flex: 1, minWidth: 200 }}>
                <label style={{ fontSize: 13, color: '#94a3b8', display: 'block', marginBottom: 6 }}>Phone Number</label>
                <input
                  className="input"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="e.g. 9876543210"
                  id="edit-phone"
                />
              </div>
            </div>

            <hr style={{ border: 'none', borderBottom: '1px solid rgba(255,255,255,0.05)', margin: '8px 0' }} />

            <div>
              <label style={{ fontSize: 13, color: '#94a3b8', display: 'block', marginBottom: 6 }}>LeetCode Username</label>
              <input
                className="input"
                value={leetcodeUsername}
                onChange={e => setLeetcodeUsername(e.target.value)}
                placeholder="e.g. leetcode_user"
                id="edit-leetcode"
              />
            </div>

            <div>
              <label style={{ fontSize: 13, color: '#94a3b8', display: 'block', marginBottom: 6 }}>GitHub Profile Link</label>
              <input
                className="input"
                value={githubLink}
                onChange={e => setGithubLink(e.target.value)}
                placeholder="e.g. https://github.com/username"
                id="edit-github"
              />
            </div>

            <div>
              <label style={{ fontSize: 13, color: '#94a3b8', display: 'block', marginBottom: 6 }}>HackerRank Profile Link</label>
              <input
                className="input"
                value={hackerrankLink}
                onChange={e => setHackerrankLink(e.target.value)}
                placeholder="e.g. https://hackerrank.com/username"
                id="edit-hackerrank"
              />
            </div>

            <div>
              <label style={{ fontSize: 13, color: '#94a3b8', display: 'block', marginBottom: 6 }}>HackerEarth Profile Link</label>
              <input
                className="input"
                value={hackerearthLink}
                onChange={e => setHackerearthLink(e.target.value)}
                placeholder="e.g. https://hackerearth.com/@username"
                id="edit-hackerearth"
              />
            </div>

            <div>
              <label style={{ fontSize: 13, color: '#94a3b8', display: 'block', marginBottom: 6 }}>LinkedIn Profile Link</label>
              <input
                className="input"
                value={linkedinLink}
                onChange={e => setLinkedinLink(e.target.value)}
                placeholder="e.g. https://linkedin.com/in/username"
                id="edit-linkedin"
              />
            </div>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 10 }}>
              <button
                className="btn btn-secondary"
                onClick={() => setEditing(false)}
                disabled={saving}
                id="btn-cancel-edit"
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleSaveProfile}
                disabled={saving}
                id="btn-save-profile"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Read-Only Profile View */
        <div className="stagger" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          
          {/* Completed Contests / Test History */}
          <div className="card fade-in-scale">
            <h3 style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8, fontSize: 15 }}>
              <Trophy size={18} color="#f59e0b" />
              Completed Contests History
            </h3>
            {results.length === 0 ? (
              <p style={{ color: '#64748b', fontSize: 13, margin: 0, fontStyle: 'italic' }}>
                You have not participated in any contests yet. Go to Mock Arena to take your first test!
              </p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', color: '#64748b' }}>
                      <th style={{ padding: '10px 8px' }}>Contest Name</th>
                      <th style={{ padding: '10px 8px' }}>Score</th>
                      <th style={{ padding: '10px 8px' }}>Global Rank</th>
                      <th style={{ padding: '10px 8px' }}>Accuracy</th>
                      <th style={{ padding: '10px 8px' }}>Badge</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((res, i) => (
                      <tr key={res.id || i} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', color: '#cbd5e1' }}>
                        <td style={{ padding: '12px 8px', fontWeight: 600 }}>{res.testId ? (tests.find((t: any) => t.id === res.testId)?.title || 'Contest MCQ Challenge') : 'Practice Contest'}</td>
                        <td style={{ padding: '12px 8px', color: '#60a5fa' }}>{res.score} / {res.totalMarks}</td>
                        <td style={{ padding: '12px 8px', color: '#34d399' }}>#{res.rank} <span style={{ fontSize: 11, color: '#64748b' }}>of {res.totalUsers}</span></td>
                        <td style={{ padding: '12px 8px' }}>{(res.accuracy * 100).toFixed(0)}%</td>
                        <td style={{ padding: '12px 8px', fontWeight: 700, color: res.badge === 'GOLD' ? '#f59e0b' : res.badge === 'SILVER' ? '#94a3b8' : res.badge === 'BRONZE' ? '#b45309' : '#818cf8' }}>
                          🏆 {res.badge || 'PARTICIPANT'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Friends Comparison & LeetCode Compare Dashboard */}
          <div className="card fade-in-scale">
            <h3 style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8, fontSize: 15 }}>
              <Users size={18} color="#818cf8" />
              Compare Friends Dashboard (Max 5)
            </h3>
            
            <p style={{ color: '#94a3b8', fontSize: 13, marginBottom: 16 }}>
              Compare coding solved metrics, streaking points, and mock test average ranks side-by-side with up to 5 LeetCode buddies.
            </p>

            {/* Add Friend Input Form */}
            {friendsProfiles.length < 5 && (
              <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
                <input
                  className="input"
                  placeholder="Enter friend's LeetCode username..."
                  value={newFriendUsername}
                  onChange={e => setNewFriendUsername(e.target.value)}
                  style={{ flex: 1 }}
                  id="friend-username-input"
                />
                <button
                  className="btn btn-primary"
                  onClick={handleAddFriend}
                  disabled={addingFriend || !newFriendUsername.trim()}
                  id="btn-add-friend"
                  style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  <Plus size={16} /> Add Friend
                </button>
              </div>
            )}

            {/* Friends list with comparison actions */}
            {friendsProfiles.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '16px 0', color: '#475569', fontSize: 13 }}>
                No friends added yet. Enter their LeetCode username above to start comparing ranks!
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {friendsProfiles.map((friend: any) => (
                  <div
                    key={friend.leetcodeUsername}
                    style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)',
                      borderRadius: 12, padding: '12px 16px'
                    }}
                  >
                    <div>
                      <span style={{ fontWeight: 700, fontSize: 14, color: '#f1f5f9' }}>@{friend.leetcodeUsername}</span>
                      <div style={{ display: 'flex', gap: 10, fontSize: 11, color: '#64748b', marginTop: 2 }}>
                        <span>📊 Easy: {friend.leetcodeEasySolved}</span>
                        <span>Medium: {friend.leetcodeMediumSolved}</span>
                        <span>Hard: {friend.leetcodeHardSolved}</span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => setSelectedFriend(friend)}
                        style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, padding: '6px 12px' }}
                        id={`btn-compare-${friend.leetcodeUsername}`}
                      >
                        <BarChart2 size={13} /> Compare 📊
                      </button>
                      <button
                        className="btn-icon"
                        onClick={() => handleRemoveFriend(friend.leetcodeUsername)}
                        style={{ width: 32, height: 32, color: '#ef4444', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)' }}
                        id={`btn-remove-${friend.leetcodeUsername}`}
                        title="Remove Friend"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* LeetCode Integration */}
          {profile?.leetcodeUsername && (
            <div className="card fade-in-scale">
              <h3 style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8, fontSize: 15 }}>
                <Star size={18} color="#ffa116" />
                LeetCode Stats Sync
              </h3>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,161,22,0.05)', border: '1px solid rgba(255,161,22,0.15)', borderRadius: 12, padding: '16px 20px', marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 12, color: '#64748b', marginBottom: 2 }}>LeetCode Link</div>
                  <a href={`https://leetcode.com/${profile.leetcodeUsername}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: 15, fontWeight: 700, color: '#ffa116', textDecoration: 'none' }}>
                    @{profile.leetcodeUsername} 🔗
                  </a>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 12, color: '#64748b', marginBottom: 2 }}>Global Ranking</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: '#f1f5f9' }}>
                    #{profile.leetcodeRanking ? profile.leetcodeRanking.toLocaleString() : 'N/A'}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12 }}>
                {[
                  { label: 'Easy', count: profile.leetcodeEasySolved, color: '#10b981', bg: 'rgba(16,185,129,0.06)' },
                  { label: 'Medium', count: profile.leetcodeMediumSolved, color: '#fbbf24', bg: 'rgba(251,191,36,0.06)' },
                  { label: 'Hard', count: profile.leetcodeHardSolved, color: '#ef4444', bg: 'rgba(239,68,68,0.06)' },
                ].map(d => (
                  <div key={d.label} style={{ flex: 1, background: d.bg, border: `1px solid ${d.color}15`, borderRadius: 10, padding: '12px', textAlign: 'center' }}>
                    <div style={{ fontSize: 16, fontWeight: 800, color: d.color, marginBottom: 2 }}>{d.count || 0}</div>
                    <div style={{ fontSize: 11, color: '#64748b', fontWeight: 500 }}>{d.label}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Social & Professional Connections */}
          <div className="card fade-in-scale">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 15 }}>Connected Accounts</h3>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setEditing(true)}
                id="btn-edit-links"
              >
                Configure Accounts 🔗
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { label: 'GitHub Link', value: profile?.githubLink, icon: <Github size={16} color="#cbd5e1" /> },
                { label: 'LinkedIn Link', value: profile?.linkedinLink, icon: <Linkedin size={16} color="#cbd5e1" /> },
                { label: 'HackerRank Profile', value: profile?.hackerrankLink, icon: <Trophy size={16} color="#cbd5e1" /> },
                { label: 'HackerEarth Profile', value: profile?.hackerearthLink, icon: <Trophy size={16} color="#cbd5e1" /> },
              ].map(({ label, value, icon }) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.03)', alignItems: 'center' }}>
                  <span style={{ color: '#94a3b8', fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                    {icon} {label}
                  </span>
                  {value ? (
                    <a
                      href={value.startsWith('http') ? value : `https://${value}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: '#6366f1', fontSize: 14, fontWeight: 500, textDecoration: 'none' }}
                    >
                      View Profile 🔗
                    </a>
                  ) : (
                    <span style={{ color: '#475569', fontSize: 13, fontStyle: 'italic' }}>Not linked</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Personal Information (PII Masking Active) */}
          <div className="card fade-in-scale">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8, fontSize: 15 }}>
                <ShieldCheck size={18} color="#10b981" />
                Personal Details
              </h3>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setEditing(true)}
                id="btn-edit-details"
              >
                Modify details 🔒
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { label: 'Phone Number', value: maskPhone(profile?.phone), icon: <Phone size={15} color="#64748b" /> },
                { label: 'Date of Birth', value: maskDob(profile?.dob), icon: <Calendar size={15} color="#64748b" /> },
              ].map(({ label, value, icon }) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                  <span style={{ color: '#94a3b8', fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                    {icon} {label}
                  </span>
                  <span style={{ color: '#cbd5e1', fontSize: 13, fontFamily: 'monospace' }}>{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Badges Achievements */}
          <div className="card fade-in-scale">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <Award size={18} color="#f59e0b" />
              <h3 style={{ margin: 0, fontSize: 15 }}>Unlocked Achievements</h3>
            </div>
            {profile?.badges?.length > 0 ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                {profile.badges.map((b: string) => (
                  <div key={b} style={{
                    padding: '6px 12px', borderRadius: 16,
                    background: 'rgba(245,158,11,0.1)',
                    border: '1px solid rgba(245,158,11,0.2)',
                    color: '#f59e0b', fontWeight: 600, fontSize: 12,
                    display: 'flex', alignItems: 'center', gap: 4,
                  }}>
                    🏆 {b.replace(/_/g, ' ')}
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '16px 0', color: '#475569' }}>
                <p style={{ margin: 0, fontSize: 13 }}>No achievements unlocked yet. Solve coding problems to earn badges!</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Friend Side-by-Side Comparison Modal */}
      {selectedFriend && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(8, 12, 20, 0.85)', backdropFilter: 'blur(12px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 100, padding: 20
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
            border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: 24,
            width: '100%', maxWidth: 640, padding: 32,
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)', position: 'relative'
          }}>
            <button
              onClick={() => setSelectedFriend(null)}
              style={{
                position: 'absolute', top: 20, right: 20,
                background: 'rgba(255, 255, 255, 0.05)', border: 'none', borderRadius: '50%',
                width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', color: '#94a3b8'
              }}
              id="btn-close-compare-modal"
            >
              <X size={16} />
            </button>

            <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8, color: '#818cf8' }}>
              <BarChart2 size={22} />
              LeetCode Side-by-Side Rank Comparison
            </h2>
            <p style={{ color: '#64748b', fontSize: 13, marginBottom: 24 }}>Candidate comparison with friend @{selectedFriend.leetcodeUsername}</p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
              {/* Me Column */}
              <div style={{ background: 'rgba(99,102,241,0.04)', border: '1px solid rgba(99,102,241,0.15)', borderRadius: 16, padding: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 13 }}>
                    ME
                  </div>
                  <div>
                    <h4 style={{ margin: 0, fontSize: 14, color: '#f1f5f9' }}>{meProfile?.name || 'You'}</h4>
                    <span style={{ fontSize: 11, color: '#64748b' }}>@{meProfile?.leetcodeUsername || 'Not connected'}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: 6 }}>
                    <span style={{ color: '#64748b' }}>Platform Rank</span>
                    <strong style={{ color: '#10b981' }}>#{meProfile?.globalRank || 1}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: 6 }}>
                    <span style={{ color: '#64748b' }}>Streak</span>
                    <strong style={{ color: '#ef4444' }}>🔥 {meProfile?.dailyStreak || 0}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: 6 }}>
                    <span style={{ color: '#64748b' }}>LeetCode Rank</span>
                    <strong style={{ color: '#ffa116' }}>#{meProfile?.leetcodeRanking ? meProfile.leetcodeRanking.toLocaleString() : 'N/A'}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: 6 }}>
                    <span style={{ color: '#64748b' }}>Easy Solved</span>
                    <strong style={{ color: '#10b981' }}>{meProfile?.leetcodeEasySolved || 0}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: 6 }}>
                    <span style={{ color: '#64748b' }}>Medium Solved</span>
                    <strong style={{ color: '#fbbf24' }}>{meProfile?.leetcodeMediumSolved || 0}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>Hard Solved</span>
                    <strong style={{ color: '#ef4444' }}>{meProfile?.leetcodeHardSolved || 0}</strong>
                  </div>
                </div>
              </div>

              {/* Friend Column */}
              <div style={{ background: 'rgba(245,158,11,0.04)', border: '1px solid rgba(245,158,11,0.15)', borderRadius: 16, padding: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#ffa116', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 13 }}>
                    FR
                  </div>
                  <div>
                    <h4 style={{ margin: 0, fontSize: 14, color: '#f1f5f9' }}>{selectedFriend?.name || 'Friend'}</h4>
                    <span style={{ fontSize: 11, color: '#64748b' }}>@{selectedFriend?.leetcodeUsername}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: 6 }}>
                    <span style={{ color: '#64748b' }}>Platform Rank</span>
                    <strong style={{ color: '#10b981' }}>#{selectedFriend?.globalRank || 'Guest'}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: 6 }}>
                    <span style={{ color: '#64748b' }}>Streak</span>
                    <strong style={{ color: '#ef4444' }}>🔥 {selectedFriend?.dailyStreak || 0}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: 6 }}>
                    <span style={{ color: '#64748b' }}>LeetCode Rank</span>
                    <strong style={{ color: '#ffa116' }}>#{selectedFriend?.leetcodeRanking ? selectedFriend.leetcodeRanking.toLocaleString() : 'N/A'}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: 6 }}>
                    <span style={{ color: '#64748b' }}>Easy Solved</span>
                    <strong style={{ color: '#10b981' }}>{selectedFriend?.leetcodeEasySolved || 0}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: 6 }}>
                    <span style={{ color: '#64748b' }}>Medium Solved</span>
                    <strong style={{ color: '#fbbf24' }}>{selectedFriend?.leetcodeMediumSolved || 0}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>Hard Solved</span>
                    <strong style={{ color: '#ef4444' }}>{selectedFriend?.leetcodeHardSolved || 0}</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Close Button */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
              <button
                className="btn btn-secondary"
                onClick={() => setSelectedFriend(null)}
                id="btn-close-compare"
              >
                Close Comparison
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
