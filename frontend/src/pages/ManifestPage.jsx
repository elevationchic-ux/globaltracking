import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { useI18n } from '../i18n/I18nContext.jsx'
import Icon from '../components/Icon.jsx'
import './ManifestPage.css'

/**
 * Comprehensive GlobalTrack manifest document.
 * Consolidates all legal, product and operational information
 * into a single print-ready page (downloadable as PDF via browser print).
 */

const TOKEN_PACKS = [
  { name: 'Starter', tokens: 10, price: '1.99' },
  { name: 'Basic', tokens: 50, price: '5.99' },
  { name: 'Pro', tokens: 100, price: '9.99' },
  { name: 'Business', tokens: 500, price: '39.99' },
  { name: 'Enterprise', tokens: 2000, price: '129.99' },
]

const CARRIERS = [
  'DHL', 'UPS', 'FedEx', 'USPS', 'Canada Post', 'Purolator',
  'Royal Mail', 'La Poste / Colissimo', 'DPD', 'GLS', 'PostNL',
  'Chronopost', 'Hermes', 'Bpost', 'Poste Italiane', 'Correos',
  'Australia Post', 'Japan Post', 'SF Express', 'Yanwen',
]

export default function ManifestPage() {
  const { locale, t } = useI18n()
  const docRef = useRef(null)

  function handleDownload() {
    window.print()
  }

  const today = new Date().toLocaleDateString(
    locale === 'fr' ? 'fr-FR' : locale === 'es' ? 'es-ES' : locale === 'de' ? 'de-DE' : 'en-US',
    { year: 'numeric', month: 'long', day: 'numeric' }
  )

  return (
    <>
      {/* ── Screen-only toolbar ─────────────────────────────────── */}
      <div className="manifest-toolbar no-print">
        <Link to="/" className="manifest-toolbar-back">
          <Icon name="chevron-right" size={16} style={{ transform: 'rotate(180deg)' }} />
          {t('manifest.back')}
        </Link>
        <button className="manifest-toolbar-download" onClick={handleDownload}>
          <Icon name="file" size={16} />
          {t('manifest.downloadPdf')}
        </button>
      </div>

      {/* ── Document ────────────────────────────────────────────── */}
      <div className="manifest-document" ref={docRef}>

        {/* ── Cover ───────────────────────────────────────────── */}
        <header className="manifest-cover">
          <div className="manifest-cover-logo">
            <svg viewBox="0 0 512 512" width="80" height="80" xmlns="http://www.w3.org/2000/svg">
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
            <h1 className="manifest-cover-title">GLOBAL<span>TRACK</span></h1>
          </div>
          <p className="manifest-cover-subtitle">{t('manifest.documentTitle')}</p>
          <div className="manifest-cover-meta">
            <span>{t('manifest.version')} 2.0</span>
            <span className="manifest-cover-sep">|</span>
            <span>{today}</span>
            <span className="manifest-cover-sep">|</span>
            <span>globaltracking.vercel.app</span>
          </div>
        </header>

        {/* ── Table of Contents ───────────────────────────────── */}
        <nav className="manifest-toc print-page-break">
          <h2>{t('manifest.toc')}</h2>
          <ol className="manifest-toc-list">
            <li><a href="#manifest-about">{t('manifest.tocAbout')}</a></li>
            <li><a href="#manifest-services">{t('manifest.tocServices')}</a></li>
            <li><a href="#manifest-coverage">{t('manifest.tocCoverage')}</a></li>
            <li><a href="#manifest-pricing">{t('manifest.tocPricing')}</a></li>
            <li><a href="#manifest-terms">{t('manifest.tocTerms')}</a></li>
            <li><a href="#manifest-privacy">{t('manifest.tocPrivacy')}</a></li>
            <li><a href="#manifest-cookies">{t('manifest.tocCookies')}</a></li>
            <li><a href="#manifest-legal">{t('manifest.tocLegal')}</a></li>
            <li><a href="#manifest-contact">{t('manifest.tocContact')}</a></li>
          </ol>
        </nav>

        {/* ── Section 1: About ────────────────────────────────── */}
        <section id="manifest-about" className="manifest-section print-page-break">
          <h2>{t('manifest.aboutTitle')}</h2>
          <p>{t('manifest.aboutP1')}</p>
          <p>{t('manifest.aboutP2')}</p>
          <p>{t('manifest.aboutP3')}</p>
        </section>

        {/* ── Section 2: Services ─────────────────────────────── */}
        <section id="manifest-services" className="manifest-section print-page-break">
          <h2>{t('manifest.servicesTitle')}</h2>
          <p>{t('manifest.servicesP1')}</p>
          <ul className="manifest-list">
            <li>{t('manifest.servicesFeat1')}</li>
            <li>{t('manifest.servicesFeat2')}</li>
            <li>{t('manifest.servicesFeat3')}</li>
            <li>{t('manifest.servicesFeat4')}</li>
            <li>{t('manifest.servicesFeat5')}</li>
            <li>{t('manifest.servicesFeat6')}</li>
          </ul>
          <p>{t('manifest.servicesDisclaimer')}</p>
        </section>

        {/* ── Section 3: Coverage ─────────────────────────────── */}
        <section id="manifest-coverage" className="manifest-section print-page-break">
          <h2>{t('manifest.coverageTitle')}</h2>
          <p>{t('manifest.coverageP1')}</p>
          <div className="manifest-carrier-grid">
            {CARRIERS.map((c) => (
              <span key={c} className="manifest-carrier-chip">{c}</span>
            ))}
          </div>
          <p className="manifest-note">{t('manifest.coverageNote')}</p>
        </section>

        {/* ── Section 4: Pricing ──────────────────────────────── */}
        <section id="manifest-pricing" className="manifest-section print-page-break">
          <h2>{t('manifest.pricingTitle')}</h2>
          <p>{t('manifest.pricingP1')}</p>
          <table className="manifest-table">
            <thead>
              <tr>
                <th>{t('manifest.thPlan')}</th>
                <th>{t('manifest.thCredits')}</th>
                <th>{t('manifest.thPrice')}</th>
                <th>{t('manifest.thUnit')}</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Free</strong></td>
                <td>100</td>
                <td>0,00 EUR</td>
                <td>-</td>
              </tr>
              {TOKEN_PACKS.map((pack) => (
                <tr key={pack.name}>
                  <td><strong>{pack.name}</strong></td>
                  <td>{pack.tokens}</td>
                  <td>{pack.price} EUR</td>
                  <td>{(parseFloat(pack.price) / pack.tokens).toFixed(3)} EUR</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="manifest-note">{t('manifest.pricingNote')}</p>
        </section>

        {/* ── Section 5: Terms ────────────────────────────────── */}
        <section id="manifest-terms" className="manifest-section print-page-break">
          <h2>{t('manifest.termsTitle')}</h2>
          <h3>{t('manifest.termsAcceptTitle')}</h3>
          <p>{t('manifest.termsAcceptP')}</p>
          <h3>{t('manifest.termsScopeTitle')}</h3>
          <p>{t('manifest.termsScopeP1')}</p>
          <p>{t('manifest.termsScopeP2')}</p>
          <h3>{t('manifest.termsUseTitle')}</h3>
          <p>{t('manifest.termsUseP')}</p>
          <h3>{t('manifest.termsLiabilityTitle')}</h3>
          <p>{t('manifest.termsLiabilityP')}</p>
        </section>

        {/* ── Section 6: Privacy ──────────────────────────────── */}
        <section id="manifest-privacy" className="manifest-section print-page-break">
          <h2>{t('manifest.privacyTitle')}</h2>
          <h3>{t('manifest.privacyDataTitle')}</h3>
          <p>{t('manifest.privacyDataP1')}</p>
          <p>{t('manifest.privacyDataP2')}</p>
          <h3>{t('manifest.privacyRightsTitle')}</h3>
          <p>{t('manifest.privacyRightsP')}</p>
          <h3>{t('manifest.privacyRetentionTitle')}</h3>
          <p>{t('manifest.privacyRetentionP')}</p>
        </section>

        {/* ── Section 7: Cookies ──────────────────────────────── */}
        <section id="manifest-cookies" className="manifest-section print-page-break">
          <h2>{t('manifest.cookiesTitle')}</h2>
          <p>{t('manifest.cookiesP1')}</p>
          <table className="manifest-table">
            <thead>
              <tr>
                <th>{t('manifest.cookieName')}</th>
                <th>{t('manifest.cookiePurpose')}</th>
                <th>{t('manifest.cookieStorage')}</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><code>globaltrack:locale</code></td>
                <td>{t('manifest.cookieLocale')}</td>
                <td>{t('manifest.cookieLocal')}</td>
              </tr>
              <tr>
                <td><code>globaltrack:theme</code></td>
                <td>{t('manifest.cookieTheme')}</td>
                <td>{t('manifest.cookieLocal')}</td>
              </tr>
              <tr>
                <td><code>globaltrack:recent</code></td>
                <td>{t('manifest.cookieRecent')}</td>
                <td>{t('manifest.cookieLocal')}</td>
              </tr>
              <tr>
                <td><code>globaltrack:consent</code></td>
                <td>{t('manifest.cookieConsent')}</td>
                <td>{t('manifest.cookieLocal')}</td>
              </tr>
              <tr>
                <td><code>gt_session</code></td>
                <td>{t('manifest.cookieSession')}</td>
                <td>{t('manifest.cookieBrowser')}</td>
              </tr>
            </tbody>
          </table>
        </section>

        {/* ── Section 8: Legal Notice ─────────────────────────── */}
        <section id="manifest-legal" className="manifest-section print-page-break">
          <h2>{t('manifest.legalTitle')}</h2>
          <h3>{t('manifest.legalPublisherTitle')}</h3>
          <p>{t('manifest.legalPublisherP')}</p>
          <h3>{t('manifest.legalHostingTitle')}</h3>
          <p>{t('manifest.legalHostingP')}</p>
          <h3>{t('manifest.legalIPTitle')}</h3>
          <p>{t('manifest.legalIPP')}</p>
        </section>

        {/* ── Section 9: Contact ──────────────────────────────── */}
        <section id="manifest-contact" className="manifest-section print-page-break">
          <h2>{t('manifest.contactTitle')}</h2>
          <table className="manifest-table manifest-contact-table">
            <tbody>
              <tr>
                <td><strong>{t('manifest.contactWeb')}</strong></td>
                <td>globaltracking.vercel.app</td>
              </tr>
              <tr>
                <td><strong>{t('manifest.contactEmail')}</strong></td>
                <td>legal@globaltrack.example</td>
              </tr>
              <tr>
                <td><strong>{t('manifest.contactPrivacy')}</strong></td>
                <td>privacy@globaltrack.example</td>
              </tr>
              <tr>
                <td><strong>{t('manifest.contactSupport')}</strong></td>
                <td>{t('manifest.contactSupportValue')}</td>
              </tr>
            </tbody>
          </table>
        </section>

        {/* ── Footer ──────────────────────────────────────────── */}
        <footer className="manifest-doc-footer">
          <p>{t('manifest.footerLine1')}</p>
          <p>{t('manifest.footerLine2')} {today}</p>
        </footer>
      </div>
    </>
  )
}
