import { createHash } from 'node:crypto';
import { Router } from 'express';
import { getAdapterForTrackingNumber, listCarriers } from '../carriers/registry.js';
import { getTrackingRequests, getUserSubscription, getUserPackageLimit, getUserPackageCount } from '../data/db.js';

const router = Router();

const TRACKING_NUMBER_PATTERN = /^[A-Za-z0-9-]{6,40}$/;

/**
 * Parse duration string like "2d 12h" into hours
 */
function parseDuration(durationStr) {
  if (!durationStr) return 0;
  let totalHours = 0;
  
  // Parse days
  const daysMatch = durationStr.match(/(\d+)\s*day[s]?/i);
  if (daysMatch) {
    totalHours += parseInt(daysMatch[1]) * 24;
  }
  
  // Parse hours
  const hoursMatch = durationStr.match(/(\d+)\s*h/);
  if (hoursMatch) {
    totalHours += parseInt(hoursMatch[1]);
  }
  
  // Parse minutes
  const minutesMatch = durationStr.match(/(\d+)\s*min/);
  if (minutesMatch) {
    totalHours += parseInt(minutesMatch[1]) / 60;
  }
  
  return totalHours;
}

/**
 * Aggressive status cache (Redis-style, in-memory here).
 * Carrier APIs are slow and rate-limited: 10 people checking the same number
 * within 15 minutes must all hit the cache (<1 ms), not the carrier API.
 * Swap the Map for a Redis client in production without changing the contract.
 */
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes
const cache = new Map();

const getCached = (key) => {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return entry.body;
};

const setCached = (key, body) => {
  cache.set(key, { expiresAt: Date.now() + CACHE_TTL_MS, body });
};

router.get('/carriers', (_req, res) => {
  res.json({ carriers: listCarriers() });
});

/**
 * Public endpoint: return all admin-created tracking requests in a
 * globe-friendly format.  No auth required (visitor-facing globe).
 * Cached with a 30-second TTL to avoid hammering the data store.
 */
const SHIPMENTS_CACHE_TTL = 30 * 1000;
let shipmentsCache = { body: null, expiresAt: 0 };

router.get('/shipments', (_req, res) => {
  if (shipmentsCache.body && Date.now() < shipmentsCache.expiresAt) {
    return res.json(shipmentsCache.body);
  }
  const requests = getTrackingRequests();
  const shipments = requests.map((req) => {
    // Calculate ETA if departure time and duration are available
    let estimatedArrival = null;
    if (req.departureAt && req.durationHours) {
      try {
        const departure = new Date(req.departureAt);
        const durationHours = parseDuration(req.durationHours);
        const arrival = new Date(departure.getTime() + durationHours * 60 * 60 * 1000);
        estimatedArrival = arrival.toISOString();
      } catch {
        // If parsing fails, leave as null
      }
    }

    return {
      id: req.id,
      trackingNumber: req.trackingNumber,
      status: statusToGlobe(req.status),
      originCarrier: req.carrier || 'Unknown',
      finalCarrier: req.carrier || 'Unknown',
      service: req.shippingType || 'Standard',
      weight: req.weight || null,
      pieces: 1,
      from: {
        name: req.origin?.city || 'Unknown',
        lat: req.origin?.lat || 0,
        lng: req.origin?.lng || 0,
        tz: 'UTC',
      },
      to: {
        name: req.destination?.city || 'Unknown',
        lat: req.destination?.lat || 0,
        lng: req.destination?.lng || 0,
        tz: 'UTC',
      },
      mode: req.transportMode || 'air',
      transportMode: modeLabel(req.transportMode),
      elapsedTime: null,
      distanceKm: req.distanceKm || null,
      estimatedArrival: estimatedArrival,
      progress: computeProgress(req),
      timeline: (req.events || []).map((evt) => ({
        label: evt.description || evt.status || 'Event',
        completed: isEventCompleted(evt.status),
        time: evt.timestamp || 'Pending',
        tz: 'UTC',
      })),
      sender: req.sender || null,
      receiver: req.receiver || null,
      product: req.product || null,
      shippingType: req.shippingType || null,
      agent: { name: 'GlobalTrack', role: 'Admin', status: 'Online' },
    };
  });
  shipmentsCache = { body: { shipments }, expiresAt: Date.now() + SHIPMENTS_CACHE_TTL };
  res.json(shipmentsCache.body);
});

function statusToGlobe(s) {
  const map = {
    INFO_RECEIVED: 'PENDING',
    IN_TRANSIT: 'IN TRANSIT',
    OUT_FOR_DELIVERY: 'OUT FOR DELIVERY',
    DELIVERED: 'DELIVERED',
    EXCEPTION: 'EXCEPTION',
    RETURNED: 'EXCEPTION',
  };
  return map[s] || s;
}

function modeLabel(mode) {
  const map = { air: 'Air Freight', ground: 'Ground Express', sea: 'Sea Freight', rail: 'Rail Freight' };
  return map[mode] || 'Air Freight';
}

function computeProgress(req) {
  const events = req.events || [];
  if (events.length === 0) return 0;
  const completed = events.filter((e) => isEventCompleted(e.status)).length;
  return Math.round((completed / Math.max(events.length, 1)) * 100);
}

function isEventCompleted(status) {
  return status === 'DELIVERED' || status === 'OUT_FOR_DELIVERY' || status === 'IN_TRANSIT';
}

router.get('/track/:number', async (req, res, next) => {
  try {
    const trackingNumber = req.params.number.trim().toUpperCase();

    if (!TRACKING_NUMBER_PATTERN.test(trackingNumber)) {
      return res.status(400).json({
        error: 'INVALID_TRACKING_NUMBER',
        message: 'Le numéro de suivi est invalide.',
      });
    }

    const adapter = getAdapterForTrackingNumber(trackingNumber);
    if (!adapter) {
      return res.status(404).json({
        error: 'SHIPMENT_NOT_FOUND',
        message: 'Aucun colis trouvé pour ce numéro de suivi.',
      });
    }

    // Cache hit → serve instantly (X-Cache: HIT), no carrier API call.
    let body = getCached(trackingNumber);
    const cacheStatus = body ? 'HIT' : 'MISS';

    if (!body) {
      const result = await adapter.track(trackingNumber);
      if (!result) {
        return res.status(404).json({
          error: 'SHIPMENT_NOT_FOUND',
          message: 'Aucun colis trouvé pour ce numéro de suivi.',
        });
      }
      body = {
        carrier: { code: adapter.code, name: adapter.name },
        shipment: result.shipment,
        events: result.events,
      };
      setCached(trackingNumber, body);
    }

    const etag = `"${createHash('md5').update(JSON.stringify(body)).digest('hex')}"`;
    if (req.headers['if-none-match'] === etag) {
      res.set('ETag', etag);
      return res.status(304).end();
    }

    res
      .set('ETag', etag)
      .set('Cache-Control', 'public, max-age=300, stale-while-revalidate=600')
      .set('X-Cache', cacheStatus)
      .json(body);
  } catch (error) {
    next(error);
  }
});

// --- User subscription info (public endpoint for frontend) ---
router.get('/user/subscription', (req, res) => {
  // For demo purposes, return free tier info
  // In production, this would require authentication and return the real user's subscription
  const demoSubscription = {
    subscription: {
      tier: 'free',
      expiresAt: null,
    },
    packageLimit: 2,
    packageCount: 0,
    canCreateMore: true,
  };
  res.json(demoSubscription);
});

export default router;
