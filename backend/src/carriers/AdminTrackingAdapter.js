import { CarrierAdapter } from './CarrierAdapter.js';
import { getTrackingRequests } from '../data/db.js';

/**
 * Adapter that bridges admin-created tracking requests into the public
 * tracking API.  Any tracking number created via the admin panel is
 * automatically discoverable by users who search for it.
 * 
 * This adapter now also accepts any tracking number format and returns
 * a placeholder response if the number doesn't exist in the database,
 * allowing users to see the tracking interface even for numbers
 * not yet added by admin.
 */
export class AdminTrackingAdapter extends CarrierAdapter {
  get code() {
    return 'admin';
  }

  get name() {
    return 'GlobalTrack Admin';
  }

  matches(trackingNumber) {
    // Match any tracking number format (6-40 alphanumeric characters)
    const trackingNumberPattern = /^[A-Za-z0-9-]{6,40}$/;
    if (!trackingNumberPattern.test(trackingNumber)) {
      return false;
    }
    
    // Check if it exists in our database
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
    
    if (!req) {
      // Return null so other adapters can try, or fall back to placeholder
      return null;
    }

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
      weight: req.weight ?? null,
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
