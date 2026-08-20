/**
 * Universal carrier detection engine  GlobalTrack.
 *
 * Inspired by the auto-detection strengths of 17TRACK, AfterShip and
 * Ship24: given any tracking number, detect the most likely carrier and
 * its operating region (USA / Canada / Europe) without any user input.
 *
 * Pure frontend heuristics  no backend dependency.
 */

export const REGIONS = {
  USA: 'USA',
  CANADA: 'CANADA',
  EUROPE: 'EUROPE',
  WORLDWIDE: 'WORLDWIDE',
}

/** Regional grouping used by the coverage section (USA / Canada / Europe). */
export const REGION_COVERAGE = [
  {
    id: 'USA',
    flag: '🇺🇸',
    carriers: ['UPS', 'FedEx', 'USPS', 'DHL Express'],
  },
  {
    id: 'CANADA',
    flag: '🇨🇦',
    carriers: ['Canada Post', 'Purolator', 'UPS', 'FedEx'],
  },
  {
    id: 'EUROPE',
    flag: '🇪🇺',
    carriers: ['DHL', 'La Poste / Colissimo', 'Royal Mail', 'DPD', 'GLS', 'PostNL'],
  },
]

/**
 * Carrier catalog. `patterns` are tested against the normalized number
 * (uppercased, spaces/dashes removed). `weight` ranks ambiguous matches:
 * higher = more specific format = more confident detection.
 */
export const CARRIERS = [
  {
    code: 'ups',
    name: 'UPS',
    region: REGIONS.USA,
    countries: ['United States', 'Canada', 'Worldwide'],
    patterns: [/^1Z[0-9A-Z]{16}$/],
    weight: 100,
    sample: '1Z999AA10123456784',
  },
  {
    code: 'fedex',
    name: 'FedEx',
    region: REGIONS.USA,
    countries: ['United States', 'Canada', 'Worldwide'],
    patterns: [/^DT\d{12,16}$/, /^\d{12}$/, /^\d{15}$/, /^\d{20}$/],
    weight: 80,
    sample: '9611020987654312345672',
  },
  {
    code: 'usps',
    name: 'USPS',
    region: REGIONS.USA,
    countries: ['United States'],
    patterns: [/^9[2-4]\d{20}$/, /^\d{22}$/, /^\d{20}$/],
    weight: 70,
    sample: '9400111899223197428490',
  },
  {
    code: 'canadapost',
    name: 'Canada Post',
    region: REGIONS.CANADA,
    countries: ['Canada'],
    patterns: [/^\d{16}$/],
    weight: 60,
    sample: '0115 9134 1763 7345',
  },
  {
    code: 'purolator',
    name: 'Purolator',
    region: REGIONS.CANADA,
    countries: ['Canada'],
    patterns: [/^[PQ]\d{11,15}$/, /^\d{12,13}$/],
    weight: 55,
    sample: 'P2A2B3C4D5E6F7',
  },
  {
    code: 'dhl',
    name: 'DHL',
    region: REGIONS.EUROPE,
    countries: ['Germany', 'Europe', 'Worldwide'],
    patterns: [/^\d{10}$/, /^\d{11}$/, /^JVGL\d{10}$/, /^GM\d{14,18}$/],
    weight: 75,
    sample: '1234567890',
  },
  {
    code: 'colissimo',
    name: 'La Poste / Colissimo',
    region: REGIONS.EUROPE,
    countries: ['France'],
    patterns: [/^6A\d{11}$/, /^[89][ADVX]\d{11}$/, /^\d{13}$/],
    weight: 65,
    sample: '6A12345678908',
  },
  {
    code: 'royalmail',
    name: 'Royal Mail',
    region: REGIONS.EUROPE,
    countries: ['United Kingdom'],
    patterns: [/^[A-HJ-NP-Z]{2}\d{9}GB$/, /^[A-Z]{2}\d{9}GB$/],
    weight: 95,
    sample: 'LN012345678GB',
  },
  {
    code: 'dpd',
    name: 'DPD',
    region: REGIONS.EUROPE,
    countries: ['Europe'],
    patterns: [/^0\d{13}$/, /^\d{14}$/],
    weight: 50,
    sample: '01234567890123',
  },
  {
    code: 'gls',
    name: 'GLS',
    region: REGIONS.EUROPE,
    countries: ['Europe'],
    patterns: [/^\d{11}$/],
    weight: 50,
    sample: '01234567890',
  },
  {
    code: 'postnl',
    name: 'PostNL',
    region: REGIONS.EUROPE,
    countries: ['Netherlands', 'Europe'],
    patterns: [/^3S[A-Z0-9]{10,16}$/, /^[J][HVTS]\d{12}$/, /^\d{16,20}$/],
    weight: 45,
    sample: '3SABCDEFGHIJKLMNOP',
  },
  {
    code: 'chinapost',
    name: 'China Post',
    region: REGIONS.WORLDWIDE,
    countries: ['China', 'Worldwide'],
    patterns: [],
    weight: 40,
    sample: 'RR458231096CN',
  },
];

/** Universal S10 postal format (XX123456789YY)  country code suffix. */
const S10_COUNTRY_SUFFIX = {
  US: 'usps',
  CA: 'canadapost',
  GB: 'royalmail',
  FR: 'colissimo',
  DE: 'dhl',
  NL: 'postnl',
  BE: 'dpd',
  CN: 'chinapost',
};

const S10_REGEX = /^([A-Z]{2})(\d{9})([A-Z]{2})$/

/** Normalize user input: uppercase, drop spaces/dashes, max 30 chars kept. */
export function normalizeTrackingNumber(input) {
  return String(input || '').toUpperCase().replace(/[\s-]+/g, '').slice(0, 30)
}

/**
 * Detect candidate carriers for a tracking number.
 * Returns [{ carrier, confidence }] sorted by confidence desc.
 */
export function detectCarriers(input) {
  const number = normalizeTrackingNumber(input)
  if (number.length < 6) return []

  const candidates = []

  // 1. Universal S10 postal format with country suffix → near-certain match.
  const s10 = number.match(S10_REGEX)
  if (s10) {
    const code = S10_COUNTRY_SUFFIX[s10[3]]
    const carrier = CARRIERS.find((c) => c.code === code)
    if (carrier) candidates.push({ carrier, confidence: 99 })
  }

  // 2. Carrier-specific pattern matching.
  for (const carrier of CARRIERS) {
    if (candidates.some((c) => c.carrier.code === carrier.code)) continue
    if (carrier.patterns.some((regex) => regex.test(number))) {
      candidates.push({ carrier, confidence: carrier.weight })
    }
  }

  return candidates.sort((a, b) => b.confidence - a.confidence)
}

/** Best single match or null (the Ship24-style "instant carrier detect"). */
export function detectCarrier(input) {
  const candidates = detectCarriers(input)
  return candidates.length > 0 ? candidates[0] : null
}

/** Region label for a tracking number, e.g. 'USA' | 'CANADA' | 'EUROPE'. */
export function detectRegion(input) {
  const best = detectCarrier(input)
  return best ? best.carrier.region : null
}

/** Parse a pasted block of tracking numbers (comma / newline / space separated). */
export function parseTrackingNumbers(text, limit = 50) {
  return String(text || '')
    .split(/[\n,;]+/)
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .slice(0, limit)
}
