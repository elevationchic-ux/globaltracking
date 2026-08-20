import { useState, useRef, useEffect } from 'react'
import { useI18n } from '../i18n/I18nContext.jsx'
import Icon from '../components/Icon.jsx'
import './ManifestPage.css'

/**
 * Professional shipment manifest modal.
 * Opens as an overlay, prints to PDF via browser, closable.
 */

const MANIFEST_DATA = {
  number: 'GT-20260821-0042',
  date: '2026-08-21',
  service: { en: 'Express Worldwide', fr: 'Express Mondial', es: 'Express Mundial', de: 'Express Weltweit' },
  weight: '2.4 kg',
  pieces: '1',
  dimensions: '42 \u00d7 30 \u00d7 18 cm',
  origin: { city: 'Paris', country: 'France', code: 'CDG' },
  destination: { city: 'New York', country: 'United States', code: 'JFK' },
  carrier: { name: 'DHL Express', chain: 'DHL \u2192 USPS (last mile)', trackingNumber: 'JD01482736451289' },
  shipper: { name: 'GlobalTrack Demo', address: '12 Rue de la Logistique, 75008 Paris' },
  consignee: { name: 'Package Recipient', address: '350 Fifth Avenue, New York, NY 10118' },
  events: [
    { time: '08:21', date: 'Aug 19', status: { en: 'Shipment picked up', fr: 'Colis pris en charge', es: 'Paquete recogido', de: 'Sendung abgeholt' }, location: 'Paris, FR', icon: 'package' },
    { time: '14:05', date: 'Aug 19', status: { en: 'Departed origin facility', fr: 'D\u00e9part du site d\u2019origine', es: 'Sali\u00f3 de la instalaci\u00f3n de origen', de: 'Abgang vom Ursprungsort' }, location: 'CDG Hub, FR', icon: 'rocket' },
    { time: '22:47', date: 'Aug 19', status: { en: 'In transit \u2014 international flight', fr: 'En transit \u2014 vol international', es: 'En tr\u00e1nsito \u2014 vuelo internacional', de: 'Unterwegs \u2014 internationaler Flug' }, location: 'Air freight', icon: 'globe' },
    { time: '06:12', date: 'Aug 20', status: { en: 'Arrived at destination hub', fr: 'Arriv\u00e9 au hub de destination', es: 'Lleg\u00f3 al hub de destino', de: 'Am Zielhub angekommen' }, location: 'JFK, US', icon: 'radar' },
    { time: '09:30', date: 'Aug 20', status: { en: 'Cleared customs', fr: 'D\u00e9douan\u00e9', es: 'Despachado en aduana', de: 'Zollabfertigung abgeschlossen' }, location: 'CBP New York', icon: 'shield-check' },
    { time: '11:45', date: 'Aug 20', status: { en: 'Out for delivery', fr: 'En cours de livraison', es: 'En reparto', de: 'In Zustellung' }, location: 'New York, US', icon: 'zap' },
  ],
  charges: [
    { label: { en: 'Shipping (Express)', fr: 'Exp\u00e9dition (Express)', es: 'Env\u00edo (Express)', de: 'Versand (Express)' }, amount: '\u20ac24.90' },
    { label: { en: 'Fuel surcharge', fr: 'Suppl\u00e9ment carburant', es: 'Suplemento de combustible', de: 'Kraftstoffzuschlag' }, amount: '\u20ac3.74' },
    { label: { en: 'Insurance', fr: 'Assurance', es: 'Seguro', de: 'Versicherung' }, amount: '\u20ac1.50' },
  ],
  total: '\u20ac30.14',
}

