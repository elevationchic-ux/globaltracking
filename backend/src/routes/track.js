import { createHash } from 'node:crypto';
import { Router } from 'express';
import { getAdapterForTrackingNumber, listCarriers } from '../carriers/registry.js';

const router = Router();

const TRACKING_NUMBER_PATTERN = /^[A-Za-z0-9-]{6,40}$/;

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

export default router;
