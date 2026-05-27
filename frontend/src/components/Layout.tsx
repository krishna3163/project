import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth, api } from '../context/AuthContext'
import { useEffect, useState } from 'react'
import {
  LayoutDashboard, Code2, FileText, Briefcase,
  Trophy, Map, BarChart3, User, Bell, LogOut, Menu, Zap
} from 'lucide-react'

const navItems = [
  { to: '/dashboard',  icon: LayoutDashboard, label: 'Dashboard'  },
  { to: '/dsa',        icon: Code2,            label: 'DSA Tracker' },
  { to: '/mock-tests', icon: Trophy,           label: 'Mock Tests'  },
  { to: '/notes',      icon: FileText,         label: 'Notes'       },
  { to: '/resume',     icon: Briefcase,        label: 'Resume'      },
  { to: '/contests',   icon: Zap,              label: 'Contests'    },
  { to: '/roadmaps',   icon: Map,              label: 'Roadmaps'    },
  { to: '/progress',   icon: BarChart3,        label: 'Analytics'   },
  { to: '/profile',    icon: User,             label: 'Profile'     },
]

export default function Layout() {
  const { user, logout } = useAuth()
  const [unread, setUnread] = useState(0)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    api.get('/api/notifications/unread-count')
      .then(r => setUnread(r.data.count))
      .catch(() => {})
    const id = setInterval(() => {
      api.get('/api/notifications/unread-count')
        .then(r => setUnread(r.data.count))
        .catch(() => {})
    }, 30000)
    return () => clearInterval(id)
  }, [])

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Overlay (mobile) */}
      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close sidebar"
          onClick={() => setSidebarOpen(false)}
          onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') setSidebarOpen(false) }}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
            zIndex: 40, backdropFilter: 'blur(4px)', border: 'none', padding: 0,
            cursor: 'pointer', width: '100%', height: '100%', display: 'block', color: 'transparent'
          }}
        />
      )}

      {/* ── Sidebar ─────────────────────────────────────── */}
      <aside style={{
        width: 240,
        background: 'rgba(8,12,20,0.95)',
        backdropFilter: 'blur(20px)',
        borderRight: '1px solid rgba(99,102,241,0.15)',
        display: 'flex',
        flexDirection: 'column',
        padding: '24px 0',
        position: 'fixed',
        top: 0, left: 0, bottom: 0,
        zIndex: 50,
        transform: sidebarOpen ? 'translateX(0)' : undefined,
        transition: 'transform 0.3s ease',
      }}
        className="sidebar"
      >
        {/* Logo */}
        <div style={{ padding: '0 24px 24px', borderBottom: '1px solid rgba(99,102,241,0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'linear-gradient(135deg, #6366f1, #22d3ee)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 18, fontWeight: 800, color: '#fff'
            }}>D</div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 16, color: '#f1f5f9' }}>DSA Tracker</div>
              <div style={{ fontSize: 11, color: '#64748b' }}>Placement Ready</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '16px 12px', overflowY: 'auto' }}>
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to} to={to}
              onClick={() => setSidebarOpen(false)}
              style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 14px', borderRadius: 10, marginBottom: 4,
                color: isActive ? '#f1f5f9' : '#64748b',
                background: isActive ? 'rgba(99,102,241,0.2)' : 'transparent',
                borderLeft: isActive ? '3px solid #6366f1' : '3px solid transparent',
                textDecoration: 'none', fontSize: 14, fontWeight: 500,
                transition: 'all 0.15s ease',
              })}
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* User */}
        <div style={{ padding: '16px 16px 0', borderTop: '1px solid rgba(99,102,241,0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              background: 'linear-gradient(135deg, #6366f1, #7c3aed)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontWeight: 700, fontSize: 14,
            }}>
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#f1f5f9', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name}</div>
              <div style={{ fontSize: 11, color: '#64748b' }}>Student</div>
            </div>
          </div>
          <button
            onClick={logout}
            className="btn btn-outline"
            style={{ width: '100%', justifyContent: 'center', fontSize: 13 }}
          >
            <LogOut size={14} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* ── Main area ───────────────────────────────────── */}
      <div style={{ flex: 1, marginLeft: 240, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}
        className="main-area">
        {/* Top bar */}
        <header style={{
          height: 60, background: 'rgba(8,12,20,0.9)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(99,102,241,0.1)',
          display: 'flex', alignItems: 'center',
          padding: '0 24px', gap: 16,
          position: 'sticky', top: 0, zIndex: 30,
        }}>
          <button
            className="btn-icon"
            onClick={() => setSidebarOpen(v => !v)}
            style={{ display: 'none' }}
            id="sidebar-toggle"
          >
            <Menu size={18} />
          </button>
          <div style={{ flex: 1 }} />
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => navigate('/notifications')}
            style={{ position: 'relative' }}
            id="btn-notifications"
          >
            <Bell size={16} />
            {unread > 0 && (
              <span style={{
                position: 'absolute', top: -4, right: -4,
                background: '#6366f1', color: '#fff',
                fontSize: 10, fontWeight: 700,
                width: 18, height: 18, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>{unread > 9 ? '9+' : unread}</span>
            )}
          </button>
        </header>

        {/* Page content */}
        <main style={{ flex: 1 }}>
          <Outlet />
        </main>
      </div>

      {/* Responsive: hide sidebar on mobile */}
      <style>{`
        @media (max-width: 768px) {
          .sidebar {
            transform: ${sidebarOpen ? 'translateX(0)' : 'translateX(-100%)'} !important;
          }
          .main-area { margin-left: 0 !important; }
          #sidebar-toggle { display: flex !important; }
        }
      `}</style>
    </div>
  )
}