export default function ManifestPage() {
  const { locale, t } = useI18n()
  const [open, setOpen] = useState(false)
  const docRef = useRef(null)

  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') setOpen(false) }
    if (open) {
      document.addEventListener('keydown', onKey)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open])

  function handleDownload() { window.print() }
  const loc = (obj) => obj?.[locale] ?? obj?.en ?? ''

  return (
    <>
      <button className="manifest-trigger no-print" onClick={() => setOpen(true)}>
        <Icon name="file" size={16} />
        {t('manifest.documentTitle')}
      </button>

      {open && (
        <div className="manifest-overlay no-print" onClick={(e) => { if (e.target === e.currentTarget) setOpen(false) }}>
          <div className="manifest-modal" ref={docRef}>
            <div className="manifest-modal-toolbar">
              <button className="manifest-modal-close" onClick={() => setOpen(false)} aria-label="Close">
                <Icon name="x" size={20} />
              </button>
              <button className="manifest-modal-download" onClick={handleDownload}>
                <Icon name="file" size={15} />
                {t('manifest.downloadPdf')}
              </button>
            </div>

            <div className="manifest-doc">
              {/* ── Header ──────────────────────────────────────── */}
              <header className="manifest-header">
                <div className="manifest-header-left">
                  <svg viewBox="0 0 512 512" width="44" height="44" xmlns="http://www.w3.org/2000/svg">
                    <rect width="512" height="512" rx="112" fill="#050a18"/>
                    <g fill="none" stroke="#22d3ee" strokeWidth="22" strokeLinecap="round">
                      <circle cx="256" cy="256" r="140"/>
                      <ellipse cx="256" cy="256" rx="62" ry="140"/>
                      <path d="M126 208h260M126 304h260"/>
                    </g>
                    <g transform="rotate(-24 256 256)">
                      <ellipse cx="256" cy="256" rx="206" ry="72" fill="none" stroke="#38bdf8" strokeWidth="18" opacity="0.95"/>
                    </g>
                    <circle cx="446" cy="171" r="30" fill="#4ade80" stroke="#050a18" strokeWidth="10"/>
                  </svg>
                  <div>
                    <h1 className="manifest-brand">GLOBAL<span>TRACK</span></h1>
                    <p className="manifest-brand-sub">{t('manifest.documentTitle')}</p>
                  </div>
                </div>
                <div className="manifest-header-right">
                  <div className="manifest-meta-row">
                    <span className="manifest-meta-label">{t('manifest.manifestNo')}</span>
                    <span className="manifest-meta-value mono">{MANIFEST_DATA.number}</span>
                  </div>
                  <div className="manifest-meta-row">
                    <span className="manifest-meta-label">{t('manifest.dateIssued')}</span>
                    <span className="manifest-meta-value">{MANIFEST_DATA.date}</span>
                  </div>
                  <div className="manifest-meta-row">
                    <span className="manifest-meta-label">{t('manifest.serviceType')}</span>
                    <span className="manifest-meta-value">{loc(MANIFEST_DATA.service)}</span>
                  </div>
                </div>
              </header>

              {/* ── Route banner ────────────────────────────────── */}
              <div className="manifest-route-banner">
                <div className="manifest-route-point">
                  <span className="manifest-route-code">{MANIFEST_DATA.origin.code}</span>
                  <span className="manifest-route-city">{MANIFEST_DATA.origin.city}</span>
                  <span className="manifest-route-country">{MANIFEST_DATA.origin.country}</span>
                </div>
                <div className="manifest-route-line">
                  <Icon name="chevron-right" size={16} />
                  <span className="manifest-route-label">{loc(MANIFEST_DATA.service)}</span>
                  <Icon name="chevron-right" size={16} />
                </div>
                <div className="manifest-route-point manifest-route-dest">
                  <span className="manifest-route-code">{MANIFEST_DATA.destination.code}</span>
                  <span className="manifest-route-city">{MANIFEST_DATA.destination.city}</span>
                  <span className="manifest-route-country">{MANIFEST_DATA.destination.country}</span>
                </div>
              </div>

              {/* ── Details grid ────────────────────────────────── */}
              <div className="manifest-details-grid">
                <div className="manifest-detail">
                  <span className="manifest-detail-label">{t('manifest.weight')}</span>
                  <span className="manifest-detail-value">{MANIFEST_DATA.weight}</span>
                </div>
                <div className="manifest-detail">
                  <span className="manifest-detail-label">{t('manifest.pieces')}</span>
                  <span className="manifest-detail-value">{MANIFEST_DATA.pieces}</span>
                </div>
                <div className="manifest-detail">
                  <span className="manifest-detail-label">{t('manifest.dimensions')}</span>
                  <span className="manifest-detail-value">{MANIFEST_DATA.dimensions}</span>
                </div>
                <div className="manifest-detail">
                  <span className="manifest-detail-label">{t('manifest.trackingNo')}</span>
                  <span className="manifest-detail-value mono">{MANIFEST_DATA.carrier.trackingNumber}</span>
                </div>
                <div className="manifest-detail">
                  <span className="manifest-detail-label">{t('manifest.carrierChain')}</span>
                  <span className="manifest-detail-value">{MANIFEST_DATA.carrier.chain}</span>
                </div>
                <div className="manifest-detail">
                  <span className="manifest-detail-label">{t('manifest.primaryCarrier')}</span>
                  <span className="manifest-detail-value">{MANIFEST_DATA.carrier.name}</span>
                </div>
              </div>

              {/* ── Shipper / Consignee ─────────────────────────── */}
              <div className="manifest-parties">
                <div className="manifest-party">
                  <h3 className="manifest-party-title">{t('manifest.shipper')}</h3>
                  <p className="manifest-party-name">{MANIFEST_DATA.shipper.name}</p>
                  <p className="manifest-party-addr">{MANIFEST_DATA.shipper.address}</p>
                </div>
                <div className="manifest-party">
                  <h3 className="manifest-party-title">{t('manifest.consignee')}</h3>
                  <p className="manifest-party-name">{MANIFEST_DATA.consignee.name}</p>
                  <p className="manifest-party-addr">{MANIFEST_DATA.consignee.address}</p>
                </div>
              </div>

              {/* ── Tracking timeline ───────────────────────────── */}
              <section className="manifest-timeline-section">
                <h2 className="manifest-section-title">{t('manifest.trackingHistory')}</h2>
                <div className="manifest-timeline">
                  {MANIFEST_DATA.events.map((evt, i) => (
                    <div key={i} className={`manifest-tl-item ${i === MANIFEST_DATA.events.length - 1 ? 'manifest-tl-active' : ''}`}>
                      <div className="manifest-tl-dot"><Icon name={evt.icon} size={14} /></div>
                      <div className="manifest-tl-content">
                        <div className="manifest-tl-header">
                          <span className="manifest-tl-status">{loc(evt.status)}</span>
                          <span className="manifest-tl-time">{evt.date} \u00b7 {evt.time}</span>
                        </div>
                        <span className="manifest-tl-location">{evt.location}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* ── Charges ─────────────────────────────────────── */}
              <section className="manifest-charges-section">
                <h2 className="manifest-section-title">{t('manifest.charges')}</h2>
                <table className="manifest-charges-table">
                  <thead>
                    <tr><th>{t('manifest.description')}</th><th>{t('manifest.amount')}</th></tr>
                  </thead>
                  <tbody>
                    {MANIFEST_DATA.charges.map((ch, i) => (
                      <tr key={i}><td>{loc(ch.label)}</td><td>{ch.amount}</td></tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="manifest-total-row"><td><strong>{t('manifest.total')}</strong></td><td><strong>{MANIFEST_DATA.total}</strong></td></tr>
                  </tfoot>
                </table>
              </section>

              {/* ── Legal footer ────────────────────────────────── */}
              <footer className="manifest-doc-footer">
                <p>{t('manifest.legalLine1')}</p>
                <p>{t('manifest.legalLine2')}</p>
                <p className="manifest-doc-gen">{t('manifest.footerLine2')} {new Date().toLocaleDateString(locale === 'fr' ? 'fr-FR' : locale === 'es' ? 'es-ES' : locale === 'de' ? 'de-DE' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
              </footer>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
