import { CarrierAdapter } from './CarrierAdapter.js';

/**
 * Generic adapter that accepts any valid tracking number format.
 * Used as a fallback when no specific carrier matches and no 17TRACK API is available.
 * Provides a placeholder response for unknown tracking numbers.
 */
export class GenericAdapter extends CarrierAdapter {
  get code() {
    return 'generic';
  }

  get name() {
    return 'Generic Carrier';
  }

  matches(trackingNumber) {
    // Accept any tracking number with 6-40 alphanumeric characters
    const trackingNumberPattern = /^[A-Za-z0-9-]{6,40}$/;
    return trackingNumberPattern.test(trackingNumber);
  }

  async track(trackingNumber) {
    // Return a placeholder response for unknown tracking numbers
    const shipment = {
      trackingNumber: trackingNumber,
      carrier: 'Unknown Carrier',
      currentStatus: 'INFO_RECEIVED',
      origin: {
        city: 'Unknown Origin',
        country: 'Unknown',
        lat: 0,
        lng: 0,
      },
      destination: {
        city: 'Unknown Destination',
        country: 'Unknown',
        lat: 0,
        lng: 0,
      },
      distanceKm: null,
      durationHours: null,
      transportMode: 'air',
      sender: null,
      receiver: null,
      product: null,
      shippingType: null,
      departureAt: new Date().toISOString(),
    };

    const events = [
      {
        shipmentId: trackingNumber,
        timestamp: new Date().toISOString(),
        location: 'Processing Center',
        lat: null,
        lng: null,
        transportMode: 'ground',
        statusDescription: 'Tracking information received',
        status: 'INFO_RECEIVED',
      },
    ];

    return { shipment, events };
  }
}