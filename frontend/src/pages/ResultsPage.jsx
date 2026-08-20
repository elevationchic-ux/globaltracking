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
import './ResultsPage.css'

const REGION_FLAGS = { USA: '🇺🇸', CANADA: '🇨🇦', EUROPE: '🇪🇺', WORLDWIDE: '🌍' }
const OVERRIDE_KEY = 'globaltrack:carrier-override'

function loadOverrides() {
  try {
    if (typeof window === 'undefined') return {};
    return JSON.parse(localStorage.getItem(OVERRIDE_KEY)) || {}
  } catch {
    return {}
  }
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
          <p>{state.error.message}</p>
          <Link to="/">{t('results.retry')}</Link>
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
          </section>

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
