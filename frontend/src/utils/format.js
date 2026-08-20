/**
 * Locale-aware formatting for GlobalTrack (L10n).
 *
 * - Distances: miles for US/UK visitors, kilometres elsewhere (browser locale).
 * - Dates/times: human formats per locale ("Aug 19, 2026, 2:30 PM" vs
 *   "19 août 2026, 16:30")  never the raw developer format.
 * - Timezones: event times are shown in the event's own timezone, with the
 *   visitor's local equivalent available via tooltip (formatInVisitorTz).
 */

/** BCP-47 tag used by Intl for the app's two locales. */
export const LOCALE_TAGS = { en: 'en-US', fr: 'fr-FR' }

/** Locale tag preferring the visitor's actual browser variant (en-CA, fr-CA…). */
export function browserTag(locale) {
  if (typeof navigator !== 'undefined' && navigator.language) {
    const nav = navigator.language
    const lang = nav.slice(0, 2).toLowerCase()
    if (lang === (locale || 'en')) return nav
  }
  return LOCALE_TAGS[locale] || LOCALE_TAGS.en
}

const MILES_LOCALES = /^(en-US|en-GB|en)$/i

/** Should distances be shown in miles for this visitor? */
export function usesMiles(locale) {
  const tag = browserTag(locale)
  return MILES_LOCALES.test(tag)
}

const KM_TO_MI = 0.621371

/** Format a kilometre value for the visitor: "5,837 km" or "3,627 mi". */
export function formatDistance(km, locale) {
  if (km == null || Number.isNaN(km)) return ''
  const tag = browserTag(locale)
  if (usesMiles(locale)) {
    return `${Math.round(km * KM_TO_MI).toLocaleString(tag)} mi`
  }
  return `${Math.round(km).toLocaleString(tag)} km`
}

/**
 * Parse the app's local datetime strings ("2026-08-15 09:00" or ISO) into a
 * Date interpreted in the given IANA timezone. Returns null when unparseable.
 */
export function parseInTz(value, timeZone) {
  if (!value) return null
  const iso = String(value).replace(' ', 'T')
  // Direct parse when the engine supports tz-qualified wall-clock strings.
  const probe = new Date(iso)
  if (!Number.isNaN(probe.getTime()) && iso.includes('T')) {
    // Re-anchor: treat the wall-clock components as occurring in `timeZone`.
    const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/)
    if (m && timeZone) {
      const asUtc = Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5])
      const offset = tzOffsetMinutes(asUtc, timeZone)
      if (offset !== null) return new Date(asUtc - offset * 60000)
    }
    return probe
  }
  return null
}

/** Offset (minutes) of an IANA timezone at a given instant, or null. */
function tzOffsetMinutes(utcMs, timeZone) {
  try {
    const dtf = new Intl.DateTimeFormat('en-US', {
      timeZone,
      hour12: false,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
    const parts = Object.fromEntries(
      dtf.formatToParts(new Date(utcMs)).map((p) => [p.type, p.value])
    )
    const asUtc = Date.UTC(
      +parts.year,
      +parts.month - 1,
      +parts.day,
      +parts.hour === 24 ? 0 : +parts.hour,
      +parts.minute,
      +parts.second
    )
    return Math.round((asUtc - utcMs) / 60000)
  } catch {
    return null
  }
}

const DATETIME_OPTS = { dateStyle: 'medium', timeStyle: 'short' }

/**
 * Human datetime in the event's own timezone, localized:
 * "Aug 19, 2026, 2:30 PM" / "19 août 2026, 16:30".
 * Falls back to the raw string when it is not a date ("Pending", "On hold").
 */
export function formatEventTime(value, locale, timeZone) {
  const date = parseInTz(value, timeZone)
  if (!date) return value || ''
  try {
    return new Intl.DateTimeFormat(browserTag(locale), {
      ...DATETIME_OPTS,
      timeZone,
    }).format(date)
  } catch {
    return new Intl.DateTimeFormat(browserTag(locale), DATETIME_OPTS).format(date)
  }
}

/** Same instant converted to the visitor's own timezone (for tooltips). */
export function formatInVisitorTz(value, locale, timeZone) {
  const date = parseInTz(value, timeZone)
  if (!date) return null
  return new Intl.DateTimeFormat(browserTag(locale), DATETIME_OPTS).format(date)
}

/** Short tz label for tooltips, e.g. "Europe/Paris" → "Paris". */
export function tzLabel(timeZone) {
  if (!timeZone) return ''
  return timeZone.split('/').pop().replace(/_/g, ' ')
}

/** Localized label for a status key used in the public pages. */
export function formatWeight(kg, locale) {
  if (kg == null) return ''
  const tag = browserTag(locale)
  if (usesMiles(locale)) return `${(kg * 2.20462).toFixed(1)} lb`
  return `${kg.toLocaleString(tag)} kg`
}
