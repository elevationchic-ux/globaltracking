import { createShipment } from '../models/Shipment.js';
import { createTrackingEvent } from '../models/TrackingEvent.js';

/**
 * In-memory data store with seed data for local development.
 * Swap for a real database (PostgreSQL, etc.) in production.
 */

const shipments = new Map();
const eventsByShipment = new Map();

function seed(shipmentInput, eventInputs) {
  const shipment = createShipment(shipmentInput);
  shipments.set(shipment.trackingNumber, shipment);
  eventsByShipment.set(
    shipment.trackingNumber,
    eventInputs.map((event) =>
      createTrackingEvent({ shipmentId: shipment.trackingNumber, ...event })
    )
  );
}

seed(
  {
    trackingNumber: 'DEMO123456789',
    carrier: 'demo',
    currentStatus: 'IN_TRANSIT',
    origin: { city: 'Paris', country: 'FR' },
    destination: { city: 'Cotonou', country: 'BJ' },
  },
  [
    {
      timestamp: '2026-08-12T09:15:00Z',
      location: { city: 'Paris', country: 'FR' },
      statusDescription: 'Colis pris en charge par le transporteur',
      status: 'INFO_RECEIVED',
    },
    {
      timestamp: '2026-08-13T14:40:00Z',
      location: { city: 'Roissy CDG', country: 'FR' },
      statusDescription: 'Départ du centre de tri international',
      status: 'IN_TRANSIT',
    },
    {
      timestamp: '2026-08-15T08:05:00Z',
      location: { city: 'Cotonou', country: 'BJ' },
      statusDescription: 'Arrivée dans le pays de destination',
      status: 'IN_TRANSIT',
    },
  ]
);

seed(
  {
    trackingNumber: 'DEMO987654321',
    carrier: 'demo',
    currentStatus: 'DELIVERED',
    origin: { city: 'Lyon', country: 'FR' },
    destination: { city: 'Abidjan', country: 'CI' },
  },
  [
    {
      timestamp: '2026-08-01T10:00:00Z',
      location: { city: 'Lyon', country: 'FR' },
      statusDescription: 'Colis pris en charge par le transporteur',
      status: 'INFO_RECEIVED',
    },
    {
      timestamp: '2026-08-03T16:20:00Z',
      location: { city: 'Marseille', country: 'FR' },
      statusDescription: 'En transit vers le hub international',
      status: 'IN_TRANSIT',
    },
    {
      timestamp: '2026-08-06T09:45:00Z',
      location: { city: 'Abidjan', country: 'CI' },
      statusDescription: 'Arrivée au centre de distribution local',
      status: 'IN_TRANSIT',
    },
    {
      timestamp: '2026-08-07T08:30:00Z',
      location: { city: 'Abidjan', country: 'CI' },
      statusDescription: 'En cours de livraison',
      status: 'OUT_FOR_DELIVERY',
    },
    {
      timestamp: '2026-08-07T13:10:00Z',
      location: { city: 'Abidjan', country: 'CI' },
      statusDescription: 'Colis livré au destinataire',
      status: 'DELIVERED',
    },
  ]
);

export function getShipment(trackingNumber) {
  return shipments.get(trackingNumber);
}

export function getEventsForShipment(trackingNumber) {
  const events = eventsByShipment.get(trackingNumber) ?? [];
  return [...events].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );
}
