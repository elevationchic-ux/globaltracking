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
  stats: { totalTrackingRequests: 0, totalUsers: 0, totalChats: 0 },
};

function load() {
  try {
    if (existsSync(DB_PATH)) {
      const raw = readFileSync(DB_PATH, 'utf-8');
      return JSON.parse(raw);
    }
  } catch {
    // corrupted file — start fresh
  }
  const db = { ...DEFAULT_DB, users: [], agents: [], messages: [], trackingRequests: [], stats: { ...DEFAULT_DB.stats } };
  save(db);
  return db;
}

function save(db) {
  writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf-8');
}

// --- Seed default admin + agent on first run ---
function seedDefaults(db) {
  if (db.users.length === 0) {
    const salt = randomBytes(16).toString('hex');
    const hash = scryptSync('admin123', salt, 64).toString('hex');
    db.users.push({
      id: 'admin-001',
      email: 'admin@gmail.com',
      password: `${salt}:${hash}`,
      name: 'Admin',
      role: 'admin',
      createdAt: new Date().toISOString(),
      lastActive: new Date().toISOString(),
    });
  }
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
