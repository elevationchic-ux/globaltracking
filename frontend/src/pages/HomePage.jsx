import { useMemo, useRef, useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useI18n, LanguageSwitcher } from '../i18n/I18nContext.jsx'
import WorldClock from '../components/WorldClock.jsx'
import {
  detectCarriers,
  parseTrackingNumbers,
  normalizeTrackingNumber,
  REGION_COVERAGE,
} from '../utils/carrierDetection.js'
import './HomePage.css'

const REGION_FLAGS = { USA: '🇺🇸', CANADA: '🇨🇦', EUROPE: '🇪🇺', AFRICA: '🌍', LATIN_AMERICA: '🌎', ASIA_PACIFIC: '🌏', WORLDWIDE: '🌍' }

const STATS = [
  { value: '2,400+', key: 'stats.carriers' },
  { value: '190+', key: 'stats.countries' },
  { value: '<2s', key: 'stats.realtime' },
  { value: '99.2%', key: 'stats.accuracy' },
]

const FEATURES = [
  { icon: '⚡', title: 'features.autoDetect.title', text: 'features.autoDetect.text' },
  { icon: '🗂️', title: 'features.batch.title', text: 'features.batch.text' },
  { icon: '🌐', title: 'features.timeline.title', text: 'features.timeline.text' },
  { icon: '🛰️', title: 'features.regions.title', text: 'features.regions.text' },
  { icon: '🚀', title: 'features.speed.title', text: 'features.speed.text' },
  { icon: '⏱️', title: 'features.precision.title', text: 'features.precision.text' },
]

const FAQS = [
  { q: 'faq.q1', a: 'faq.a1' },
  { q: 'faq.q2', a: 'faq.a2' },
  { q: 'faq.q3', a: 'faq.a3' },
  { q: 'faq.q4', a: 'faq.a4' },
]

// Above-the-fold institutional reassurance: real carrier networks + security.
// Logos are bundled locally (public/logos) so they render instantly and never
// depend on a third-party CDN; if one ever fails, the chip shows the name text.
const TRUST_CARRIERS = [
  { name: 'DHL', logo: '/logos/dhl.png' },
  { name: 'UPS', logo: '/logos/ups.png' },
  { name: 'FedEx', logo: '/logos/fedex.png' },
  { name: 'USPS', logo: '/logos/usps.png' },
  { name: 'Canada Post', logo: '/logos/canadapost.png' },
  { name: 'Royal Mail', logo: '/logos/royalmail.png' },
  { name: 'Colissimo', logo: '/logos/laposte.png' },
  { name: 'DPD', logo: '/logos/dpd.png' },
  { name: 'PostNL', logo: '/logos/postnl.png' },
  { name: 'GLS', logo: '/logos/gls.png' },
]

const RECENT_KEY = 'globaltrack:recent'

function loadRecent() {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY)) || []
  } catch {
    return []
  }
}

function saveRecent(number) {
  try {
    const list = loadRecent().filter((n) => n !== number)
    list.unshift(number)
    localStorage.setItem(RECENT_KEY, JSON.stringify(list.slice(0, 8)))
  } catch { /* ignore */ }
}

