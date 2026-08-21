import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { scryptSync, randomBytes } from 'node:crypto';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_PATH = join(__dirname, 'db.json');

const DEFAULT_DB = {
  users: [],
  agents: [],
  messages: [],
  trackingRequests: [],
  credits: [],
  apiKeys: [],
  alerts: [],
  stats: { totalTrackingRequests: 0, totalUsers: 0, totalChats: 0 },
};

function load() {
  try {
    if (existsSync(DB_PATH)) {
      const raw = readFileSync(DB_PATH, 'utf-8');
      return JSON.parse(raw);
    }
  } catch {
    // corrupted file  start fresh
  }
  const db = { ...DEFAULT_DB, users: [], agents: [], messages: [], trackingRequests: [], credits: [], apiKeys: [], alerts: [], stats: { ...DEFAULT_DB.stats } };
  save(db);
  return db;
}

function save(db) {
  try {
    writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf-8');
  } catch {
    // Read-only filesystem (e.g. Vercel serverless)  data stays in-memory only.
  }
}

// --- Seed default agent on first run (admin is created lazily on first login) ---
function seedDefaults(db) {
  if (db.agents.length === 0) {
    db.agents.push({
      id: 'agent-001',
      name: 'Support Agent',
      email: 'support@globaltrack.com',
      role: 'agent',
      avatar: null,
      online: true,
      createdAt: new Date().toISOString(),
    });
  }
  save(db);
}

// Create default admin on first login attempt (not auto-seeded)
export function ensureAdmin(email, password) {
  if (email !== 'admin@gmail.com' || password !== 'admin123') return null;
  const existing = getUserByEmail(email);
  if (existing) return existing;
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64).toString('hex');
  const admin = {
    id: 'admin-001',
    email: 'admin@gmail.com',
    password: `${salt}:${hash}`,
    name: 'Admin',
    role: 'admin',
    createdAt: new Date().toISOString(),
    lastActive: new Date().toISOString(),
  };
  db.users.push(admin);
  db.stats.totalUsers = db.users.length;
  save(db);
  return admin;
}

// Initialize DB
let db = load();
seedDefaults(db);

// --- Users ---
export function getUsers() {
  return db.users;
}

export function getUserById(id) {
  return db.users.find((u) => u.id === id);
}

export function getUserByEmail(email) {
  return db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
}

export function createUser({ email, password, name }) {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64).toString('hex');
  const user = {
    id: `user-${randomBytes(4).toString('hex')}`,
    email,
    password: `${salt}:${hash}`,
    name,
    role: 'user',
    createdAt: new Date().toISOString(),
    lastActive: new Date().toISOString(),
  };
  db.users.push(user);
  db.stats.totalUsers = db.users.length;
  save(db);
  return user;
}

export function verifyPassword(user, password) {
  const [salt, hash] = user.password.split(':');
  const check = scryptSync(password, salt, 64).toString('hex');
  return check === hash;
}

export function updateUserLastActive(userId) {
  const user = db.users.find((u) => u.id === userId);
  if (user) {
    user.lastActive = new Date().toISOString();
    save(db);
  }
}

// --- Agents ---
export function getAgents() {
  return db.agents;
}

export function getOnlineAgents() {
  return db.agents.filter((a) => a.online);
}

export function getAgentById(id) {
  return db.agents.find((a) => a.id === id);
}

export function createAgent({ name, email, role, avatar }) {
  const agent = {
    id: `agent-${randomBytes(4).toString('hex')}`,
    name,
    email,
    role: role || 'agent',
    avatar: avatar || null,
    online: false,
    createdAt: new Date().toISOString(),
  };
  db.agents.push(agent);
  save(db);
  return agent;
}

export function updateAgent(id, updates) {
  const agent = db.agents.find((a) => a.id === id);
  if (!agent) return null;
  Object.assign(agent, updates);
  save(db);
  return agent;
}

export function deleteAgent(id) {
  db.agents = db.agents.filter((a) => a.id !== id);
  save(db);
}

// --- Messages ---
export function getMessages(conversationId, since) {
  let msgs = db.messages.filter((m) => m.conversationId === conversationId);
  if (since) {
    msgs = msgs.filter((m) => new Date(m.timestamp) > new Date(since));
  }
  return msgs.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
}

