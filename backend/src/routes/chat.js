import { Router } from 'express';
import { getMessages, addMessage, getOnlineAgents, getAllConversations } from '../data/db.js';
import { optionalAuth, requireAuth } from '../middleware/authGuard.js';

const router = Router();

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

  res.status(201).json({ message: msg });
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
