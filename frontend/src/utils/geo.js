/**
 * Real geospatial math  no hardcoded distances or durations.
 * Every figure shown in the UI (route length, transit estimates) is computed
 * from actual coordinates with the haversine great-circle formula.
 */

const EARTH_RADIUS_KM = 6371;

const toRad = (deg) => (deg * Math.PI) / 180;

/** Great-circle distance between {lat,lng} points, in kilometers. */
export function haversineKm(from, to) {
  const dLat = toRad(to.lat - from.lat);
  const dLng = toRad(to.lng - from.lng);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(from.lat)) * Math.cos(toRad(to.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(Math.min(1, a)));
}

/** Locale-aware distance label (miles for US visitors, km everywhere else). */
export function formatDistance(km, locale) {
  const prefersMiles =
    typeof navigator !== 'undefined' && /^en-(us|gb)$/i.test(navigator.language ?? '');
  const digits = km >= 100 ? 0 : 1;
  if (prefersMiles) {
    return `${(km * 0.621371).toLocaleString(locale, { maximumFractionDigits: digits })} mi`;
  }
  return `${km.toLocaleString(locale, { maximumFractionDigits: digits })} km`;
}

/**
 * Physically consistent transit estimate:
 *  - air freight: ~850 km/h cruise + fixed hub/customs handling time
 *  - ground/road: ~70 km/h average including driver rest windows
 */
export function estimateTransitHours(distanceKm, mode = 'air') {
  if (mode === 'air') return distanceKm / 850 + 5;
  return distanceKm / 70 + 2;
}

/** Human duration label, e.g. "≈ 9 h" or "≈ 2.4 days". */
export function formatDuration(hours, locale) {
  if (hours < 24) {
    return `≈ ${hours.toLocaleString(locale, { maximumFractionDigits: 1 })} h`;
  }
  return `≈ ${(hours / 24).toLocaleString(locale, { maximumFractionDigits: 1 })} d`;
}
