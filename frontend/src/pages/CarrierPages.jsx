import { useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useI18n } from '../i18n/I18nContext.jsx'
import { CARRIERS } from '../utils/carrierDetection.js'
import { setMeta, useJsonLd } from '../utils/seo.js'
import { HELP_TOPICS } from './HelpPages.jsx'
import SiteFooter from '../components/SiteFooter.jsx'

/**
 * Carrier landing pages  the SEO acquisition machine.
 * Users search "USPS tracking" / "suivi Colissimo", not "GlobalTrack":
 * each carrier gets its own indexable page (/tracking/usps, /suivi/colissimo)
 * generated from the detection catalog.
 */

const REGION_FLAGS = { USA: '🇺🇸', CANADA: '🇨🇦', EUROPE: '🇪🇺', WORLDWIDE: '🌍' }

export const carrierSlug = (carrier) =>
  carrier.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

const findBySlug = (slug) => CARRIERS.find((c) => carrierSlug(c) === slug) ?? null

const TEXT = {
  en: {
    indexTitle: 'Track packages by carrier',
    indexSubtitle:
      'Choose your carrier or paste any tracking number  GlobalTrack detects it automatically.',
    h1: (c) => `Track your ${c.name} package`,
    meta: (c) =>
      `Track any ${c.name} package for free. Paste your tracking number  GlobalTrack shows every scan, customs step and the delivery ETA in your language.`,
    intro: (c) =>
      `${c.name} serves ${c.countries.join(', ')}. Paste your ${c.name} tracking number below and GlobalTrack follows your parcel step by step  pickup, hubs, customs clearance and final delivery.`,
    formatTitle: 'What does a tracking number look like?',
    formatHint: 'Example format recognized automatically:',
    howTitle: 'How to track a package',
    steps: [
      'Copy the tracking number from your shipping confirmation email or the seller’s order page.',
      'Paste it in the GlobalTrack search box  the carrier is detected instantly, no dropdown needed.',
      'Read the full translated timeline: every scan, border hand-off and the estimated delivery date.',
    ],
    cta: 'Track a number now',
    statusHelpTitle: 'Tracking statuses explained',
    othersTitle: 'Other supported carriers',
    regionsTitle: 'Region',
  },
  fr: {
    indexTitle: 'Suivi de colis par transporteur',
    indexSubtitle:
      'Choisissez votre transporteur ou collez un numéro de suivi  GlobalTrack le détecte automatiquement.',
    h1: (c) => `Suivi ${c.name}  suivez votre colis`,
    meta: (c) =>
      `Suivez gratuitement tout colis ${c.name}. Collez votre numéro de suivi  GlobalTrack affiche chaque scan, étape de douane et la date de livraison estimée, en français.`,
    intro: (c) =>
      `${c.name} dessert ${c.countries.join(', ')}. Collez votre numéro de suivi ${c.name} ci-dessous et GlobalTrack suit votre colis étape par étape  enlèvement, hubs, dédouanement et livraison finale.`,
    formatTitle: 'À quoi ressemble un numéro de suivi ?',
    formatHint: 'Exemple de format reconnu automatiquement :',
    howTitle: 'Comment suivre un colis',
    steps: [
      'Copiez le numéro de suivi depuis l’email d’expédition ou la page de commande du vendeur.',
      'Collez-le dans la barre de recherche GlobalTrack  le transporteur est détecté instantanément, sans menu déroulant.',
      'Lisez la chronologie complète traduite : chaque scan, relais aux frontières et la date de livraison estimée.',
    ],
    cta: 'Suivre un numéro maintenant',
    statusHelpTitle: 'Statuts de suivi expliqués',
    othersTitle: 'Autres transporteurs pris en charge',
    regionsTitle: 'Région',
  },
}

function Shell({ children }) {
  return (
    <div className="home-shell">
      <nav className="home-nav" aria-label="Main">
        <Link to="/" className="home-logo">GLOBAL<span>TRACK</span></Link>
        <Link to="/carriers" className="nav-mission">↩</Link>
      </nav>
      {children}
      <SiteFooter />
    </div>
  )
}

