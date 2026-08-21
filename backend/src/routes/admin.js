import { Router } from 'express';
import { requireAuth, requireAdmin } from '../middleware/authGuard.js';
import {
  getStats, getUsers, getAgents, getAgentById, createAgent, updateAgent, deleteAgent,
  getTrackingRequests, getTrackingRequestById, createTrackingRequest, updateTrackingRequest, deleteTrackingRequest,
  getAllConversations, addMessage, addTrackingEvent,
} from '../data/db.js';
import { haversineDistance, estimateDuration, formatDuration } from '../utils/haversine.js';

const router = Router();

// All admin routes require authentication + admin role
router.use(requireAuth, requireAdmin);

// --- Stats ---
router.get('/stats', (_req, res) => {
  res.json(getStats());
});

// --- Users ---
router.get('/users', (_req, res) => {
  const users = getUsers().map((u) => ({
    id: u.id, email: u.email, name: u.name, role: u.role,
    createdAt: u.createdAt, lastActive: u.lastActive,
  }));
  res.json({ users });
});

// --- Agents CRUD ---
router.get('/agents', (_req, res) => {
  res.json({ agents: getAgents() });
});

router.post('/agents', (req, res) => {
  const { name, email, role, avatar } = req.body;
  if (!name || !email) {
    return res.status(400).json({ error: 'MISSING_FIELDS', message: 'Name and email are required.' });
  }
  const agent = createAgent({ name, email, role, avatar });
  res.status(201).json({ agent });
});

router.put('/agents/:id', (req, res) => {
  const agent = updateAgent(req.params.id, req.body);
  if (!agent) return res.status(404).json({ error: 'NOT_FOUND', message: 'Agent not found.' });
  res.json({ agent });
});

router.delete('/agents/:id', (req, res) => {
  deleteAgent(req.params.id);
  res.json({ success: true });
});

// --- Chat Management ---
router.get('/chats', (_req, res) => {
  const conversations = getAllConversations();
  res.json({ conversations });
});

router.post('/chats/:conversationId/reply', (req, res) => {
  const { conversationId } = req.params;
  const { agentId, text } = req.body;

  if (!text) {
    return res.status(400).json({ error: 'MISSING_TEXT', message: 'Message text is required.' });
  }

  const agent = agentId ? getAgentById(agentId) : getAgents()[0];
  if (!agent) {
    return res.status(404).json({ error: 'NO_AGENT', message: 'No agent available to reply.' });
  }

  const msg = addMessage({
    conversationId,
    senderId: agent.id,
    senderName: agent.name,
    senderRole: 'agent',
    text,
    avatar: agent.avatar,
  });

  res.status(201).json({ message: msg });
});

// --- Tracking Request Management ---
router.get('/tracking', (_req, res) => {
  res.json({ trackingRequests: getTrackingRequests() });
});

router.post('/tracking', (req, res) => {
  const { origin, destination, carrier, status, trackingNumber, departureAt, sender, receiver, product, shippingType } = req.body;

  if (!origin || !destination) {
    return res.status(400).json({ error: 'MISSING_LOCATIONS', message: 'Origin and destination are required.' });
  }

  // Auto-calculate distance and duration if coordinates provided
  let distanceKm = null;
  let durationHours = null;
  if (origin.lat && origin.lng && destination.lat && destination.lng) {
    distanceKm = haversineDistance(origin, destination);
    durationHours = estimateDuration(distanceKm);
  }

  const trackingReq = createTrackingRequest({
    trackingNumber,
    carrier,
    status,
    origin,
    destination,
    distanceKm,
    durationHours: durationHours ? formatDuration(durationHours) : null,
    departureAt: departureAt || null,
    sender: sender || null,
    receiver: receiver || null,
    product: product || null,
    shippingType: shippingType || null,
  });

  res.status(201).json({ trackingRequest: trackingReq });
});

router.put('/tracking/:id', (req, res) => {
  const updates = { ...req.body };

  // Recalculate distance if origin/destination changed
  if (updates.origin && updates.destination && updates.origin.lat && updates.destination.lat) {
    updates.distanceKm = haversineDistance(updates.origin, updates.destination);
    const hours = estimateDuration(updates.distanceKm);
    updates.durationHours = formatDuration(hours);
  }

  const trackingReq = updateTrackingRequest(req.params.id, updates);
  if (!trackingReq) return res.status(404).json({ error: 'NOT_FOUND', message: 'Tracking request not found.' });
  res.json({ trackingRequest: trackingReq });
});

router.delete('/tracking/:id', (req, res) => {
  deleteTrackingRequest(req.params.id);
  res.json({ success: true });
});

// --- Tracking Events (with photo proof) ---
router.post('/tracking/:id/events', (req, res) => {
  const { status, description, location, image, timestamp } = req.body;
  const evt = addTrackingEvent(req.params.id, { status, description, location, image, timestamp });
  if (!evt) return res.status(404).json({ error: 'NOT_FOUND', message: 'Tracking request not found.' });
  const updated = getTrackingRequestById(req.params.id);
  res.status(201).json({ event: evt, trackingRequest: updated });
});

export default router;
