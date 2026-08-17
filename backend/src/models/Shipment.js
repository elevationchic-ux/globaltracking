/**
 * Shipment model.
 *
 * Fields:
 * - trackingNumber: unique carrier tracking number
 * - carrier: carrier code (e.g. "ups", "dhl", "colissimo")
 * - currentStatus: one of SHIPMENT_STATUSES
 * - origin / destination: { city, country }
 */

export const SHIPMENT_STATUSES = Object.freeze([
  'PENDING',
  'INFO_RECEIVED',
  'IN_TRANSIT',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
  'EXCEPTION',
  'RETURNED',
]);

export function createShipment({
  trackingNumber,
  carrier,
  currentStatus = 'PENDING',
  origin,
  destination,
}) {
  if (!trackingNumber) throw new Error('trackingNumber is required');
  if (!carrier) throw new Error('carrier is required');
  if (!SHIPMENT_STATUSES.includes(currentStatus)) {
    throw new Error(`Invalid status: ${currentStatus}`);
  }
  return {
    trackingNumber,
    carrier,
    currentStatus,
    origin: origin ?? null,
    destination: destination ?? null,
  };
}