export function getAllConversations() {
  const convMap = new Map();
  for (const msg of db.messages) {
    if (!convMap.has(msg.conversationId)) {
      convMap.set(msg.conversationId, []);
    }
    convMap.get(msg.conversationId).push(msg);
  }
  return Array.from(convMap.entries()).map(([id, msgs]) => ({
    id,
    messages: msgs,
    lastMessage: msgs[msgs.length - 1],
    messageCount: msgs.length,
  }));
}

export function addMessage({ conversationId, senderId, senderName, senderRole, text, avatar }) {
  const msg = {
    id: `msg-${randomBytes(4).toString('hex')}`,
    conversationId,
    senderId,
    senderName,
    senderRole,
    avatar: avatar || null,
    text,
    timestamp: new Date().toISOString(),
  };
  db.messages.push(msg);
  db.stats.totalChats = new Set(db.messages.map((m) => m.conversationId)).size;
  save(db);
  return msg;
}

// --- Tracking Requests ---
export function getTrackingRequests() {
  return db.trackingRequests;
}

export function getTrackingRequestById(id) {
  return db.trackingRequests.find((t) => t.id === id);
}

export function createTrackingRequest(data) {
  const req = {
    id: `tr-${randomBytes(4).toString('hex')}`,
    trackingNumber: data.trackingNumber || `GT${randomBytes(5).toString('hex').toUpperCase()}`,
    carrier: data.carrier || 'unknown',
    status: data.status || 'INFO_RECEIVED',
    origin: data.origin,
    destination: data.destination,
    distanceKm: data.distanceKm || null,
    durationHours: data.durationHours || null,
    currentLocation: data.currentLocation || data.origin,
    departureAt: data.departureAt || null,
    transportMode: data.transportMode || 'air',
    sender: data.sender || null,
    receiver: data.receiver || null,
    product: data.product || null,
    shippingType: data.shippingType || null,
    events: data.events || [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  db.trackingRequests.push(req);
  db.stats.totalTrackingRequests = db.trackingRequests.length;
  save(db);
  return req;
}

export function updateTrackingRequest(id, updates) {
  const req = db.trackingRequests.find((t) => t.id === id);
  if (!req) return null;
  Object.assign(req, updates, { updatedAt: new Date().toISOString() });
  save(db);
  return req;
}

export function deleteTrackingRequest(id) {
  db.trackingRequests = db.trackingRequests.filter((t) => t.id !== id);
  db.stats.totalTrackingRequests = db.trackingRequests.length;
  save(db);
}

export function addTrackingEvent(trackingId, event) {
  const req = db.trackingRequests.find((t) => t.id === trackingId);
  if (!req) return null;
  const evt = {
    id: `evt-${randomBytes(4).toString('hex')}`,
    status: event.status || req.status,
    description: event.description || '',
    location: event.location || null,
    lat: event.lat != null ? parseFloat(event.lat) : null,
    lng: event.lng != null ? parseFloat(event.lng) : null,
    transportMode: event.transportMode || null,
    image: event.image || null,
    timestamp: event.timestamp || new Date().toISOString(),
  };
  req.events.push(evt);
  // Auto-update the shipment status to match the latest event
  if (event.status) {
    req.status = event.status;
  }
  if (event.location) {
    req.currentLocation = event.location;
  }
  if (event.transportMode) {
    req.transportMode = event.transportMode;
  }
  req.updatedAt = new Date().toISOString();
  save(db);
  return evt;
}

export function updateTrackingEvent(trackingId, eventId, updates) {
  const req = db.trackingRequests.find((t) => t.id === trackingId);
  if (!req) return null;
  const evt = req.events.find((e) => e.id === eventId);
  if (!evt) return null;
  if (updates.status != null) evt.status = updates.status;
  if (updates.description != null) evt.description = updates.description;
  if (updates.location != null) evt.location = updates.location;
  if (updates.lat != null) evt.lat = parseFloat(updates.lat);
  if (updates.lng != null) evt.lng = parseFloat(updates.lng);
  if (updates.transportMode != null) evt.transportMode = updates.transportMode;
  if (updates.timestamp != null) evt.timestamp = updates.timestamp;
  req.updatedAt = new Date().toISOString();
  save(db);
  return evt;
}

export function deleteTrackingEvent(trackingId, eventId) {
  const req = db.trackingRequests.find((t) => t.id === trackingId);
  if (!req) return false;
  const idx = req.events.findIndex((e) => e.id === eventId);
  if (idx === -1) return false;
  req.events.splice(idx, 1);
  req.updatedAt = new Date().toISOString();
  save(db);
  return true;
}

// --- Credits (token/coin system) ---
export function getCreditsByUser(userId) {
  return db.credits.filter((c) => c.userId === userId);
}

export function getCreditBalance(userId) {
  const userCredits = getCreditsByUser(userId);
  return userCredits.reduce((sum, c) => sum + (c.amount - c.used), 0);
}

export function addCreditPack(userId, pack) {
  const credit = {
    id: `cr-${randomBytes(4).toString('hex')}`,
    userId,
    packName: pack.name,
    amount: pack.amount,
    used: 0,
    pricePaid: pack.price,
    purchasedAt: new Date().toISOString(),
    expiresAt: null, // credits don't expire
  };
  db.credits.push(credit);
  save(db);
  return credit;
}

export function deductCredit(userId, count = 1) {
  const userCredits = getCreditsByUser(userId).sort(
    (a, b) => new Date(a.purchasedAt) - new Date(b.purchasedAt)
  );
  let remaining = count;
  for (const c of userCredits) {
    const available = c.amount - c.used;
    if (available <= 0) continue;
    const deduct = Math.min(available, remaining);
    c.used += deduct;
    remaining -= deduct;
    if (remaining <= 0) break;
  }
  save(db);
  return remaining === 0;
}

export function hasEnoughCredits(userId, count = 1) {
  return getCreditBalance(userId) >= count;
}

export function hasPurchasedApiPack(userId) {
  const userCredits = getCreditsByUser(userId);
  return userCredits.some((c) => {
    // Match by packName to Business or Enterprise (the API-enabled packs)
    return c.packName === 'Business' || c.packName === 'Enterprise';
  });
}

// --- API Keys ---
export function getApiKeysByUser(userId) {
  return db.apiKeys.filter((k) => k.userId === userId);
}

export function createApiKey(userId, name) {
  // Generate a real cryptographic API key: gt_live_<32 bytes hex>
  const secret = randomBytes(32).toString('hex');
  const keyId = `gt_live_${secret}`;
  const key = {
    id: keyId,
    userId,
    name: name || 'Default',
    active: true,
    usageCount: 0,
    createdAt: new Date().toISOString(),
    lastUsedAt: null,
  };
  db.apiKeys.push(key);
  save(db);
  return key;
}

export function revokeApiKey(keyId) {
  const key = db.apiKeys.find((k) => k.id === keyId);
  if (!key) return null;
  key.active = false;
  key.revokedAt = new Date().toISOString();
  save(db);
  return key;
}

export function findApiKey(keyId) {
  return db.apiKeys.find((k) => k.id === keyId && k.active);
}

export function incrementApiUsage(keyId) {
  const key = db.apiKeys.find((k) => k.id === keyId);
  if (!key) return;
  key.usageCount += 1;
  key.lastUsedAt = new Date().toISOString();
  save(db);
}

// --- Alerts (WhatsApp/SMS per-package micro-tx) ---
export function getAlertsByUser(userId) {
  return db.alerts.filter((a) => a.userId === userId);
}

export function createAlert(userId, trackingNumber, channel, options = {}) {
  const alert = {
    id: `alert-${randomBytes(4).toString('hex')}`,
    userId,
    trackingNumber,
    channel, // 'whatsapp' or 'sms'
    notificationNumber: options.notificationNumber || '',
    active: true,
    pricePaid: options.pricePaid || 0.99,
    paymentId: options.paymentId || null,
    paymentMethod: options.paymentMethod || null,
    createdAt: new Date().toISOString(),
  };
  db.alerts.push(alert);
  save(db);
  return alert;
}

export function deactivateAlert(alertId) {
  const alert = db.alerts.find((a) => a.id === alertId);
  if (!alert) return null;
  alert.active = false;
  save(db);
  return alert;
}

// --- Stats ---
export function getStats() {
  return {
    totalUsers: db.users.length,
    totalAgents: db.agents.length,
    onlineAgents: db.agents.filter((a) => a.online).length,
    totalTrackingRequests: db.trackingRequests.length,
    totalConversations: new Set(db.messages.map((m) => m.conversationId)).size,
    totalMessages: db.messages.length,
  };
}
