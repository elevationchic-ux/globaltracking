import { CarrierAdapter } from './CarrierAdapter.js';
import { getTrackingRequests } from '../data/db.js';

/**
 * Adapter that bridges admin-created tracking requests into the public
 * tracking API.  Any tracking number created via the admin panel is
 * automatically discoverable by users who search for it.
 */
export class AdminTrackingAdapter extends CarrierAdapter {
  get code() {
    return 'admin';
  }

  get name() {
    return 'GlobalTrack Admin';
  }

  matches(trackingNumber) {
    const requests = getTrackingRequests();
    return requests.some(
      (r) => r.trackingNumber?.toUpperCase() === trackingNumber.toUpperCase()
    );
  }

  async track(trackingNumber) {
    const requests = getTrackingRequests();
    const req = requests.find(
      (r) => r.trackingNumber?.toUpperCase() === trackingNumber.toUpperCase()
    );
    if (!req) return null;

    const shipment = {
      trackingNumber: req.trackingNumber,
      carrier: req.carrier,
      currentStatus: req.status,
      origin: req.origin ?? null,
      destination: req.destination ?? null,
      distanceKm: req.distanceKm ?? null,
      durationHours: req.durationHours ?? null,
      transportMode: req.transportMode ?? 'air',
      sender: req.sender ?? null,
      receiver: req.receiver ?? null,
      product: req.product ?? null,
      shippingType: req.shippingType ?? null,
      departureAt: req.departureAt ?? null,
    };

    const events = (req.events || []).map((evt) => ({
      shipmentId: req.trackingNumber,
      timestamp: evt.timestamp,
      location: evt.location ?? null,
      lat: evt.lat ?? null,
      lng: evt.lng ?? null,
      transportMode: evt.transportMode ?? null,
      statusDescription: evt.description || evt.status || '',
      status: evt.status || req.status,
    }));

    return { shipment, events };
  }
}
