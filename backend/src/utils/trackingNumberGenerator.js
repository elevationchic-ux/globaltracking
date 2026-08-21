import { randomBytes } from 'node:crypto';

/**
 * Generate a carrier-format tracking number.
 *
 * Each carrier has a recognizable number format.  When the admin creates a
 * shipment without specifying a tracking number, we generate one that matches
 * the selected carrier's pattern so the public detection engine recognizes it.
 */

const ALPHA = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const ALPHANUM = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';

function randDigits(n) {
  const bytes = randomBytes(n);
  let s = '';
  for (let i = 0; i < n; i++) s += bytes[i] % 10;
  return s;
}

function randAlpha(n) {
  const bytes = randomBytes(n);
  let s = '';
  for (let i = 0; i < n; i++) s += ALPHA[bytes[i] % 26];
  return s;
}

function randAlphanum(n) {
  const bytes = randomBytes(n);
  let s = '';
  for (let i = 0; i < n; i++) s += ALPHANUM[bytes[i] % ALPHANUM.length];
  return s;
}

const GENERATORS = {
  ups: () => '1Z' + randAlphanum(16),
  fedex: () => randDigits(15),
  usps: () => '94' + randDigits(20),
  canadapost: () => randDigits(16),
  purolator: () => 'P' + randAlphanum(1) + randDigits(11),
  dhl: () => randDigits(10),
  colissimo: () => '6A' + randDigits(11),
  royalmail: () => randAlpha(2) + randDigits(9) + 'GB',
  dpd: () => '0' + randDigits(13),
  gls: () => randDigits(11),
  postnl: () => '3S' + randAlphanum(14),
  chinapost: () => 'RR' + randDigits(9) + 'CN',
  postec: () => 'CM' + randDigits(10),
  nipost: () => randDigits(12),
  sapo: () => randAlpha(2) + randDigits(9) + 'ZA',
  'dhl africa': () => randDigits(10),
  correos: () => randAlpha(2) + randDigits(9) + 'MX',
  chilexpress: () => randDigits(12),
  servientrega: () => 'SE' + randDigits(10),
  correos_arg: () => randAlpha(2) + randDigits(9) + 'AR',
  ect: () => 'BR' + randDigits(9) + 'BR',
  japantpost: () => randAlpha(2) + randDigits(9) + 'JP',
  indiapost: () => randAlpha(2) + randDigits(9) + 'IN',
  auspost: () => randAlpha(2) + randDigits(9) + 'AU',
  singpost: () => randAlpha(2) + randDigits(9) + 'SG',
  koreapost: () => randAlpha(2) + randDigits(9) + 'KR',
};

/**
 * Map a carrier name (as entered by admin) to a generator key.
 * Tries exact match first, then substring match.
 */
function resolveGeneratorKey(carrier) {
  if (!carrier) return null;
  const lower = carrier.toLowerCase().trim();
  if (GENERATORS[lower]) return lower;
  // Substring match
  for (const key of Object.keys(GENERATORS)) {
    if (lower.includes(key) || key.includes(lower)) return key;
  }
  return null;
}

/**
 * Generate a tracking number for the given carrier name.
 * Falls back to GT + hex if the carrier is unknown.
 */
export function generateTrackingNumber(carrier) {
  const key = resolveGeneratorKey(carrier);
  if (key && GENERATORS[key]) {
    return GENERATORS[key]();
  }
  // Default fallback
  return 'GT' + randomBytes(5).toString('hex').toUpperCase();
}
