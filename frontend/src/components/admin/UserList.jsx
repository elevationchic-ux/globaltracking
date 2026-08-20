import { useState, useEffect } from 'react'
import { useI18n } from '../../i18n/I18nContext.jsx'

export default function UserList({ authFetch }) {
  const { t } = useI18n()
  const [users, setUsers] = useState([])

  useEffect(() => {
    async function fetchUsers() {
      try {
        const res = await authFetch('/api/admin/users')
        if (res.ok) {
          const data = await res.json()
          setUsers(data.users || [])
        }
      } catch { /* ignore */ }
    }
    fetchUsers()
  }, [authFetch])

  function formatDate(iso) {
    if (!iso) return '-'
    return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
  }

  function timeSince(iso) {
    if (!iso) return '-'
    const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
    if (seconds < 60) return `${seconds}s ago`
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    return `${days}d ago`
  }

  return (
    <div>
      <div className="admin-section-header">
        <h3>{t('admin.registeredUsers')} ({users.length})</h3>
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>{t('auth.name')}</th>
              <th>{t('auth.email')}</th>
              <th>{t('admin.roleCol')}</th>
              <th>{t('admin.joined')}</th>
              <th>{t('admin.lastActive')}</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td style={{ fontWeight: 600 }}>{u.name}</td>
                <td style={{ color: '#94a3b8' }}>{u.email}</td>
                <td>
                  <span className={`admin-status ${u.role === 'admin' ? 'admin-status-online' : 'admin-status-offline'}`}>
                    {u.role}
                  </span>
                </td>
                <td>{formatDate(u.createdAt)}</td>
                <td title={formatDate(u.lastActive)}>{timeSince(u.lastActive)}</td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr><td colSpan={5} style={{ textAlign: 'center', color: '#64748b', padding: '2rem' }}>{t('admin.noUsers')}</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
