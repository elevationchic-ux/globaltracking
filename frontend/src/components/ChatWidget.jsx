import { useState, useRef, useEffect, useCallback } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { useI18n } from '../i18n/I18nContext.jsx'
import './ChatWidget.css'

const API_BASE = import.meta.env.VITE_API_URL || ''
const POLL_INTERVAL = 3000

export default function ChatWidget() {
  const { user, token } = useAuth()
  const { t } = useI18n()
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [onlineAgents, setOnlineAgents] = useState([])
  const [pos, setPos] = useState({ x: -1, y: -1 })
  const [dragging, setDragging] = useState(false)
  const dragOffset = useRef({ x: 0, y: 0 })
  const messagesEnd = useRef(null)
  const pollRef = useRef(null)

  // Initialize position bottom-right
  useEffect(() => {
    if (pos.x === -1) {
      setPos({ x: window.innerWidth - 70, y: window.innerHeight - 90 })
    }
  }, [pos.x])

  // Fetch online agents
  useEffect(() => {
    fetch(`${API_BASE}/api/chat/agents`)
      .then((r) => r.json())
      .then((d) => setOnlineAgents(d.agents || []))
      .catch(() => {})
  }, [])

  // Poll messages
  const pollMessages = useCallback(() => {
    if (!user) return
    const convId = `user-${user.id}`
    const since = messages.length > 0 ? messages[messages.length - 1].timestamp : ''
    fetch(`${API_BASE}/api/chat/messages?conversation=${convId}${since ? `&since=${since}` : ''}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.messages && d.messages.length > 0) {
          setMessages((prev) => {
            const existingIds = new Set(prev.map((m) => m.id))
            const newMsgs = d.messages.filter((m) => !existingIds.has(m.id))
            return [...prev, ...newMsgs]
          })
        }
      })
      .catch(() => {})
  }, [user, token, messages])

  useEffect(() => {
    if (!open || !user) return
    pollMessages()
    pollRef.current = setInterval(pollMessages, POLL_INTERVAL)
    return () => clearInterval(pollRef.current)
  }, [open, user, pollMessages])

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEnd.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Drag handling
  function handlePointerDown(e) {
    setDragging(true)
    dragOffset.current = { x: e.clientX - pos.x, y: e.clientY - pos.y }
    e.currentTarget.setPointerCapture(e.pointerId)
  }
  function handlePointerMove(e) {
    if (!dragging) return
    setPos({ x: e.clientX - dragOffset.current.x, y: e.clientY - dragOffset.current.y })
  }
  function handlePointerUp() {
    setDragging(false)
  }

  async function handleSend(e) {
    e.preventDefault()
    if (!input.trim() || !user) return
    const convId = `user-${user.id}`
    try {
      const res = await fetch(`${API_BASE}/api/chat/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          conversationId: convId,
          senderId: user.id,
          senderName: user.name,
          senderRole: user.role,
          text: input.trim(),
        }),
      })
      const data = await res.json()
      if (data.message) {
        setMessages((prev) => [...prev, data.message])
      }
      setInput('')
    } catch {
      // silent
    }
  }

  // Login prompt for unauthenticated users
  if (!user) {
    return (
      <div className="chat-widget" style={{ position: 'fixed', right: '1rem', bottom: '1rem', zIndex: 9999 }}>
        <div className="chat-bubble" onClick={() => setOpen(!open)}>
          💬
        </div>
        {open && (
          <div className="chat-panel">
            <div className="chat-panel-header">{t('chat.title')}</div>
            <div className="chat-login-prompt">
              <p>{t('chat.loginRequired')}</p>
              <a href="/login" className="chat-login-link">{t('auth.login')}</a>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="chat-widget" style={{ position: 'fixed', left: pos.x, top: pos.y, zIndex: 9999 }}>
      {/* Draggable bubble */}
      <div
        className={`chat-bubble ${open ? 'chat-bubble-active' : ''}`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onClick={() => !dragging && setOpen(!open)}
      >
        {open ? '✕' : '💬'}
        {onlineAgents.length > 0 && !open && (
          <span className="chat-online-badge">{onlineAgents.length}</span>
        )}
      </div>

      {/* Chat panel */}
      {open && (
        <div className="chat-panel">
          <div className="chat-panel-header">
            <span>{t('chat.title')}</span>
            <span className="chat-agents-count">
              {onlineAgents.length > 0
                ? `${onlineAgents.length} ${t('chat.online')}`
                : t('chat.offline')}
            </span>
          </div>

          <div className="chat-messages">
            {messages.length === 0 && (
              <div className="chat-empty">{t('chat.empty')}</div>
            )}
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`chat-message ${msg.senderId === user.id ? 'chat-message-own' : 'chat-message-other'}`}
              >
                <div className="chat-message-sender">{msg.senderName}</div>
                <div className="chat-message-text">{msg.text}</div>
                <div className="chat-message-time">
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            ))}
            <div ref={messagesEnd} />
          </div>

          <form className="chat-input-row" onSubmit={handleSend}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t('chat.placeholder')}
              className="chat-input"
            />
            <button type="submit" className="chat-send" disabled={!input.trim()}>
              {t('chat.send')}
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
