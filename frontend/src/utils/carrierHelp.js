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
  CARRIER_CLAIM_URLS[carrierName] || 'https://www.17track.net/en';
