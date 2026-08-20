import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useI18n } from '../i18n/I18nContext.jsx'
import { setMeta } from '../utils/seo.js'
import SiteFooter from '../components/SiteFooter.jsx'

/**
 * Institutional legal pages (About / Privacy / Terms / Legal Notice).
 * Fully bilingual EN-FR  a hard requirement for Canada  and indexed
 * per-page for SEO credibility on EU/US markets.
 */

const CONTENT = {
  about: {
    en: {
      title: 'About GlobalTrack',
      path: '/about',
      description:
        'GlobalTrack is an independent package tracking platform aggregating carrier data across the USA, Canada and Europe.',
      sections: [
        ['Our mission', [
          'GlobalTrack was built on one conviction: following a parcel should not require opening five different carrier websites. One tracking number, one interface, every carrier.',
          'We aggregate official tracking data from the major carriers serving the USA, Canada and Europe  USPS, UPS, FedEx, DHL, Canada Post, Purolator, Royal Mail, La Poste / Colissimo, DPD, GLS, PostNL and 2,400+ others  and present it in a single translated timeline.',
        ]],
        ['What we are  and what we are not', [
          'GlobalTrack is an independent tracking tool. We are neither the seller nor the carrier of your goods, and we never physically handle your package. We simply mirror the tracking information carriers publish.',
          'For any delivery issue, refund, reshipment or customs question, please contact your seller or the carrier shown on your tracking page.',
        ]],
        ['Who we serve', [
          'Individual buyers waiting for a parcel, small e-commerce businesses monitoring bulk shipments, and anyone who has ever refreshed a carrier page hoping for a new scan.',
        ]],
      ],
    },
    fr: {
      title: 'À propos de GlobalTrack',
      path: '/about',
      description:
        'GlobalTrack est une plateforme indépendante de suivi de colis agrégeant les données des transporteurs aux USA, au Canada et en Europe.',
      sections: [
        ['Notre mission', [
          'GlobalTrack repose sur une conviction : suivre un colis ne devrait pas exiger d’ouvrir cinq sites transporteurs différents. Un numéro de suivi, une interface, tous les transporteurs.',
          'Nous agrégeons les données officielles des grands transporteurs desservant les USA, le Canada et l’Europe  USPS, UPS, FedEx, DHL, Postes Canada, Purolator, Royal Mail, La Poste / Colissimo, DPD, GLS, PostNL et plus de 2 400 autres  dans une chronologie unique et traduite.',
        ]],
        ['Ce que nous sommes  et ce que nous ne sommes pas', [
          'GlobalTrack est un outil de suivi indépendant. Nous ne sommes ni le vendeur ni le transporteur de vos marchandises, et nous ne manipulons jamais physiquement votre colis. Nous reflétons simplement les informations de suivi publiées par les transporteurs.',
          'Pour tout problème de livraison, remboursement, réexpédition ou question de douane, contactez votre vendeur ou le transporteur indiqué sur votre page de suivi.',
        ]],
        ['À qui nous nous adressons', [
          'Aux acheteurs qui attendent un colis, aux petites boutiques en ligne qui surveillent des expéditions en lot, et à tous ceux qui ont déjà actualisé une page transporteur en espérant un nouveau scan.',
        ]],
      ],
    },
  },
  privacy: {
    en: {
      title: 'Privacy Policy',
      path: '/privacy',
      description:
        'GlobalTrack privacy policy: what data we process, GDPR and CCPA rights, cookie policy and how to contact us.',
      sections: [
        ['Data we process', [
          'Tracking numbers you search are processed solely to display tracking results. They are not sold, rented or shared with third parties for advertising.',
          'Preferences you set locally (language, theme, aliases, alert choices, consent) are stored in your browser (localStorage) and never transmitted to us.',
        ]],
        ['Cookies', [
          'GlobalTrack uses only essential storage to remember your preferences. Optional analytics cookies are set only after explicit consent via the cookie banner, in line with the GDPR ePrivacy requirements.',
          'You can withdraw consent at any time by clearing the "globaltrack:consent" entry of your browser storage.',
        ]],
        ['Your rights (GDPR & CCPA)', [
          'Under the GDPR (EU) you have the right to access, rectify, erase and port your personal data, and to object to its processing. Under the CCPA (California) you have the right to know, delete and opt out of the sale of personal information  GlobalTrack does not sell personal information.',
          'To exercise any right, contact privacy@globaltrack.example.',
        ]],
        ['Data retention', [
          'Tracking queries are kept only for the duration needed to serve the result. No profile is built from your searches.',
        ]],
      ],
    },
    fr: {
      title: 'Politique de confidentialité',
      path: '/privacy',
      description:
        'Politique de confidentialité de GlobalTrack : données traitées, droits RGPD et CCPA, politique de cookies et contact.',
      sections: [
        ['Données traitées', [
          'Les numéros de suivi recherchés sont traités uniquement pour afficher les résultats de suivi. Ils ne sont ni vendus, ni loués, ni partagés avec des tiers à des fins publicitaires.',
          'Les préférences définies localement (langue, thème, alias, choix d’alertes, consentement) sont stockées dans votre navigateur (localStorage) et ne nous sont jamais transmises.',
        ]],
        ['Cookies', [
          'GlobalTrack n’utilise que du stockage essentiel pour retenir vos préférences. Les cookies de mesure d’audience ne sont déposés qu’après consentement explicite via la bannière cookies, conformément au RGPD.',
          'Vous pouvez retirer votre consentement à tout moment en supprimant l’entrée « globaltrack:consent » du stockage de votre navigateur.',
        ]],
        ['Vos droits (RGPD & CCPA)', [
          'Conformément au RGPD (UE), vous disposez des droits d’accès, de rectification, d’effacement et de portabilité de vos données, ainsi que du droit d’opposition. Conformément au CCPA (Californie), vous avez le droit de savoir, de supprimer et de refuser la vente de vos informations personnelles  GlobalTrack ne vend aucune information personnelle.',
          'Pour exercer vos droits : privacy@globaltrack.example.',
        ]],
        ['Durée de conservation', [
          'Les requêtes de suivi ne sont conservées que le temps nécessaire à l’affichage du résultat. Aucun profil n’est construit à partir de vos recherches.',
        ]],
      ],
    },
  },
  terms: {
    en: {
      title: 'Terms of Use',
      path: '/terms',
      description:
        'GlobalTrack terms of use: service scope, independent tracking tool disclaimer, acceptable use and liability.',
      sections: [
        ['Acceptance', [
          'By accessing GlobalTrack you accept these Terms of Use. If you disagree, please do not use the service.',
        ]],
        ['Scope of service', [
          'GlobalTrack provides tracking information aggregated from carrier systems "as is". We do not ship, handle, insure or sell any goods.',
          'Delivery dates, statuses and locations are provided by carriers and may change without notice. GlobalTrack is not liable for delays, loss, damage or customs decisions concerning your shipment.',
        ]],
        ['Acceptable use', [
          'You agree not to misuse the service: no automated mass scraping, no attempts to disrupt infrastructure, no use of the report feature to harass or defame.',
        ]],
        ['Liability', [
          'To the maximum extent permitted by law, GlobalTrack’s liability is limited to the amounts you paid for the service (zero for the free tier).',
        ]],
      ],
    },
    fr: {
      title: 'Conditions d’utilisation',
      path: '/terms',
      description:
        'Conditions d’utilisation de GlobalTrack : périmètre du service, statut d’outil indépendant, usage acceptable et responsabilité.',
      sections: [
        ['Acceptation', [
          'En accédant à GlobalTrack, vous acceptez les présentes conditions d’utilisation. Si vous les refusez, merci de ne pas utiliser le service.',
        ]],
        ['Périmètre du service', [
          'GlobalTrack fournit des informations de suivi agrégées depuis les systèmes des transporteurs, « en l’état ». Nous n’expédions, ne manipulons, n’assurons ni ne vendons aucune marchandise.',
          'Les dates de livraison, statuts et positions proviennent des transporteurs et peuvent évoluer sans préavis. GlobalTrack n’est pas responsable des retards, pertes, dommages ou décisions douanières concernant votre envoi.',
        ]],
        ['Usage acceptable', [
          'Vous vous engagez à ne pas détourner le service : pas de scraping massif automatisé, pas de tentative de perturbation de l’infrastructure, pas d’usage de la fonction de signalement pour harceler ou diffamer.',
        ]],
        ['Responsabilité', [
          'Dans les limites autorisées par la loi, la responsabilité de GlobalTrack est limitée aux montants versés pour le service (zéro pour l’offre gratuite).',
        ]],
      ],
    },
  },
  legal: {
    en: {
      title: 'Legal Notice',
      path: '/legal',
      description:
        'GlobalTrack legal notice: publisher, hosting provider and intellectual property information.',
      sections: [
        ['Publisher', [
          'GlobalTrack  independent package tracking service.',
          'Contact: legal@globaltrack.example',
        ]],
        ['Hosting', [
          'This service is hosted on cloud infrastructure located in the United States and the European Union. Hosting provider details available on request.',
        ]],
        ['Intellectual property', [
          'The GlobalTrack name, logo and interface are protected by intellectual property rights. Carrier names and logos cited remain the property of their respective owners and are used solely to identify tracking services.',
        ]],
      ],
    },
    fr: {
      title: 'Mentions légales',
      path: '/legal',
      description:
        'Mentions légales de GlobalTrack : éditeur, hébergement et propriété intellectuelle.',
      sections: [
        ['Éditeur', [
          'GlobalTrack  service indépendant de suivi de colis.',
          'Contact : legal@globaltrack.example',
        ]],
        ['Hébergement', [
          'Ce service est hébergé sur une infrastructure cloud située aux États-Unis et dans l’Union européenne. Les coordonnées de l’hébergeur sont disponibles sur demande.',
        ]],
        ['Propriété intellectuelle', [
          'Le nom, le logo et l’interface de GlobalTrack sont protégés par le droit de la propriété intellectuelle. Les noms et logos des transporteurs cités restent la propriété de leurs détenteurs et sont utilisés uniquement pour identifier les services de suivi.',
        ]],
      ],
    },
  },
}

function LegalShell({ pageKey }) {
  const { locale, t } = useI18n()
  const page = CONTENT[pageKey][locale] ?? CONTENT[pageKey].en

  useEffect(() => {
    setMeta({
      title: `${page.title} | GlobalTrack`,
      description: page.description,
      path: page.path,
    })
  }, [page])

  return (
    <div className="home-shell">
      <nav className="home-nav" aria-label="Main">
        <Link to="/" className="home-logo">GLOBAL<span>TRACK</span></Link>
      </nav>
      <main className="legal-page">
        <h1>{page.title}</h1>
        {page.sections.map(([heading, paragraphs]) => (
          <section key={heading}>
            <h2>{heading}</h2>
            {paragraphs.map((text) => (
              <p key={text.slice(0, 40)}>{text}</p>
            ))}
          </section>
        ))}
        <p className="legal-back">
          <Link to="/">{t('results.newSearch')}</Link>
        </p>
      </main>
      <SiteFooter />
    </div>
  )
}

export const AboutPage = () => <LegalShell pageKey="about" />
export const PrivacyPage = () => <LegalShell pageKey="privacy" />
export const TermsPage = () => <LegalShell pageKey="terms" />
export const LegalNoticePage = () => <LegalShell pageKey="legal" />
