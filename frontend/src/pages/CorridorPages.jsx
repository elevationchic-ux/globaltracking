import { useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useI18n } from '../i18n/I18nContext.jsx'
import { CARRIERS } from '../utils/carrierDetection.js'
import { setMeta, useJsonLd } from '../utils/seo.js'
import { claimUrlFor } from '../utils/carrierHelp.js'
import { HELP_TOPICS } from './HelpPages.jsx'
import { carrierSlug } from './CarrierPages.jsx'
import SiteFooter from '../components/SiteFooter.jsx'

/**
 * Programmatic SEO silo:
 *  1. Corridor pages  "/corridors/china-to-france/" capture
 *     "track package from X to Y" long-tail queries.
 *  2. Carrier × status pages  "/tracking/usps/status/customs-clearance/"
 *     capture "{carrier} {status} meaning" queries (12 carriers × 6 statuses).
 * Every page is bilingual, JSON-LD enriched and internally cross-linked.
 */

export const CORRIDORS = [
  { slug: 'china-to-france', from: 'China', to: 'France', fr: 'Chine', toFr: 'France', carriers: ['china-post', 'la-poste-colissimo', 'dhl'] },
  { slug: 'china-to-usa', from: 'China', to: 'USA', fr: 'Chine', toFr: 'États-Unis', carriers: ['china-post', 'usps', 'fedex'] },
  { slug: 'china-to-canada', from: 'China', to: 'Canada', fr: 'Chine', toFr: 'Canada', carriers: ['china-post', 'canada-post', 'ups'] },
  { slug: 'france-to-usa', from: 'France', to: 'USA', fr: 'France', toFr: 'États-Unis', carriers: ['la-poste-colissimo', 'dhl', 'fedex'] },
  { slug: 'usa-to-canada', from: 'USA', to: 'Canada', fr: 'États-Unis', toFr: 'Canada', carriers: ['usps', 'canada-post', 'ups'] },
  { slug: 'usa-to-france', from: 'USA', to: 'France', fr: 'États-Unis', toFr: 'France', carriers: ['usps', 'dhl', 'ups'] },
  { slug: 'uk-to-canada', from: 'United Kingdom', to: 'Canada', fr: 'Royaume-Uni', toFr: 'Canada', carriers: ['royal-mail', 'canada-post'] },
  { slug: 'germany-to-france', from: 'Germany', to: 'France', fr: 'Allemagne', toFr: 'France', carriers: ['dhl', 'dpd', 'la-poste-colissimo'] },
  { slug: 'germany-to-usa', from: 'Germany', to: 'USA', fr: 'Allemagne', toFr: 'États-Unis', carriers: ['dhl', 'dpd', 'fedex'] },
  { slug: 'japan-to-uk', from: 'Japan', to: 'United Kingdom', fr: 'Japon', toFr: 'Royaume-Uni', carriers: ['fedex', 'dhl', 'royal-mail'] },
]

const findByCarrierSlug = (slug) => CARRIERS.find((c) => carrierSlug(c) === slug) ?? null

const CORRIDOR_TEXT = {
  en: {
    indexTitle: 'Track international packages by route',
    indexSubtitle: 'Pick your shipping corridor to see the carriers involved, customs steps and typical delays.',
    h1: (c) => `Track packages from ${c.from} to ${c.to}`,
    meta: (c) =>
      `Tracking a parcel from ${c.from} to ${c.to}? Carriers involved, customs steps, typical delays and what every status means  free, in your language.`,
    intro: (c) =>
      `Shipments from ${c.from} to ${c.to} usually cross at least one customs border. GlobalTrack follows your parcel across every carrier hand-off on this corridor and translates each scan into plain language.`,
    carriersTitle: 'Carriers active on this corridor',
    customsTitle: 'What to expect',
    customs: [
      'The parcel is exported through the origin country’s customs, then inspected by the destination country (often at a major airport hub).',
      'Typical customs time on this corridor: 12 to 72 hours. A "Held in customs" scan usually means import duty or VAT is due.',
      'Once released, the parcel is handed to the destination country’s postal network or courier for last-mile delivery.',
    ],
    helpTitle: 'Understand the statuses you may see',
    trackCta: 'Track a number now',
  },
  fr: {
    indexTitle: 'Suivi de colis international par itinéraire',
    indexSubtitle: 'Choisissez votre corridor d’expédition pour voir les transporteurs, les étapes de douane et les délais typiques.',
    h1: (c) => `Suivre un colis de ${c.fr} vers ${c.toFr}`,
    meta: (c) =>
      `Vous suivez un colis de ${c.fr} vers ${c.toFr} ? Transporteurs impliqués, étapes de douane, délais typiques et signification de chaque statut  gratuit, en français.`,
    intro: (c) =>
      `Les expéditions de ${c.fr} vers ${c.toFr} franchissent au moins une frontière douanière. GlobalTrack suit votre colis à travers chaque relais transporteur sur ce corridor et traduit chaque scan en langage clair.`,
    carriersTitle: 'Transporteurs actifs sur ce corridor',
    customsTitle: 'À quoi s’attendre',
    customs: [
      'Le colis est exporté via la douane du pays d’origine, puis inspecté par le pays de destination (souvent dans un grand hub aéroportuaire).',
      'Délai de douane typique sur ce corridor : 12 à 72 heures. Un scan « Held in customs » signifie en général que des droits ou la TVA sont dus.',
      'Une fois libéré, le colis est remis au réseau postal ou au coursier du pays de destination pour la livraison finale.',
    ],
    helpTitle: 'Comprendre les statuts que vous pouvez voir',
    trackCta: 'Suivre un numéro maintenant',
  },
}

