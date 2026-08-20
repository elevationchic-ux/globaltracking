/**
 * Official carrier support / claim entry points (escalation links).
 * GlobalTrack never replaces the carrier: on exceptions we point users to the
 * official resolution channel, which turns the app into a problem-solving
 * assistant instead of a passive data viewer.
 */
export const CARRIER_CLAIM_URLS = {
  'DHL Express': 'https://www.dhl.com/global-en/home/support/tracking.html',
  DHL: 'https://www.dhl.com/global-en/home/support/tracking.html',
  FedEx: 'https://www.fedex.com/en-us/support.html',
  UPS: 'https://www.ups.com/us/en/support.page',
  USPS: 'https://faq.usps.com/s/',
  'Canada Post': 'https://www.canadapost-postescanada.ca/cpc/en/support.page',
  'Royal Mail': 'https://personal.help.royalmail.com/hc/en-gb',
  'La Poste / Colissimo': 'https://aide.laposte.fr/',
  DPD: 'https://www.dpd.com/int/en/support/',
  PostNL: 'https://www.postnl.nl/en/customer-service/',
  GLS: 'https://gls-group.eu/',
  'China Post': 'https://www.chinapost.com.cn/english/',
};

export const claimUrlFor = (carrierName) =>
  CARRIER_CLAIM_URLS[carrierName] || '/help';

/**
 * Official carrier tracking page URL templates.
 * Used by the "Verify on carrier website" button so users can cross-check
 * GlobalTrack data against the carrier's own system.
 * {{number}} is replaced with the tracking number at runtime.
 */
const CARRIER_TRACKING_URLS = {
  'DHL Express': 'https://www.dhl.com/global-en/home/tracking.html?tracking-id={{number}}',
  DHL: 'https://www.dhl.com/global-en/home/tracking.html?tracking-id={{number}}',
  FedEx: 'https://www.fedex.com/fedextrack/?trknbr={{number}}',
  UPS: 'https://www.ups.com/track?tracknum={{number}}',
  USPS: 'https://tools.usps.com/go/TrackConfirmAction?tLabels={{number}}',
  'Canada Post': 'https://www.canadapost-postescanada.ca/track-reperage/en#/search?searchFor={{number}}',
  'Royal Mail': 'https://www.royalmail.com/portal/rm/track?trackNumber={{number}}',
  'La Poste / Colissimo': 'https://www.laposte.fr/outils/suivre-vos-envois?code={{number}}',
  DPD: 'https://www.dpd.com/trackandtrace/?navi=trackAndTrace&parcelNumbers={{number}}',
  PostNL: 'https://postnl.nl/tracktrace/?B={{number}}',
  GLS: 'https://gls-group.eu/app/en/open-parcel-tracking?match={{number}}',
  'China Post': 'https://track.chinapost.com.cn/webpt.jsp?wb-tok={{number}}',
  Purolator: 'https://www.purolator.com/en/track?pin={{number}}',
};

export const trackingUrlFor = (carrierName, trackingNumber) => {
  const template = CARRIER_TRACKING_URLS[carrierName];
  if (!template || !trackingNumber) return '/help';
  return template.replace('{{number}}', encodeURIComponent(trackingNumber));
};
