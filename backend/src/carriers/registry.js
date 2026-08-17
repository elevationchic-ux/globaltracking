import { MockCarrierAdapter } from './MockCarrierAdapter.js';

/**
 * Carrier registry: single entry point used by the API layer.
 *
 * To integrate a real carrier, implement a CarrierAdapter subclass
 * (see MockCarrierAdapter) and add an instance to the list below.
 * Adapters are tried in order; the first one whose `matches()` returns
 * true for the tracking number handles the request.
 */
const adapters = [new MockCarrierAdapter()];

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
