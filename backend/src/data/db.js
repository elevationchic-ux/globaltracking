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
  demoPackagesSeeded: false,
  subscriptions: [], // User subscriptions
};

function load() {
  try {
    if (existsSync(DB_PATH)) {
      const raw = readFileSync(DB_PATH, 'utf-8');
      const loaded = JSON.parse(raw);
      // Ensure subscriptions array exists for backward compatibility
      if (!loaded.subscriptions) {
        loaded.subscriptions = [];
      }
      return loaded;
    }
  } catch {
    // corrupted file  start fresh
  }
  const db = { ...DEFAULT_DB, users: [], agents: [], messages: [], trackingRequests: [], credits: [], apiKeys: [], alerts: [], subscriptions: [], stats: { ...DEFAULT_DB.stats } };
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
  
  // Seed 5 demo packages with real information if not already seeded
  if (!db.demoPackagesSeeded) {
    seedDemoPackages(db);
    db.demoPackagesSeeded = true;
  }
  
  save(db);
}

// --- Seed 5 demo packages with real information and different transport modes ---
function seedDemoPackages(db) {
  const now = new Date();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
  
  // Demo 1: Ship (Sea freight) - Marseille to Shanghai
  db.trackingRequests.push({
    id: 'demo-ship-001',
    trackingNumber: 'MSCU987654321',
    carrier: 'MSC Mediterranean Shipping Company',
    status: 'IN_TRANSIT',
    origin: { city: 'Marseille', country: 'France', lat: 43.2965, lng: 5.3698 },
    destination: { city: 'Shanghai', country: 'China', lat: 31.2304, lng: 121.4737 },
    distanceKm: 12000,
    durationHours: '25d 12h',
    currentLocation: { city: 'Suez Canal', country: 'Egypt', lat: 30.0107, lng: 32.5406 },
    departureAt: twoDaysAgo.toISOString(),
    transportMode: 'sea',
    sender: { name: 'Vincent Martin', email: 'vincent@export-fr.com', location: 'Marseille, France' },
    receiver: { name: 'Li Wei', email: 'li.wei@import-cn.com', phone: '+86 21 1234 5678', address: '123 Nanjing Road, Shanghai' },
    product: 'Industrial machinery parts - 2 containers',
    shippingType: 'Sea Freight - FCL',
    events: [
      {
        id: 'evt-ship-001',
        status: 'INFO_RECEIVED',
        description: 'Container received at Marseille terminal',
        location: 'Marseille, France',
        lat: 43.2965,
        lng: 5.3698,
        transportMode: 'sea',
        timestamp: twoDaysAgo.toISOString(),
      },
      {
        id: 'evt-ship-002',
        status: 'IN_TRANSIT',
        description: 'Vessel departed Marseille - Loading completed',
        location: 'Marseille Port',
        lat: 43.2965,
        lng: 5.3698,
        transportMode: 'sea',
        timestamp: yesterday.toISOString(),
      },
      {
        id: 'evt-ship-003',
        status: 'IN_TRANSIT',
        description: 'Transiting Suez Canal',
        location: 'Suez Canal, Egypt',
        lat: 30.0107,
        lng: 32.5406,
        transportMode: 'sea',
        timestamp: now.toISOString(),
      },
    ],
    createdAt: twoDaysAgo.toISOString(),
    updatedAt: now.toISOString(),
  });

  // Demo 2: Car (Ground transport) - Paris to Amsterdam
  db.trackingRequests.push({
    id: 'demo-car-001',
    trackingNumber: 'DPD123456789FR',
    carrier: 'DPD France',
    status: 'OUT_FOR_DELIVERY',
    origin: { city: 'Paris', country: 'France', lat: 48.8566, lng: 2.3522 },
    destination: { city: 'Amsterdam', country: 'Netherlands', lat: 52.3676, lng: 4.9041 },
    distanceKm: 430,
    durationHours: '1d 4h',
    currentLocation: { city: 'Amsterdam', country: 'Netherlands', lat: 52.3676, lng: 4.9041 },
    departureAt: yesterday.toISOString(),
    transportMode: 'ground',
    sender: { name: 'Sophie Dubois', email: 'sophie@boutique-paris.com', location: 'Paris, France' },
    receiver: { name: 'Jan van der Berg', email: 'jan@amsterdam-business.nl', phone: '+31 20 123 4567', address: '45 Herengracht, Amsterdam' },
    product: 'Designer clothing collection',
    shippingType: 'Express Ground',
    events: [
      {
        id: 'evt-car-001',
        status: 'INFO_RECEIVED',
        description: 'Package collected from sender',
        location: 'Paris, France',
        lat: 48.8566,
        lng: 2.3522,
        transportMode: 'ground',
        timestamp: yesterday.toISOString(),
      },
      {
        id: 'evt-car-002',
        status: 'IN_TRANSIT',
        description: 'In transit to Amsterdam hub',
        location: 'Lille, France',
        lat: 50.6292,
        lng: 3.0573,
        transportMode: 'ground',
        timestamp: new Date(yesterday.getTime() + 12 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'evt-car-003',
        status: 'OUT_FOR_DELIVERY',
        description: 'Out for delivery - Expected today',
        location: 'Amsterdam, Netherlands',
        lat: 52.3676,
        lng: 4.9041,
        transportMode: 'ground',
        timestamp: now.toISOString(),
      },
    ],
    createdAt: yesterday.toISOString(),
    updatedAt: now.toISOString(),
  });

  // Demo 3: Train (Rail transport) - Berlin to Warsaw
  db.trackingRequests.push({
    id: 'demo-train-001',
    trackingNumber: 'DBS987654321PL',
    carrier: 'DB Schenker Rail',
    status: 'IN_TRANSIT',
    origin: { city: 'Berlin', country: 'Germany', lat: 52.52, lng: 13.405 },
    destination: { city: 'Warsaw', country: 'Poland', lat: 52.2297, lng: 21.0122 },
    distanceKm: 520,
    durationHours: '2d 6h',
    currentLocation: { city: 'Poznan', country: 'Poland', lat: 52.4064, lng: 16.9252 },
    departureAt: twoDaysAgo.toISOString(),
    transportMode: 'rail',
    sender: { name: 'Hans Müller', email: 'hans@german-export.de', location: 'Berlin, Germany' },
    receiver: { name: 'Anna Kowalski', email: 'anna@polish-import.pl', phone: '+48 22 123 4567', address: '78 Marszalkowska Street, Warsaw' },
    product: 'Automotive parts - Rail wagon',
    shippingType: 'Rail Freight',
    events: [
      {
        id: 'evt-train-001',
        status: 'INFO_RECEIVED',
        description: 'Rail wagon loaded at Berlin terminal',
        location: 'Berlin, Germany',
        lat: 52.52,
        lng: 13.405,
        transportMode: 'rail',
        timestamp: twoDaysAgo.toISOString(),
      },
      {
        id: 'evt-train-002',
        status: 'IN_TRANSIT',
        description: 'Train departed Berlin - On schedule',
        location: 'Berlin Hauptbahnhof',
        lat: 52.525,
        lng: 13.3695,
        transportMode: 'rail',
        timestamp: yesterday.toISOString(),
      },
      {
        id: 'evt-train-003',
        status: 'IN_TRANSIT',
        description: 'Passing through Poznan hub',
        location: 'Poznan, Poland',
        lat: 52.4064,
        lng: 16.9252,
        transportMode: 'rail',
        timestamp: now.toISOString(),
      },
    ],
    createdAt: twoDaysAgo.toISOString(),
    updatedAt: now.toISOString(),
  });

  // Demo 4: Pickup point (Relay point) - Lyon to Lille
  db.trackingRequests.push({
    id: 'demo-pickup-001',
    trackingNumber: '3SAB41C56D78E9',
    carrier: 'PostNL',
    status: 'DELIVERED',
    origin: { city: 'Lyon', country: 'France', lat: 45.764, lng: 4.8357 },
    destination: { city: 'Lille', country: 'France', lat: 50.6292, lng: 3.0573 },
    distanceKm: 690,
    durationHours: '1d 8h',
    currentLocation: { city: 'Lille', country: 'France', lat: 50.6292, lng: 3.0573 },
    departureAt: twoDaysAgo.toISOString(),
    transportMode: 'ground',
    sender: { name: 'Claude Martin', email: 'claude@lyon-business.fr', location: 'Lyon, France' },
    receiver: { name: 'Marie Dupont', email: 'marie@lille-resident.fr', phone: '+33 6 12 34 56 78', address: '56 Rue de Paris, Lille' },
    product: 'Electronics - Smartphone',
    shippingType: 'Point Relais',
    pickupPoint: {
      name: 'Point Relais - Night&Day Lille',
      address: '23 Rue Esquermoise, 59000 Lille',
      pin: '4 8 2 9 1 3',
      hours: 'Mon–Sat 08:00–20:00 · Sun 09:00–18:00',
      collected: true,
    },
    events: [
      {
        id: 'evt-pickup-001',
        status: 'INFO_RECEIVED',
        description: 'Package handed to carrier',
        location: 'Lyon, France',
        lat: 45.764,
        lng: 4.8357,
        transportMode: 'ground',
        timestamp: twoDaysAgo.toISOString(),
      },
      {
        id: 'evt-pickup-002',
        status: 'IN_TRANSIT',
        description: 'In transit to Lille hub',
        location: 'Paris, France',
        lat: 48.8566,
        lng: 2.3522,
        transportMode: 'ground',
        timestamp: yesterday.toISOString(),
      },
      {
        id: 'evt-pickup-003',
        status: 'DELIVERED',
        description: 'Delivered to pickup point - Ready for collection',
        location: 'Lille, France',
        lat: 50.6292,
        lng: 3.0573,
        transportMode: 'ground',
        timestamp: now.toISOString(),
      },
    ],
    createdAt: twoDaysAgo.toISOString(),
    updatedAt: now.toISOString(),
  });

  // Demo 5: Air freight (Air transport) - Dubai to New York
  db.trackingRequests.push({
    id: 'demo-air-001',
    trackingNumber: 'EK123456789AE',
    carrier: 'Emirates SkyCargo',
    status: 'IN_TRANSIT',
    origin: { city: 'Dubai', country: 'UAE', lat: 25.2048, lng: 55.2708 },
    destination: { city: 'New York', country: 'USA', lat: 40.7128, lng: -74.006 },
    distanceKm: 11000,
    durationHours: '2d 4h',
    currentLocation: { city: 'London', country: 'UK', lat: 51.5074, lng: -0.1278 },
    departureAt: yesterday.toISOString(),
    transportMode: 'air',
    sender: { name: 'Ahmed Al-Rashid', email: 'ahmed@dubai-export.ae', location: 'Dubai, UAE' },
    receiver: { name: 'John Smith', email: 'john@ny-business.com', phone: '+1 212 555 1234', address: '456 Fifth Avenue, New York, NY' },
    product: 'Luxury watches - Express shipment',
    shippingType: 'Air Freight Express',
    events: [
      {
        id: 'evt-air-001',
        status: 'INFO_RECEIVED',
        description: 'Cargo received at Dubai International Airport',
        location: 'Dubai, UAE',
        lat: 25.2048,
        lng: 55.2708,
        transportMode: 'air',
        timestamp: yesterday.toISOString(),
      },
      {
        id: 'evt-air-002',
        status: 'IN_TRANSIT',
        description: 'Flight departed Dubai - EK201',
        location: 'Dubai International (DXB)',
        lat: 25.2532,
        lng: 55.3657,
        transportMode: 'air',
        timestamp: new Date(yesterday.getTime() + 6 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'evt-air-003',
        status: 'IN_TRANSIT',
        description: 'Landed at London Heathrow - Customs clearance',
        location: 'London, UK',
        lat: 51.4700,
        lng: -0.4543,
        transportMode: 'air',
        timestamp: now.toISOString(),
      },
    ],
    createdAt: yesterday.toISOString(),
    updatedAt: now.toISOString(),
  });

  // Update stats
  db.stats.totalTrackingRequests = db.trackingRequests.length;
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

// --- Subscriptions & User Limits ---
export function getUserSubscription(userId) {
  return db.subscriptions.find(s => s.userId === userId) || { tier: 'free', expiresAt: null };
}

export function setUserSubscription(userId, tier, expiresAt = null) {
  const existingIndex = db.subscriptions.findIndex(s => s.userId === userId);
  const subscription = {
    userId,
    tier,
    expiresAt: expiresAt || null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  if (existingIndex >= 0) {
    db.subscriptions[existingIndex] = subscription;
  } else {
    db.subscriptions.push(subscription);
  }
  save(db);
  return subscription;
}

export function getUserPackageLimit(userId) {
  const subscription = getUserSubscription(userId);
  
  // Check if subscription is expired
  if (subscription.expiresAt && new Date(subscription.expiresAt) < new Date()) {
    return 2; // Free tier limit
  }
  
  const limits = {
    free: 2,
    starter: 5,
    basic: 10,
    pro: 25,
    business: 100,
    enterprise: Infinity,
  };
  
  return limits[subscription.tier] || 2;
}

export function getUserPackageCount(userId) {
  // Count packages created by this user (admin created packages don't count)
  return db.trackingRequests.filter(t => t.userId === userId).length;
}

export function canUserCreatePackage(userId) {
  const limit = getUserPackageLimit(userId);
  const current = getUserPackageCount(userId);
  return current < limit;
}

export function createTrackingRequestWithUser(data, userId) {
  if (!canUserCreatePackage(userId)) {
    throw new Error('PACKAGE_LIMIT_REACHED');
  }
  
  const req = {
    ...createTrackingRequest(data),
    userId, // Track which user created this package
  };
  
  return req;
}
