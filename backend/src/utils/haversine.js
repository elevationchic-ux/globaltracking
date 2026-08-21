/**
 * Haversine formula  calculates the great-circle distance between two
 * points on Earth given their latitude/longitude coordinates.
 * Also estimates transit duration based on realistic cargo transport speeds
 * with margins for handling and customs.
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
 * Transport mode-specific speeds with realistic margins.
 * Speeds are effective averages including handling, customs, and transfer times.
 * Air: ~500 km/h effective speed + 6h margin for security/handling
 * Sea: ~40 km/h effective speed + 48h margin for port operations/customs
 * Ground: ~80 km/h effective speed + 12h margin for customs/delivery
 * Rail: ~60 km/h effective speed + 24h margin for rail operations
 */
const TRANSPORT_SPEEDS = {
  air: { speed: 500, margin: 6 }, // km/h + hours margin
  sea: { speed: 40, margin: 48 },
  ground: { speed: 80, margin: 12 },
  rail: { speed: 60, margin: 24 },
};

/**
 * Estimate transit duration based on distance and transport mode.
 * Uses realistic speed estimates with built-in margins for handling and customs.
 * @param {number} distanceKm
 * @param {string} transportMode - 'air', 'sea', 'ground', 'rail'
 * @returns {number} estimated hours
 */
export function estimateDuration(distanceKm, transportMode = 'air') {
  const config = TRANSPORT_SPEEDS[transportMode] || TRANSPORT_SPEEDS.air;
  const transitTime = distanceKm / config.speed;
  const totalTime = transitTime + config.margin;
  return Math.round(totalTime);
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
