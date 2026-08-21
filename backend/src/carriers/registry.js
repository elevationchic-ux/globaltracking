import { AdminTrackingAdapter } from './AdminTrackingAdapter.js';
import { SeventeenTrackAdapter } from './SeventeenTrackAdapter.js';

/**
 * Carrier registry: single entry point used by the API layer.
 *
 * Adapters are tried in order; the first one whose `matches()` returns true
 * for the tracking number handles the request.
 *
 * Admin adapter is registered FIRST so that admin-created tracking numbers
 * always take priority over real carrier lookups.
 *
 * Production mode: with TRACKING_API_KEY set (17TRACK developer key), every
 * real tracking number is looked up against the 17TRACK aggregator API
 * (2,500+ official carriers).
 */
const adapters = [new AdminTrackingAdapter()];

if (process.env.TRACKING_API_KEY) {
  adapters.push(new SeventeenTrackAdapter(process.env.TRACKING_API_KEY));
}

export function registerAdapter(adapter) {
  adapters.push(adapter);
}

export function getAdapterForTrackingNumber(trackingNumber) {
  return adapters.find((adapter) => adapter.matches(trackingNumber)) ?? null;
}

export function getAdapterByCode(code) {
  return adapters.find((adapter) => adapter.code === code) ?? null;
}

export function listCarriers() {
  return adapters.map((adapter) => ({ code: adapter.code, name: adapter.name }));
}
