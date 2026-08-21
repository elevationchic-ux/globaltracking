import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { fetchTracking } from '../api.js'
import { useI18n } from '../i18n/I18nContext.jsx'
import { detectCarrier, CARRIERS } from '../utils/carrierDetection.js'
import { setMeta, useJsonLd, SITE_ORIGIN } from '../utils/seo.js'
import { claimUrlFor, trackingUrlFor } from '../utils/carrierHelp.js'
import { Disclaimer, ReportButton } from '../components/TrustWidgets.jsx'
import SiteFooter from '../components/SiteFooter.jsx'
import Timeline from '../components/Timeline.jsx'
import Icon from '../components/Icon.jsx'
import './ResultsPage.css'

const REGION_FLAGS = { USA: '🇺🇸', CANADA: '🇨🇦', EUROPE: '🇪🇺', AFRICA: '🌍', LATIN_AMERICA: '🌎', ASIA_PACIFIC: '🌏', WORLDWIDE: '🌍' }
const OVERRIDE_KEY = 'globaltrack:carrier-override'
const FAVORITES_KEY = 'globaltrack:favorites'

function loadOverrides() {
  try {
    if (typeof window === 'undefined') return {};
    return JSON.parse(localStorage.getItem(OVERRIDE_KEY)) || {}
  } catch {
    return {}
  }
}

function loadFavorites() {
  try {
    if (typeof window === 'undefined') return []
    return JSON.parse(localStorage.getItem(FAVORITES_KEY)) || []
  } catch {
    return []
  }
}

function saveFavorites(list) {
  try {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(list.slice(0, 50)))
  } catch { /* ignore */ }
}

function formatPlace(place) {
  if (!place) return ''
  if (typeof place === 'string') return place
  return [place.city, place.country].filter(Boolean).join(', ')
}

