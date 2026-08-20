import { CarrierAdapter } from './CarrierAdapter.js';

/**
 * Production adapter for the 17TRACK v4 API (https://api.17track.net).
 *
 * 17TRACK aggregates 2,500+ carriers worldwide behind one API key, which is
 * exactly the "certified aggregator" strategy: no scraping, official data.
 * Enable it by setting TRACKING_API_KEY in the environment (Vercel project
 * settings / .env). Without a key the registry falls back to the demo store.
 *
 * Flow per tracking number:
 *   1. GET /track/v4/gettrackinfo  (already registered numbers)
 *   2. on "number not registered" → POST /track/v4/register then retry once
 */

const API_BASE = 'https://api.17track.net/track/v4';
const REQUEST_TIMEOUT_MS = 9000;

// 17TRACK status vocabulary → GlobalTrack normalized status enum.
const STATUS_MAP = {
  NotFound: 'PENDING',
  NotCalled: 'PENDING',
  InfoReceived: 'INFO_RECEIVED',
  InTransit: 'IN_TRANSIT',
  OutForDelivery: 'OUT_FOR_DELIVERY',
  AttemptDelivery: 'OUT_FOR_DELIVERY',
  Delivered: 'DELIVERED',
  AvailableForPickup: 'OUT_FOR_DELIVERY',
  Exception: 'EXCEPTION',
  Expired: 'EXCEPTION',
  Undelivered: 'EXCEPTION',
};

const post = async (path, token, payload) => {
  const response = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      '17token': token,
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  if (!response.ok) {
    throw new Error(`17TRACK API error ${response.status} on ${path}`);
  }
  return response.json();
};

export class SeventeenTrackAdapter extends CarrierAdapter {
  constructor(token) {
    super();
    this.token = token;
  }

  get code() {
    return '17track';
  }

  get name() {
    return 'Global Carrier Network';
  }

  /** Universal fallback: any plausible tracking number is worth a real lookup. */
  matches(trackingNumber) {
    return /^[A-Z0-9]{7,40}$/i.test(trackingNumber);
  }

  async track(trackingNumber) {
    let info = await this.getTrackInfo(trackingNumber);

    // Not registered yet → register (auto-detects the carrier) and retry.
    if (info?.rejected?.some((r) => r.error?.code === -18010103 || r.number === trackingNumber)) {
      await post('/register', this.token, [{ number: trackingNumber }]);
      info = await this.getTrackInfo(trackingNumber);
    }

    const accepted = info?.accepted?.[0];
    const trackInfo = accepted?.track_info;
    if (!trackInfo) return null;

    return this.normalize(trackingNumber, accepted, trackInfo);
  }

  async getTrackInfo(trackingNumber) {
    const body = await post('/gettrackinfo', this.token, [{ number: trackingNumber }]);
    return body?.data ?? null;
  }

  normalize(trackingNumber, accepted, trackInfo) {
    const provider = (trackInfo.tracking?.providers ?? []).find(
      (p) => Array.isArray(p.events) && p.events.length > 0
    );
    const rawEvents = provider?.events ?? [];

    // 17TRACK returns events newest-first; the app expects oldest-first.
    const events = [...rawEvents]
      .sort((a, b) => (a.time_utc ?? 0) - (b.time_utc ?? 0))
      .map((event) => ({
        shipmentId: trackingNumber,
        timestamp: event.time_iso ?? new Date((event.time_utc ?? 0) * 1000).toISOString(),
        location: {
          city: event.address?.city || '',
          country: event.address?.country_iso2 || event.address?.country || '',
        },
        statusDescription: event.event ?? event.stage ?? 'Scan received',
        status: STATUS_MAP[trackInfo.latest_status?.status] ?? 'IN_TRANSIT',
      }));

    const firstEvent = events[0];
    const lastEvent = events[events.length - 1];

    return {
      shipment: {
        trackingNumber,
        carrier: accepted.carrier?.toString() ?? 'auto',
        currentStatus: STATUS_MAP[trackInfo.latest_status?.status] ?? 'PENDING',
        origin: {
          city: firstEvent?.location?.city || '',
          country: trackInfo.origin_country || firstEvent?.location?.country || '',
        },
        destination: {
          city: trackInfo.latest_location?.city || '',
          country: trackInfo.dest_country || lastEvent?.location?.country || '',
        },
      },
      events,
    };
  }
}