function Shell({ children }) {
  return (
    <div className="home-shell">
      <nav className="home-nav" aria-label="Main">
        <Link to="/" className="home-logo">GLOBAL<span>TRACK</span></Link>
        <Link to="/corridors" className="nav-mission">↩</Link>
      </nav>
      {children}
      <SiteFooter />
    </div>
  )
}

export function CorridorIndexPage() {
  const { locale } = useI18n()
  const txt = CORRIDOR_TEXT[locale] ?? CORRIDOR_TEXT.en

  useEffect(() => {
    setMeta({
      title: `${txt.indexTitle} | GlobalTrack`,
      description: txt.indexSubtitle,
      path: '/corridors',
    })
  }, [txt])

  return (
    <Shell>
      <main className="seo-page">
        <h1>{txt.indexTitle}</h1>
        <p className="seo-subtitle">{txt.indexSubtitle}</p>
        <div className="carrier-grid">
          {CORRIDORS.map((corridor) => (
            <Link key={corridor.slug} className="carrier-card" to={`/corridors/${corridor.slug}/`}>
              <strong>
                {locale === 'fr' ? `${corridor.fr} → ${corridor.toFr}` : `${corridor.from} → ${corridor.to}`}
              </strong>
              <span>{corridor.carriers.map((s) => findByCarrierSlug(s)?.name ?? s).join(' · ')}</span>
            </Link>
          ))}
        </div>
      </main>
    </Shell>
  )
}

