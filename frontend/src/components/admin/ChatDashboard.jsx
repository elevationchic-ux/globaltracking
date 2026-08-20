import { useState, useEffect, useRef } from 'react'
import { useI18n } from '../../i18n/I18nContext.jsx'

export default function ChatDashboard({ authFetch }) {
  const { t } = useI18n()
  const [conversations, setConversations] = useState([])
  const [agents, setAgents] = useState([])
  const [selectedConv, setSelectedConv] = useState(null)
  const [selectedAgent, setSelectedAgent] = useState('')
  const [replyText, setReplyText] = useState('')
  const [convMessages, setConvMessages] = useState([])
  const messagesEnd = useRef(null)

  const fetchData = async () => {
    try {
      const [convRes, agentRes] = await Promise.all([
        authFetch('/api/admin/chats'),
        authFetch('/api/admin/agents'),
      ])
      if (convRes.ok) {
        const data = await convRes.json()
        setConversations(data.conversations || [])
      }
      if (agentRes.ok) {
        const data = await agentRes.json()
        setAgents(data.agents || [])
        if (data.agents?.length > 0 && !selectedAgent) {
          setSelectedAgent(data.agents[0].id)
        }
      }
    } catch { /* ignore */ }
  }

  useEffect(() => { fetchData() }, [authFetch])

  async function openConversation(conv) {
    setSelectedConv(conv)
    setConvMessages(conv.messages || [])
  }

  async function handleReply(e) {
    e.preventDefault()
    if (!replyText.trim() || !selectedConv || !selectedAgent) return
    try {
      const res = await authFetch(`/api/admin/chats/${selectedConv.id}/reply`, {
        method: 'POST',
        body: JSON.stringify({ agentId: selectedAgent, text: replyText.trim() }),
      })
      if (res.ok) {
        const data = await res.json()
        setConvMessages((prev) => [...prev, data.message])
        setReplyText('')
        fetchData()
      }
    } catch { /* ignore */ }
  }

  useEffect(() => {
    messagesEnd.current?.scrollIntoView({ behavior: 'smooth' })
  }, [convMessages])

  return (
    <div>
      <div className="admin-section-header">
        <h3>{t('admin.allConversations')}</h3>
        <button className="admin-btn admin-btn-ghost admin-btn-sm" onClick={fetchData}>
          {t('admin.refresh')}
        </button>
      </div>

      {conversations.length === 0 ? (
        <p style={{ color: '#64748b', textAlign: 'center', padding: '2rem' }}>{t('admin.noConversations')}</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: selectedConv ? '300px 1fr' : '1fr', gap: '1rem' }}>
          {/* Conversation list */}
          <div className="admin-chat-list">
            {conversations.map((conv) => (
              <div
                key={conv.id}
                className={`admin-chat-item ${selectedConv?.id === conv.id ? 'active' : ''}`}
                onClick={() => openConversation(conv)}
                style={selectedConv?.id === conv.id ? { borderColor: '#06b6d4' } : {}}
              >
                <div className="admin-chat-item-header">
                  <span className="admin-chat-item-name">{conv.id}</span>
                  <span className="admin-chat-item-count">{conv.messageCount} msgs</span>
                </div>
                {conv.lastMessage && (
                  <div className="admin-chat-item-preview">
                    {conv.lastMessage.senderName}: {conv.lastMessage.text}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Conversation detail */}
          {selectedConv && (
            <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 12, display: 'flex', flexDirection: 'column', maxHeight: '60vh' }}>
              <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 600, color: '#e2e8f0' }}>{selectedConv.id}</span>
                <button className="admin-btn admin-btn-ghost admin-btn-sm" onClick={() => setSelectedConv(null)}>✕</button>
              </div>

              {/* Agent selector */}
              <div style={{ padding: '0.5rem 1rem', borderBottom: '1px solid #334155', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{t('admin.replyAs')}:</span>
                <select className="admin-form-select" style={{ width: 'auto', padding: '0.25rem 0.5rem', fontSize: '0.8rem' }} value={selectedAgent} onChange={(e) => setSelectedAgent(e.target.value)}>
                  {agents.map((a) => (
                    <option key={a.id} value={a.id}>{a.name} {a.online ? '🟢' : '⚫'}</option>
                  ))}
                </select>
              </div>

              {/* Messages */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', minHeight: 200 }}>
                {convMessages.map((msg) => (
                  <div key={msg.id} style={{
                    alignSelf: msg.senderRole === 'agent' ? 'flex-end' : 'flex-start',
                    background: msg.senderRole === 'agent' ? '#0e7490' : '#334155',
                    color: '#fff',
                    padding: '0.5rem 0.75rem',
                    borderRadius: 10,
                    maxWidth: '80%',
                    fontSize: '0.85rem',
                  }}>
                    <div style={{ fontSize: '0.7rem', opacity: 0.7, marginBottom: 2 }}>{msg.senderName}</div>
                    {msg.text}
                    <div style={{ fontSize: '0.65rem', opacity: 0.5, textAlign: 'right', marginTop: 2 }}>
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                ))}
                <div ref={messagesEnd} />
              </div>

              {/* Reply form */}
              <form onSubmit={handleReply} style={{ display: 'flex', gap: '0.5rem', padding: '0.75rem', borderTop: '1px solid #334155' }}>
                <input
                  className="admin-form-input"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder={t('chat.placeholder')}
                  style={{ flex: 1 }}
                />
                <button type="submit" className="admin-btn admin-btn-primary" disabled={!replyText.trim()}>
                  {t('chat.send')}
                </button>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
