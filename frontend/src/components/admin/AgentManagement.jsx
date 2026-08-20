import { useState, useEffect, useRef } from 'react'
import { useI18n } from '../../i18n/I18nContext.jsx'

export default function AgentManagement({ authFetch }) {
  const { t } = useI18n()
  const [agents, setAgents] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', role: 'agent', avatar: null })
  const [avatarPreview, setAvatarPreview] = useState(null)
  const fileRef = useRef(null)

  const fetchAgents = async () => {
    try {
      const res = await authFetch('/api/admin/agents')
      if (res.ok) {
        const data = await res.json()
        setAgents(data.agents || [])
      }
    } catch { /* ignore */ }
  }

  useEffect(() => { fetchAgents() }, [authFetch])

  function handleAvatarChange(e) {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      setAvatarPreview(reader.result)
      setForm((f) => ({ ...f, avatar: reader.result }))
    }
    reader.readAsDataURL(file)
  }

  async function handleCreate(e) {
    e.preventDefault()
    try {
      const res = await authFetch('/api/admin/agents', {
        method: 'POST',
        body: JSON.stringify(form),
      })
      if (res.ok) {
        setShowModal(false)
        setForm({ name: '', email: '', role: 'agent', avatar: null })
        setAvatarPreview(null)
        fetchAgents()
      }
    } catch { /* ignore */ }
  }

  async function toggleOnline(agent) {
    await authFetch(`/api/admin/agents/${agent.id}`, {
      method: 'PUT',
      body: JSON.stringify({ online: !agent.online }),
    })
    fetchAgents()
  }

  async function handleDelete(agentId) {
    if (!confirm(t('admin.confirmDelete'))) return
    await authFetch(`/api/admin/agents/${agentId}`, { method: 'DELETE' })
    fetchAgents()
  }

  return (
    <div>
      <div className="admin-section-header">
        <h3>{t('admin.manageAgents')}</h3>
        <button className="admin-btn admin-btn-primary" onClick={() => setShowModal(true)}>
          + {t('admin.addAgent')}
        </button>
      </div>

      <div className="admin-agent-grid">
        {agents.map((agent) => (
          <div key={agent.id} className="admin-agent-card">
            <div className="admin-agent-card-header">
              <div className="admin-avatar">
                {agent.avatar
                  ? <img src={agent.avatar} alt={agent.name} />
                  : agent.name.charAt(0).toUpperCase()}
              </div>
              <div className="admin-agent-info">
                <div className="admin-agent-name">{agent.name}</div>
                <div className="admin-agent-email">{agent.email}</div>
              </div>
              <span className={`admin-status ${agent.online ? 'admin-status-online' : 'admin-status-offline'}`}>
                <span className="admin-status-dot"></span>
                {agent.online ? t('admin.online') : t('admin.offline')}
              </span>
            </div>
            <div className="admin-agent-actions">
              <button className="admin-btn admin-btn-ghost admin-btn-sm" onClick={() => toggleOnline(agent)}>
                {agent.online ? t('admin.setOffline') : t('admin.setOnline')}
              </button>
              <button className="admin-btn admin-btn-danger admin-btn-sm" onClick={() => handleDelete(agent.id)}>
                {t('admin.delete')}
              </button>
            </div>
          </div>
        ))}
      </div>

      {agents.length === 0 && (
        <p style={{ color: '#64748b', textAlign: 'center', padding: '2rem' }}>{t('admin.noAgents')}</p>
      )}

      {/* Create Agent Modal */}
      {showModal && (
        <div className="admin-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3>{t('admin.createAgent')}</h3>
              <button className="admin-modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>

            <form onSubmit={handleCreate}>
              <div className="admin-form-group">
                <label>{t('auth.name')}</label>
                <input
                  className="admin-form-input"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Agent name"
                  required
                />
              </div>

              <div className="admin-form-group">
                <label>{t('auth.email')}</label>
                <input
                  className="admin-form-input"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  placeholder="agent@globaltrack.com"
                  required
                />
              </div>

              <div className="admin-form-group">
                <label>{t('admin.role')}</label>
                <select
                  className="admin-form-select"
                  value={form.role}
                  onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
                >
                  <option value="agent">Agent</option>
                  <option value="supervisor">Supervisor</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div className="admin-form-group">
                <label>{t('admin.avatar')}</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div className="admin-avatar" style={{ width: 48, height: 48, fontSize: '1.2rem' }}>
                    {avatarPreview
                      ? <img src={avatarPreview} alt="Preview" />
                      : '?'}
                  </div>
                  <button type="button" className="admin-btn admin-btn-ghost admin-btn-sm" onClick={() => fileRef.current?.click()}>
                    {t('admin.uploadImage')}
                  </button>
                  <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarChange} />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                <button type="button" className="admin-btn admin-btn-ghost" onClick={() => setShowModal(false)}>
                  {t('admin.cancel')}
                </button>
                <button type="submit" className="admin-btn admin-btn-primary">
                  {t('admin.create')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