export default function HomePage() {
  const { t } = useI18n()
  const [input, setInput] = useState('')
  const navigate = useNavigate()
  const [recent, setRecent] = useState(loadRecent)

  const numbers = useMemo(() => parseTrackingNumbers(input), [input])
  const primary = numbers[0] ?? ''

  // Live auto-detection on the primary number (instant carrier detect).
  const candidates = useMemo(() => detectCarriers(primary), [primary])
  const detection = candidates[0] ?? null

  const queue = useMemo(
    () =>
      numbers.map((num) => {
        const best = detectCarriers(num)[0]
        return {
          number: normalizeTrackingNumber(num),
          carrier: best?.carrier ?? null,
        }
      }),
    [numbers],
  )

  function handleSubmit(event) {
    event.preventDefault()
    if (primary) {
      saveRecent(normalizeTrackingNumber(primary))
      setRecent(loadRecent())
      navigate(`/track/${encodeURIComponent(normalizeTrackingNumber(primary))}`)
    }
  }

  // Barcode scan via camera (BarcodeDetector API on supported mobile browsers).
  // Falls back to a file <input type="file" accept="image/*"> for older browsers.
  const scanRef = useRef(null)
  const [scanning, setScanning] = useState(false)

  async function handleBarcodeScan() {
    // If the browser supports BarcodeDetector natively, use the camera directly.
    if ('BarcodeDetector' in window) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
        setScanning(true)
        const video = document.createElement('video')
        video.srcObject = stream
        video.setAttribute('playsinline', '')
        await video.play()
        const detector = new window.BarcodeDetector({ formats: ['code_128', 'code_39', 'ean_13', 'ean_8', 'qr_code', 'itf'] })
        // Scan frames until we find a barcode or 8 seconds elapse.
        const deadline = Date.now() + 8000
        let found = null
        while (Date.now() < deadline && !found) {
          try {
            const barcodes = await detector.detect(video)
            if (barcodes.length > 0) found = barcodes[0].rawValue
          } catch { /* frame decode failure, retry */ }
          await new Promise((r) => setTimeout(r, 200))
        }
        stream.getTracks().forEach((t) => t.stop())
        setScanning(false)
        if (found) {
          setInput((prev) => (prev ? prev + '\n' + found : found))
        }
      } catch {
        setScanning(false)
        // Camera permission denied or API error → fall back to file picker.
        scanRef.current?.click()
      }
    } else {
      // No BarcodeDetector → use image file picker as fallback.
      scanRef.current?.click()
    }
  }

  function handleScanFile(event) {
    const file = event.target.files?.[0]
    if (!file || !('BarcodeDetector' in window)) return
    const img = new Image()
    img.onload = async () => {
      try {
        const detector = new window.BarcodeDetector()
        const barcodes = await detector.detect(img)
        if (barcodes.length > 0) {
          setInput((prev) => (prev ? prev + '\n' + barcodes[0].rawValue : barcodes[0].rawValue))
        }
      } catch { /* decode failure */ }
    }
    img.src = URL.createObjectURL(file)
    event.target.value = ''
  }

  // CSV import (bulk): first column of each row is treated
  // as a tracking number; header rows are skipped.
  const fileRef = useRef(null)
  function handleCsvImport(event) {
    const file = event.target.files?.[0]
    if (!file) return
    file.text().then((text) => {
      const rows = text
        .split(/[\r\n]+/)
        .map((line) => line.split(/[;,\t]/)[0].trim())
        .filter((v) => v && !/^(tracking|number|#)/i.test(v))
      if (rows.length > 0) {
        setInput((prev) => [prev, ...rows].filter(Boolean).join('\n'))
      }
    })
    event.target.value = ''
  }

  return (
    <div className="home-shell">
      <nav className="home-nav" aria-label="Main">
        <span className="home-logo">GLOBAL<span>TRACK</span></span>
        <div className="home-nav-right">
          <LanguageSwitcher />
          <Link to="/global" className="nav-mission">{t('nav.missionControl')} ↗</Link>
        </div>
      </nav>

      <main className="home">
        {/* ── Hero ─────────────────────────────────────────────────────── */}
        <section className="hero">
          <p className="hero-badge">{t('hero.badge')}</p>
          <h1 className="hero-title">{t('hero.title')}</h1>
          <p className="hero-subtitle">{t('hero.subtitle')}</p>

          {/* Social proof: reassurance before the user pastes sensitive data */}
          <div className="social-proof-strip" aria-label={t('social.title')}>
            <span className="social-proof-item">
              <span className="social-proof-icon">🔒</span>
              <span>{t('social.encryption')}</span>
            </span>
            <span className="social-proof-item">
              <span className="social-proof-icon">⭐</span>
              <span>{t('social.users')}</span>
            </span>
            <span className="social-proof-item">
              <span className="social-proof-icon">🏢</span>
              <span>{t('social.carriers')}</span>
            </span>
          </div>

          <form className="search-form" onSubmit={handleSubmit}>
            <div className="search-input-row">
              <textarea
                className="search-input"
                rows="2"
                placeholder={t('hero.placeholder')}
                value={input}
                onChange={(event) => setInput(event.target.value)}
                aria-label={t('hero.title')}
                inputMode="text"
                autoCapitalize="characters"
                spellCheck="false"
                autoFocus
              />
              <button
                type="button"
                className="scan-button"
                onClick={handleBarcodeScan}
                title={t('scan.title')}
                aria-label={t('scan.title')}
                disabled={scanning}
              >
                {scanning ? '⏳' : '📷'}
              </button>
              {/* Hidden file inputs for barcode scan fallback */}
              <input
                ref={scanRef}
                type="file"
                accept="image/*"
                capture="environment"
                style={{ display: 'none' }}
                onChange={handleScanFile}
              />
            </div>
            <button className="search-button" type="submit" disabled={!primary}>
              {t('hero.cta')}
            </button>
          </form>

          <p className="search-hint">
            {t('hero.hint')}
            <button type="button" className="csv-button" onClick={() => fileRef.current?.click()}>
              📄 {t('hero.csv')}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept=".csv,.txt,text/csv,text/plain"
              className="csv-file-input"
              onChange={handleCsvImport}
            />
          </p>

          {/* Recent searches (local, private) */}
          {recent.length > 0 && (
            <div className="recent-searches">
              <p className="recent-title">{t('recent.title')}</p>
              <div className="recent-chips">
                {recent.map((num) => (
                  <button
                    key={num}
                    type="button"
                    className="recent-chip"
                    onClick={() => {
                      navigate(`/track/${encodeURIComponent(num)}`)
                    }}
                  >
                    <code>{num}</code>
                  </button>
                ))}
                <button
                  type="button"
                  className="recent-clear"
                  onClick={() => {
                    try { localStorage.removeItem(RECENT_KEY) } catch {}
                    setRecent([])
                  }}
                  aria-label={t('recent.clear')}
                >
                  ×
                </button>
              </div>
            </div>
          )}

          {/* Live carrier detection readout */}
          <div className="detect-readout" aria-live="polite">
            {detection ? (
              <span className="detect-chip detect-hit">
                ◉ {t('hero.detected')}: <strong>{detection.carrier.name}</strong>
                <em> {REGION_FLAGS[detection.carrier.region]} {detection.carrier.region}</em>
                {candidates.length > 1 && (
                  <span className="detect-alts">
                    {candidates.slice(1, 3).map((c) => c.carrier.name).join(' · ')}
                  </span>
                )}
              </span>
            ) : (
              <span className="detect-chip detect-idle">◇ {t('hero.unknown')}</span>
            )}
          </div>

          {/* Above-the-fold trust: official networks + security signals */}
          <div className="trust-strip" aria-label={t('home.carrierTrust')}>
            <p className="trust-strip-title">{t('home.carrierTrust')}</p>
            <ul className="trust-carriers">
              {TRUST_CARRIERS.map((carrier) => (
                <li key={carrier.name} className="trust-carrier-chip" title={carrier.name}>
                  <img
                    src={carrier.logo}
                    alt={carrier.name}
                    width={20}
                    height={20}
                    loading="lazy"
                    onError={(event) => {
                      event.currentTarget.style.display = 'none'
                      const fallback = event.currentTarget.nextElementSibling
                      if (fallback) fallback.style.display = 'inline'
                    }}
                  />
                  <span className="trust-carrier-name" style={{ display: 'none' }}>
                    {carrier.name}
                  </span>
                </li>
              ))}
            </ul>
            <p className="trust-badges">
              <span className="trust-badge">🔒 {t('trust.ssl')}</span>
              <span className="trust-badge">✓ {t('trust.officialApi')}</span>
              <span className="trust-badge">★ {t('trust.free100')}</span>
            </p>
          </div>

          {/* Batch queue (multi-tracking in one paste) */}
          {queue.length > 1 && (
            <section className="batch-queue" aria-label={t('batch.title')}>
              <h2 className="batch-title">{t('batch.title')} ({queue.length})</h2>
              <ul className="batch-list">
                {queue.map((item) => (
                  <li key={item.number} className="batch-item">
                    <code className="batch-number">{item.number}</code>
                    {item.carrier ? (
                      <span className="batch-carrier">
                        {item.carrier.name} {REGION_FLAGS[item.carrier.region]}
                      </span>
                    ) : (
                      <span className="batch-carrier batch-unknown">?</span>
                    )}
                    <Link
                      className="batch-track"
                      to={`/track/${encodeURIComponent(item.number)}`}
                    >
                      {t('hero.cta')} →
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </section>

        {/* ── Trust stats (social proof) ─────────────────── */}
        <section className="stats-strip" aria-label="Statistics">
          {STATS.map((stat) => (
            <div key={stat.key} className="stat-cell">
              <span className="stat-value">{stat.value}</span>
              <span className="stat-label">{t(stat.key)}</span>
            </div>
          ))}
        </section>

        {/* ── Regional coverage (USA / Canada / Europe) ────────────────── */}
        <section className="coverage" aria-labelledby="coverage-title">
          <h2 id="coverage-title" className="section-title">{t('coverage.title')}</h2>
          <p className="section-subtitle">{t('coverage.subtitle')}</p>
          <div className="coverage-grid">
            {REGION_COVERAGE.map((region) => (
              <article key={region.id} className="region-card">
                <h3 className="region-name">
                  <span className="region-flag" aria-hidden="true">{region.flag}</span>
                  {t(`coverage.region.${region.id}`)}
                </h3>
                <ul className="region-carriers">
                  {region.carriers.map((carrier) => (
                    <li key={carrier}>{carrier}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
          <p className="coverage-note">{t('coverage.note')}</p>
        </section>

        {/* ── Feature grid: one strength per competitor ────────────────── */}
        <section className="features" aria-labelledby="features-title">
          <h2 id="features-title" className="section-title">{t('features.title')}</h2>
          <div className="features-grid">
            {FEATURES.map((feature) => (
              <article key={feature.title} className="feature-card">
                <span className="feature-icon" aria-hidden="true">{feature.icon}</span>
                <h3>{t(feature.title)}</h3>
                <p>{t(feature.text)}</p>
              </article>
            ))}
          </div>
        </section>

        {/* ── FAQ (matches FAQPage JSON-LD in index.html) ──────────────── */}
        <section className="faq" aria-labelledby="faq-title">
          <h2 id="faq-title" className="section-title">{t('faq.title')}</h2>
          <div className="faq-list">
            {FAQS.map((item) => (
              <details key={item.q} className="faq-item">
                <summary>{t(item.q)}</summary>
                <p>{t(item.a)}</p>
              </details>
            ))}
          </div>
        </section>
      </main>

      {/* Universal clock: real local time of every major logistics hub */}
      <WorldClock />

      <footer className="home-footer">
        <p className="footer-tagline">GLOBAL<span>TRACK</span>  {t('footer.tagline')}</p>
        <p className="footer-disclaimer">{t('footer.disclaimerShort')}</p>
        <nav className="footer-links" aria-label={t('footer.links')}>
          <Link to="/">{t('hero.cta')}</Link>
          <Link to="/global">{t('nav.missionControl')}</Link>
          <Link to="/pricing">Pricing</Link>
          <Link to="/analytics">Analytics</Link>
          <Link to="/trust">Trust</Link>
          <Link to="/carriers">{t('footer.carriers')}</Link>
          <Link to="/help">{t('footer.help')}</Link>
          <Link to="/help/contact">{t('footer.contact')}</Link>
        </nav>
        <nav className="footer-links" aria-label="Legal">
          <Link to="/about">{t('footer.about')}</Link>
          <Link to="/privacy">{t('footer.privacy')}</Link>
          <Link to="/terms">{t('footer.terms')}</Link>
          <Link to="/legal">{t('footer.legalNotice')}</Link>
        </nav>
        <p className="footer-legal">{t('footer.legal')}</p>
      </footer>
    </div>
  )
}