export function CorridorPage() {
  const { locale } = useI18n()
  const { slug } = useParams()
  const txt = CORRIDOR_TEXT[locale] ?? CORRIDOR_TEXT.en
  const corridor = CORRIDORS.find((c) => c.slug === slug)

  useEffect(() => {
    if (!corridor) return
    setMeta({
      title: `${txt.h1(corridor)} | GlobalTrack`,
      description: txt.meta(corridor),
      path: `/corridors/${slug}/`,
    })
  }, [corridor, slug, txt])

  useJsonLd(
    corridor && {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: txt.h1(corridor),
      description: txt.meta(corridor),
    },
  )

  if (!corridor) {
    return (
      <Shell>
        <main className="seo-page">
          <h1>Corridor not found</h1>
          <p><Link to="/corridors">{txt.indexTitle}</Link></p>
        </main>
      </Shell>
    )
  }

  return (
    <Shell>
      <main className="seo-page">
        <h1>{txt.h1(corridor)}</h1>
        <p className="seo-subtitle">{txt.intro(corridor)}</p>
        <p className="seo-cta-row">
          <Link className="search-button seo-cta" to="/">{txt.trackCta} →</Link>
        </p>

        <section className="seo-section">
          <h2>{txt.carriersTitle}</h2>
          <ul className="seo-carrier-links">
            {corridor.carriers.map((carrierCode) => {
              const carrier = findByCarrierSlug(carrierCode)
              if (!carrier) return null
              return (
                <li key={carrier.code}>
                  <Link to={`/tracking/${carrierSlug(carrier)}/`}>
                    {txt.trackCta.split(' ')[0]} {carrier.name} →
                  </Link>
                </li>
              )
            })}
          </ul>
        </section>

        <section className="seo-section">
          <h2>{txt.customsTitle}</h2>
          {txt.customs.map((line) => (
            <p key={line.slice(0, 30)} className="seo-paragraph">{line}</p>
          ))}
        </section>

        <section className="seo-section">
          <h2>{txt.helpTitle}</h2>
          <ul className="seo-carrier-links">
            {HELP_TOPICS.map((topic) => (
              <li key={topic.slug}>
                <Link to={`/help/${topic.slug}/`}>{topic[locale]?.title ?? topic.en.title}</Link>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </Shell>
  )
}

const STATUS_TEXT = {
  en: {
    h1: (carrier, topic) =>
      `${carrier.name}: what does “${topic.en.title.replace(/^What does | mean\??$/g, '').replace(/[""]/g, '')}” mean?`,
    meta: (carrier, topic) =>
      `Your ${carrier.name} tracking shows a customs or delivery status you don't understand? ${topic.en.short} Full explanation and what to do.`,
    carrierNote: (carrier) =>
      `Paste any ${carrier.name} tracking number  GlobalTrack detects the format automatically (example: ${carrier.sample}) and translates every scan.`,
    escalate: 'Package stuck? Open a claim with the carrier',
    otherStatuses: 'Other statuses explained',
  },
  fr: {
    h1: (carrier, topic) => `${carrier.name} : ${(topic.fr?.title ?? topic.en.title).toLowerCase().replace(/^que signifie /, 'que signifie ')}`,
    meta: (carrier, topic) =>
      `Votre suivi ${carrier.name} affiche un statut de douane ou de livraison incompréhensible ? ${topic.fr?.short ?? topic.en.short} Explication complète et quoi faire.`,
    carrierNote: (carrier) =>
      `Collez n’importe quel numéro de suivi ${carrier.name}  GlobalTrack détecte le format automatiquement (exemple : ${carrier.sample}) et traduit chaque scan.`,
    escalate: 'Colis bloqué ? Ouvrir une réclamation auprès du transporteur',
    otherStatuses: 'Autres statuts expliqués',
  },
}

export function CarrierStatusPage() {
  const { locale } = useI18n()
  const { slug, statusSlug } = useParams()
  const carrier = findByCarrierSlug(slug)
  const topic = HELP_TOPICS.find((t) => t.slug === statusSlug)
  const txt = STATUS_TEXT[locale] ?? STATUS_TEXT.en
  const content = topic ? (topic[locale] ?? topic.en) : null

  useEffect(() => {
    if (!carrier || !topic) return
    setMeta({
      title: `${txt.h1(carrier, topic)} | GlobalTrack`,
      description: txt.meta(carrier, topic),
      path: `/tracking/${slug}/status/${statusSlug}/`,
    })
  }, [carrier, topic, slug, statusSlug, txt])

  useJsonLd(
    carrier &&
      content && {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: txt.h1(carrier, topic),
        description: txt.meta(carrier, topic),
        inLanguage: locale,
        about: { '@type': 'Organization', name: carrier.name },
      },
  )

  if (!carrier || !topic) {
    return (
      <Shell>
        <main className="seo-page">
          <h1>Not found</h1>
          <p><Link to="/carriers">All carriers</Link></p>
        </main>
      </Shell>
    )
  }

  return (
    <Shell>
      <main className="seo-page">
        <h1>{txt.h1(carrier, topic)}</h1>
        <p className="seo-subtitle">{content.short}</p>
        {content.paragraphs.map((text) => (
          <p key={text.slice(0, 40)} className="seo-paragraph">{text}</p>
        ))}

        <section className="seo-section">
          <h2>{carrier.name}</h2>
          <p className="seo-paragraph">{txt.carrierNote(carrier)}</p>
          <p className="seo-cta-row">
            <Link className="search-button seo-cta" to="/">{locale === 'fr' ? 'Suivre un colis' : 'Track a package'} →</Link>
          </p>
          <p className="seo-cta-row">
            <a
              className="official-help-link"
              href={claimUrlFor(carrier.name)}
              target="_blank"
              rel="noopener noreferrer"
            >
              {txt.escalate} →
            </a>
          </p>
        </section>

        <section className="seo-section">
          <h2>{txt.otherStatuses}</h2>
          <ul className="seo-carrier-links">
            {HELP_TOPICS.filter((t) => t.slug !== topic.slug).map((t) => (
              <li key={t.slug}>
                <Link to={`/tracking/${slug}/status/${t.slug}/`}>
                  {t[locale]?.title ?? t.en.title}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </Shell>
  )
}
