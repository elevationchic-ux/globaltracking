import { useI18n } from '../../i18n/I18nContext.jsx'

export default function AdminDashboard({ stats, onRefresh }) {
  const { t } = useI18n()

  if (!stats) {
    return <div className="admin-loading">Loading stats...</div>
  }

  const cards = [
    { icon: '📦', value: stats.totalTrackingRequests, label: 'admin.stat.tracking' },
    { icon: '👤', value: stats.totalUsers, label: 'admin.stat.users' },
    { icon: '💬', value: stats.totalConversations, label: 'admin.stat.conversations' },
    { icon: '📨', value: stats.totalMessages, label: 'admin.stat.messages' },
    { icon: '👥', value: stats.totalAgents, label: 'admin.stat.agents' },
    { icon: '🟢', value: stats.onlineAgents, label: 'admin.stat.onlineAgents' },
  ]

  return (
    <div>
      <div className="admin-section-header">
        <h3>{t('admin.overview')}</h3>
        <button className="admin-btn admin-btn-ghost admin-btn-sm" onClick={onRefresh}>
          {t('admin.refresh')}
        </button>
      </div>

      <div className="admin-stats-grid">
        {cards.map((card) => (
          <div key={card.label} className="admin-stat-card">
            <span className="admin-stat-icon">{card.icon}</span>
            <span className="admin-stat-value">{card.value}</span>
            <span className="admin-stat-label">{t(card.label)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
