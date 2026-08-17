/**
 * TrackingEvent model.
 *
 * Fields:
 * - shipmentId: the tracking number of the parent shipment
 * - timestamp: ISO 8601 date string
 * - location: { city, country } or free-form string
 * - statusDescription: human-readable description of the step
 * - status: machine-readable status code (see SHIPMENT_STATUSES)
 */

export function createTrackingEvent({
  shipmentId,
  timestamp,
  location,
  statusDescription,
  status,
}) {
  if (!shipmentId) throw new Error('shipmentId is required');
  if (!timestamp) throw new Error('timestamp is required');
  return {
    shipmentId,
    timestamp: new Date(timestamp).toISOString(),
    location: location ?? null,
    statusDescription: statusDescription ?? '',
    status: status ?? null,
  };
}