export default function ResultsPage() {
  const { number } = useParams()
  const { t } = useI18n()
  const [result, setResult] = useState(null)
  const [favorites, setFavorites] = useState(loadFavorites)
  const isFavorite = favorites.some((f) => f.number === number)

  function toggleFavorite() {
    setFavorites((prev) => {
      const exists = prev.some((f) => f.number === number)
      let next
      if (exists) {
        next = prev.filter((f) => f.number !== number)
      } else {
        next = [
          { number, carrier: effectiveCarrier?.name ?? null, addedAt: Date.now() },
          ...prev,
        ]
      }
      saveFavorites(next)
      return next
    })
  }

  // Push notification toggle (PWA)
  const [pushEnabled, setPushEnabled] = useState(false)
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPushEnabled(Notification.permission === 'granted')
    }
  }, [])

  function togglePushNotifications() {
    if (!('Notification' in window)) return
    if (Notification.permission === 'granted') {
      setPushEnabled(false)
      try { localStorage.setItem('globaltrack:push', 'false') } catch {}
    } else if (Notification.permission !== 'denied') {
      Notification.requestPermission().then((perm) => {
        setPushEnabled(perm === 'granted')
        try { localStorage.setItem('globaltrack:push', perm === 'granted' ? 'true' : 'false') } catch {}
      })
    }
  }

  // Client-side carrier detection, with manual user correction persisted.
  const detected = useMemo(() => detectCarrier(number), [number])
  const [overrides, setOverrides] = useState(loadOverrides)
  const overrideCode = overrides[number] ?? null

  const effectiveCarrier = overrideCode
    ? CARRIERS.find((c) => c.code === overrideCode) ?? null
    : detected?.carrier ?? null

  function handleCarrierSelect(event) {
    const code = event.target.value || null
    setOverrides((prev) => {
      const next = { ...prev }
      if (code) next[number] = code
      else delete next[number]
      try {
        localStorage.setItem(OVERRIDE_KEY, JSON.stringify(next))
      } catch {
        /* ignore */
      }
      return next
    })
  }

  useEffect(() => {
    let cancelled = false
    fetchTracking(number)
      .then((data) => {
        if (!cancelled) setResult({ number, data, error: null })
      })
      .catch((error) => {
        if (!cancelled) setResult({ number, data: null, error })
      })
    return () => {
      cancelled = true
    }
  }, [number])

  const state =
    result && result.number === number
      ? { loading: false, data: result.data, error: result.error }
      : { loading: true, data: null, error: null }

  // Per-tracking SEO: each result page is its own indexable document.
  useEffect(() => {
    const carrierName = effectiveCarrier?.name ?? ''
    setMeta({
      title: carrierName
        ? `${number}  ${carrierName} tracking | GlobalTrack`
        : `${number}  package tracking | GlobalTrack`,
      description: `Live tracking for ${number}${carrierName ? ` (${carrierName})` : ''}: status, transit history and estimated delivery date.`,
      path: `/track/${encodeURIComponent(number)}`,
    })
  }, [number, effectiveCarrier])

  // Schema.org ParcelDelivery  lets Google understand the tracking result.
  const jsonLd = useMemo(() => {
    if (!state.data) return null
    return {
      '@context': 'https://schema.org',
      '@type': 'ParcelDelivery',
      trackingNumber: number,
      trackingUrl: `${SITE_ORIGIN}/track/${encodeURIComponent(number)}`,
      carrier: {
        '@type': 'Organization',
        name: effectiveCarrier?.name ?? state.data.carrier?.name,
      },
    }
  }, [state.data, number, effectiveCarrier])
  useJsonLd(jsonLd)

  return (
    <main className="results">
      <header className="results-header">
        <Link to="/" className="back-link">{t('results.newSearch')}</Link>
        <div className="results-header-actions">
          <button
            type="button"
            className={`favorite-button ${isFavorite ? 'is-favorite' : ''}`}
            onClick={toggleFavorite}
            title={isFavorite ? t('favorites.remove') : t('favorites.add')}
            aria-label={isFavorite ? t('favorites.remove') : t('favorites.add')}
          >
            {isFavorite ? '★' : '☆'}
          </button>
          {('Notification' in window) && (
            <button
              type="button"
              className={`push-button ${pushEnabled ? 'is-push-on' : ''}`}
              onClick={togglePushNotifications}
              title={pushEnabled ? t('push.disable') : t('push.enable')}
              aria-label={pushEnabled ? t('push.disable') : t('push.enable')}
            >
              {pushEnabled ? '🔔' : '🔕'}
            </button>
          )}
        </div>
        <h1 className="results-title">{t('results.title')}</h1>
        <p className="tracking-number">{number}</p>
        {effectiveCarrier && (
          <p className="detected-badge">
            ◉ {effectiveCarrier.name}
            <em>
              {REGION_FLAGS[effectiveCarrier.region]} {effectiveCarrier.region}
            </em>
            {overrideCode && <span className="detected-corrected">✓ {t('results.corrected')}</span>}
          </p>
        )}
        {effectiveCarrier && (
          <p className="verified-badge" title={t('results.verified')}>
            ✓ {t('results.verified')}
          </p>
        )}
        {!effectiveCarrier && !state.loading && (
          <div className="fraud-warning" role="alert">
            <strong>⚠ {t('results.fraud.title')}</strong>
            <p>{t('results.fraud.body')}</p>
          </div>
        )}
        <label className="carrier-select-row">
          <span>{t('results.correct')}</span>
          <select value={overrideCode ?? ''} onChange={handleCarrierSelect}>
            <option value="">{detected ? detected.carrier.name : ''}</option>
            {CARRIERS.filter((c) => c.code !== detected?.carrier?.code).map((c) => (
              <option key={c.code} value={c.code}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
      </header>

      {/* Anti-scam reassurance: independent tool + community reporting */}
      <Disclaimer />
      <div className="results-trust-row">
        <ReportButton trackingNumber={number} />
      </div>

      {state.loading && <p className="results-info">{t('results.loading')}</p>}

      {state.error && (
        <div className="results-error" role="alert">
          <div className="results-error-icon">
            <Icon name="alert-triangle" size={32} />
          </div>
          <h2 className="results-error-title">
            {state.error.status === 404
              ? t('error.notFound')
              : state.error.status >= 500 || state.error.message?.includes('Failed to fetch')
                ? t('error.network')
                : t('error.generic')}
          </h2>
          <p className="results-error-detail">
            {state.error.status === 404
              ? t('error.notFoundDetail')
              : state.error.status >= 500 || state.error.message?.includes('Failed to fetch')
                ? t('error.networkDetail')
                : state.error.message || t('error.genericDetail')}
          </p>
          <div className="results-error-number">
            <span className="results-error-label">Tracking #:</span>
            <code>{number}</code>
          </div>
          <div className="results-error-actions">
            <Link to="/" className="results-error-btn">
              <Icon name="search" size={16} />
              {t('results.retry')}
            </Link>
          </div>
        </div>
      )}

      {state.data && (
        <>
          <section className="shipment-card">
            <div className="shipment-row">
              <span className="shipment-label">{t('results.status')}</span>
              <span className={`status-badge status-${state.data.shipment.currentStatus}`}>
                {t(`status.${state.data.shipment.currentStatus}`)}
              </span>
            </div>
            <div className="shipment-row">
              <span className="shipment-label">{t('results.carrier')}</span>
              <span>{state.data.carrier.name}</span>
            </div>
            {state.data.shipment.transportMode && (
              <div className="shipment-row">
                <span className="shipment-label">{t('results.transportMode')}</span>
                <span className="transport-mode-badge">
                  {state.data.shipment.transportMode === 'air' ? '✈' : state.data.shipment.transportMode === 'sea' ? '🚢' : state.data.shipment.transportMode === 'rail' ? '🚂' : '🚛'}
                  {' '}{t(`admin.${state.data.shipment.transportMode}`) || state.data.shipment.transportMode}
                </span>
              </div>
            )}
            {effectiveCarrier && (
              <div className="shipment-row">
                <span className="shipment-label">{t('results.region')}</span>
                <span>
                  {REGION_FLAGS[effectiveCarrier.region]} {effectiveCarrier.region}
                </span>
              </div>
            )}
            <div className="shipment-row">
              <span className="shipment-label">{t('results.origin')}</span>
              <span>{formatPlace(state.data.shipment.origin)}</span>
            </div>
            <div className="shipment-row">
              <span className="shipment-label">{t('results.destination')}</span>
              <span>{formatPlace(state.data.shipment.destination)}</span>
            </div>
            {state.data.shipment.distanceKm && (
              <div className="shipment-row">
                <span className="shipment-label">{t('results.distance')}</span>
                <span>{state.data.shipment.distanceKm} km</span>
              </div>
            )}
            {state.data.shipment.durationHours && (
              <div className="shipment-row">
                <span className="shipment-label">{t('results.duration')}</span>
                <span>{state.data.shipment.durationHours}</span>
              </div>
            )}
          </section>

          {/* Shipment manifest: sender, receiver, product, shipping type */}
          {(state.data.shipment.sender || state.data.shipment.receiver || state.data.shipment.product || state.data.shipment.shippingType) && (
            <section className="shipment-card manifest-section">
              <h3 className="manifest-title">{t('results.manifest')}</h3>
              {state.data.shipment.sender && (state.data.shipment.sender.name || state.data.shipment.sender.location) && (
                <div className="shipment-row">
                  <span className="shipment-label">{t('results.sender')}</span>
                  <span>{state.data.shipment.sender.name || '-'}{state.data.shipment.sender.location ? ` · ${state.data.shipment.sender.location}` : ''}</span>
                </div>
              )}
              {state.data.shipment.receiver && (state.data.shipment.receiver.name || state.data.shipment.receiver.address) && (
                <div className="shipment-row">
                  <span className="shipment-label">{t('results.receiver')}</span>
                  <span>{state.data.shipment.receiver.name || '-'}{state.data.shipment.receiver.address ? ` · ${state.data.shipment.receiver.address}` : ''}</span>
                </div>
              )}
              {state.data.shipment.product && (
                <div className="shipment-row">
                  <span className="shipment-label">{t('results.product')}</span>
                  <span>{state.data.shipment.product}</span>
                </div>
              )}
              {state.data.shipment.shippingType && (
                <div className="shipment-row">
                  <span className="shipment-label">{t('results.shippingType')}</span>
                  <span>{state.data.shipment.shippingType}</span>
                </div>
              )}
            </section>
          )}

          <section className="timeline-section">
            <h2>{t('results.history')}</h2>
            <Timeline events={state.data.events} />
          </section>

          {/* Escalation: point to the official carrier resolution channel */}
          <div className="results-actions">
            <a
              className="official-help-link"
              href={claimUrlFor(effectiveCarrier?.name ?? state.data.carrier?.name)}
              target="_blank"
              rel="noopener noreferrer"
            >
              {t('results.officialHelp')} →
            </a>
            <a
              className="official-help-link verify-link"
              href={trackingUrlFor(
                effectiveCarrier?.name ?? state.data.carrier?.name,
                number,
              )}
              target="_blank"
              rel="noopener noreferrer"
            >
              {t('carrier.verify')} →
            </a>
          </div>
        </>
      )}

      <SiteFooter />
    </main>
  )
}
