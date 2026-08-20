import { useState, useEffect, useCallback } from 'react'
import { Navigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { useI18n } from '../i18n/I18nContext.jsx'
import Icon from '../components/Icon.jsx'
import AdminDashboard from '../components/admin/AdminDashboard.jsx'
import AgentManagement from '../components/admin/AgentManagement.jsx'
import ChatDashboard from '../components/admin/ChatDashboard.jsx'
import TrackingManager from '../components/admin/TrackingManager.jsx'
import UserList from '../components/admin/UserList.jsx'
import './AdminPanel.css'

const SECTIONS = [
  { id: 'dashboard', icon: '📊', label: 'admin.dashboard' },
  { id: 'agents', icon: '👥', label: 'admin.agents' },
  { id: 'chats', icon: '💬', label: 'admin.chats' },
  { id: 'tracking', icon: '📦', label: 'admin.tracking' },
  { id: 'users', icon: '👤', label: 'admin.users' },
]

export default function AdminPanel() {
  const { user, isAdmin, authFetch, loading } = useAuth()
  const { t } = useI18n()
  const [section, setSection] = useState('dashboard')
  const [stats, setStats] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const fetchStats = useCallback(async () => {
    try {
      const res = await authFetch('/api/admin/stats')
      if (res.ok) {
        const data = await res.json()
        setStats(data)
      }
    } catch { /* ignore */ }
  }, [authFetch])

  useEffect(() => {
    if (isAdmin) fetchStats()
  }, [isAdmin, fetchStats])

  if (loading) {
    return <div className="admin-loading">Loading...</div>
  }

  if (!user || !isAdmin) {
    return <Navigate to="/login" replace />
  }

  return (
    <div className="admin-shell">
      {/* Sidebar */}
      <aside className={`admin-sidebar ${sidebarOpen ? 'admin-sidebar-open' : ''}`}>
        <div className="admin-sidebar-header">
          <Link to="/" className="admin-logo">
            <span className="admin-logo-icon"><Icon name="globe" size={20} /></span>
            <span className="admin-logo-text">GlobalTrack</span>
          </Link>
          <span className="admin-badge">ADMIN</span>
        </div>

        <nav className="admin-nav">
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              className={`admin-nav-item ${section === s.id ? 'active' : ''}`}
              onClick={() => { setSection(s.id); setSidebarOpen(false) }}
            >
              <span className="admin-nav-icon">{s.icon}</span>
              <span className="admin-nav-label">{t(s.label)}</span>
            </button>
          ))}
        </nav>

        <div className="admin-sidebar-footer">
          <Link to="/" className="admin-back-link">← {t('admin.backToSite')}</Link>
        </div>
      </aside>

      {/* Main content */}
      <div className="admin-main">
        <header className="admin-topbar">
          <button className="admin-menu-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
            ☰
          </button>
          <h2 className="admin-page-title">{t(SECTIONS.find((s) => s.id === section)?.label || '')}</h2>
          <div className="admin-topbar-right">
            <span className="admin-user-badge">{user.name}</span>
          </div>
        </header>

        <div className="admin-content">
          {section === 'dashboard' && <AdminDashboard stats={stats} onRefresh={fetchStats} />}
          {section === 'agents' && <AgentManagement authFetch={authFetch} />}
          {section === 'chats' && <ChatDashboard authFetch={authFetch} />}
          {section === 'tracking' && <TrackingManager authFetch={authFetch} />}
          {section === 'users' && <UserList authFetch={authFetch} />}
        </div>
      </div>
    </div>
  )
}
