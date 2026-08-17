import { CarrierAdapter } from './CarrierAdapter.js';
import { getShipment, getEventsForShipment } from '../data/store.js';

/**
 * Demo adapter backed by the in-memory store.
 * Serves as a template for real carrier integrations: replace the store
 * lookups with HTTP calls to the carrier API and map the response into
 * the normalized { shipment, events } shape.
 */
export class MockCarrierAdapter extends CarrierAdapter {
  get code() {
    return 'demo';
  }

  get name() {
    return 'Demo Carrier';
  }

  matches(trackingNumber) {
    return getShipment(trackingNumber) !== undefined;
  }

  async track(trackingNumber) {
    const shipment = getShipment(trackingNumber);
    if (!shipment) return null;
    const events = getEventsForShipment(trackingNumber);
    return { shipment, events };
  }
}
