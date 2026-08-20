import { Router } from 'express';
import { getMessages, addMessage, getOnlineAgents, getAllConversations, getAgents } from '../data/db.js';
import { optionalAuth, requireAuth } from '../middleware/authGuard.js';

const router = Router();

// Auto-reply messages when no agent is online
const AUTO_REPLIES = [
  "Hello! Thank you for reaching out. No agent is available right now, but we've received your message and will get back to you shortly.",
  "Hi there! Our team is currently offline. We'll respond as soon as possible. In the meantime, feel free to describe your issue in detail.",
  "Thanks for your message! Our support team will be back within a few hours. You can also check our FAQ section for common questions.",
  "Hello! We're currently away but your message is important to us. An agent will reply to you as soon as they come online.",
  "Hi! Our team is resting right now \u2014 they'll be back soon. Please leave your tracking number and we'll look into it right away.",
];

function pickAutoReply() {
  return AUTO_REPLIES[Math.floor(Math.random() * AUTO_REPLIES.length)];
}

/**
 * GET /api/chat/messages?conversation=X&since=Y
 * Returns messages for a conversation, optionally filtered by timestamp.
 */
router.get('/messages', optionalAuth, (req, res) => {
  const { conversation, since } = req.query;
  if (!conversation) {
    return res.status(400).json({ error: 'MISSING_CONVERSATION', message: 'conversation parameter required.' });
  }
  const messages = getMessages(conversation, since || null);
  res.json({ messages });
});

/**
 * POST /api/chat/messages
 * Body: { conversationId, senderId, senderName, senderRole, text, avatar? }
 */
router.post('/messages', requireAuth, (req, res) => {
  const { conversationId, senderId, senderName, senderRole, text, avatar } = req.body;

  if (!conversationId || !text) {
    return res.status(400).json({ error: 'MISSING_FIELDS', message: 'conversationId and text are required.' });
  }

  const msg = addMessage({
    conversationId,
    senderId: senderId || req.user.userId,
    senderName: senderName || req.user.name,
    senderRole: senderRole || req.user.role,
    text,
    avatar: avatar || null,
  });

  // If no agent is online, send an automatic reply so the user isn't left waiting
  const onlineAgents = getOnlineAgents();
  let autoReply = null;
  if (onlineAgents.length === 0) {
    // Small delay simulation (the reply appears after the user's message)
    autoReply = addMessage({
      conversationId,
      senderId: 'bot-support',
      senderName: 'GlobalTrack Bot',
      senderRole: 'agent',
      text: pickAutoReply(),
      avatar: null,
    });
  }

  res.status(201).json({ message: msg, autoReply });
});

/**
 * GET /api/chat/agents
 * Returns online agents list.
 */
router.get('/agents', (_req, res) => {
  const agents = getOnlineAgents();
  res.json({ agents, count: agents.length });
});

/**
 * GET /api/chat/conversations
 * Returns all conversations with last message preview (admin use).
 */
router.get('/conversations', requireAuth, (_req, res) => {
  const conversations = getAllConversations();
  res.json({ conversations });
});

export default router;
