/**
 * Haversine formula  calculates the great-circle distance between two
 * points on Earth given their latitude/longitude coordinates.
 * Also estimates transit duration based on average cargo speeds.
 */

const EARTH_RADIUS_KM = 6371;

function toRad(deg) {
  return (deg * Math.PI) / 180;
}

/**
 * Calculate distance in km between two lat/lng points.
 * @param {{lat: number, lng: number}} from
 * @param {{lat: number, lng: number}} to
 * @returns {number} distance in km
 */
export function haversineDistance(from, to) {
  const dLat = toRad(to.lat - from.lat);
  const dLng = toRad(to.lng - from.lng);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(from.lat)) * Math.cos(toRad(to.lat)) *
    Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(EARTH_RADIUS_KM * c);
}

/**
 * Estimate transit duration based on distance and average cargo transport speed.
 * Average speeds by mode: air ~500 km/h effective (incl. handling), sea ~40 km/h, ground ~80 km/h.
 * We use a blended average of ~200 km/h effective (most international shipping is air+ground).
 * @param {number} distanceKm
 * @returns {number} estimated hours
 */
export function estimateDuration(distanceKm) {
  const EFFECTIVE_SPEED_KMH = 200; // blended air+ground average
  const HANDLING_OVERHEAD_H = 6; // customs, sorting, etc.
  return Math.round((distanceKm / EFFECTIVE_SPEED_KMH) + HANDLING_OVERHEAD_H);
}

/**
 * Format duration in hours to a human-readable string.
 * @param {number} hours
 * @returns {string} e.g. "2 days 4 hours"
 */
export function formatDuration(hours) {
  if (hours < 1) return `${Math.round(hours * 60)} min`;
  const days = Math.floor(hours / 24);
  const h = Math.round(hours % 24);
  if (days > 0) return `${days} day${days > 1 ? 's' : ''} ${h}h`;
  return `${h} hours`;
}