export function CarrierIndexPage() {
  const { locale } = useI18n()
  const txt = TEXT[locale] ?? TEXT.en

  useEffect(() => {
    setMeta({
      title: `${txt.indexTitle} | GlobalTrack`,
      description:
        'USPS, UPS, FedEx, DHL, Canada Post, Purolator, Royal Mail, La Poste / Colissimo, DPD, GLS, PostNL  track any carrier with one number.',
      path: '/carriers',
    })
  }, [txt])

  useJsonLd({
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: txt.indexTitle,
    itemListElement: CARRIERS.map((carrier, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: carrier.name,
      url: `https://globaltracking.vercel.app/tracking/${carrierSlug(carrier)}/`,
    })),
  })

  return (
    <Shell>
      <main className="seo-page">
        <h1>{txt.indexTitle}</h1>
        <p className="seo-subtitle">{txt.indexSubtitle}</p>
        <div className="carrier-grid">
          {CARRIERS.map((carrier) => (
            <Link
              key={carrier.code}
              className="carrier-card"
              to={`/tracking/${carrierSlug(carrier)}/`}
            >
              <strong>{carrier.name}</strong>
              <span>
                {REGION_FLAGS[carrier.region]} {carrier.countries.join(' · ')}
              </span>
              <code>{carrier.sample}</code>
            </Link>
          ))}
        </div>
      </main>
    </Shell>
  )
}

export function CarrierLandingPage() {
  const { locale } = useI18n()
  const { slug } = useParams()
  const txt = TEXT[locale] ?? TEXT.en
  const carrier = findBySlug(slug)

  useEffect(() => {
    if (!carrier) return
    setMeta({
      title: `${carrier.name} Tracking  GlobalTrack`,
      description: txt.meta(carrier),
      path: `/tracking/${slug}/`,
    })
  }, [carrier, slug, txt])

  useJsonLd(
    carrier && {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: txt.h1(carrier),
      description: txt.meta(carrier),
      about: { '@type': 'Organization', name: carrier.name },
    },
  )

  if (!carrier) {
    return (
      <Shell>
        <main className="seo-page">
          <h1>Carrier not found</h1>
          <p>
            <Link to="/carriers">{txt.othersTitle}</Link>
          </p>
        </main>
      </Shell>
    )
  }

  return (
    <Shell>
      <main className="seo-page">
        <h1>{txt.h1(carrier)}</h1>
        <p className="seo-subtitle">{txt.intro(carrier)}</p>
        <p className="seo-cta-row">
          <Link className="search-button seo-cta" to="/">{txt.cta} →</Link>
          <span className="seo-region">
            {txt.regionsTitle}: {REGION_FLAGS[carrier.region]} {carrier.countries.join(' · ')}
          </span>
        </p>

        <section className="seo-section">
          <h2>{txt.formatTitle}</h2>
          <p>{txt.formatHint}</p>
          <code className="seo-sample">{carrier.sample}</code>
        </section>

        <section className="seo-section">
          <h2>{txt.howTitle}</h2>
          <ol className="seo-steps">
            {txt.steps.map((step) => (
              <li key={step.slice(0, 30)}>{step}</li>
            ))}
          </ol>
        </section>

        <section className="seo-section">
          <h2>{txt.statusHelpTitle}</h2>
          <ul className="seo-carrier-links">
            {HELP_TOPICS.map((topic) => (
              <li key={topic.slug}>
                <Link to={`/tracking/${slug}/status/${topic.slug}/`}>
                  {topic[locale]?.title ?? topic.en.title}
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="seo-section">
          <h2>{txt.othersTitle}</h2>
          <ul className="seo-carrier-links">
            {CARRIERS.filter((c) => c.code !== carrier.code).map((c) => (
              <li key={c.code}>
                <Link to={`/tracking/${carrierSlug(c)}/`}>{c.name}</Link>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </Shell>
  )
}
