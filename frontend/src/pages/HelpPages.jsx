import { useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useI18n } from '../i18n/I18nContext.jsx'
import { setMeta, useJsonLd } from '../utils/seo.js'
import SiteFooter from '../components/SiteFooter.jsx'

/**
 * Status lexicon  mini-articles answering what each carrier status means.
 * Captures the huge search volume of stressed users ("Exception customs JFK",
 * "colis en attente douane", "out for delivery how long").
 */

const TOPICS = [
  {
    slug: 'customs-clearance',
    en: {
      title: 'What does "Customs Clearance" mean?',
      short: 'Your parcel is being inspected or taxed at the border.',
      meta: 'Your parcel shows "Customs Clearance" or "Held in customs"? What it means, how long it takes, and when you must pay import duty.',
      paragraphs: [
        'Every parcel crossing an international border passes through the destination country’s customs. The "Customs Clearance" status means your package arrived at a customs facility (JFK in New York, CDG in Paris, YVR in Vancouver…) and is waiting to be released.',
        'Most parcels clear customs in a few hours to 2 days with no action needed. Scans like "Import clearance started" or "Processed through facility" are normal intermediate steps.',
        'If the status becomes "Held in customs" or mentions a fee, import duty or VAT is due. The carrier (or GlobalTrack’s customs card when supported) shows the amount and lets you pay online  once paid, the parcel is usually released within 24 hours.',
        'If the hold lasts more than 5 days, contact the carrier with your tracking number: a missing invoice or restricted item may require documents from the seller.',
      ],
      tips: [
        'Keep the order confirmation / invoice  customs often asks for it.',
        'Never pay "customs fees" through links received by SMS from unknown senders: pay only on the official carrier site.',
      ],
    },
    fr: {
      title: 'Que signifie « Customs Clearance » (dédouanement) ?',
      short: 'Votre colis est inspecté ou taxé à la frontière.',
      meta: 'Votre colis affiche « Customs Clearance » ou « retenu en douane » ? Signification, délais et paiement des frais de douane.',
      paragraphs: [
        'Tout colis qui franchit une frontière internationale passe par la douane du pays de destination. Le statut « Customs Clearance » signifie que votre paquet est arrivé dans un centre douanier (JFK à New York, CDG à Paris, YVR à Vancouver…) et attend sa libération.',
        'La plupart des colis sont dédouanés en quelques heures à 2 jours, sans aucune action. Les scans « Import clearance started » ou « Processed through facility » sont des étapes normales.',
        'Si le statut devient « Held in customs » ou mentionne des frais, des droits de douane ou la TVA sont dus. Le transporteur (ou la carte douane de GlobalTrack si disponible) affiche le montant et permet de payer en ligne  une fois payé, le colis est généralement libéré sous 24 h.',
        'Si le blocage dépasse 5 jours, contactez le transporteur avec votre numéro de suivi : une facture manquante ou un article réglementé peut exiger des documents du vendeur.',
      ],
      tips: [
        'Gardez la confirmation de commande / facture  la douane la demande souvent.',
        'Ne payez jamais de « frais de douane » via un lien reçu par SMS d’un expéditeur inconnu : payez uniquement sur le site officiel du transporteur.',
      ],
    },
  },
  {
    slug: 'exception',
    en: {
      title: 'What does "Delivery Exception" mean?',
      short: 'Something interrupted delivery  it is usually fixable.',
      meta: 'Your tracking shows a delivery exception? What the status means, the most common causes (address, customs, weather) and how to react.',
      paragraphs: [
        'A "Delivery Exception" means the normal delivery flow was interrupted. It does not mean your parcel is lost  it means the carrier needs information or time to continue.',
        'The most common causes: incomplete or wrong address, failed delivery attempt (nobody home), customs hold, weather disruption, or a damaged label.',
        'Check the exception detail on your tracking page: GlobalTrack shows the reason and offers actions like rescheduling or fixing the address when the carrier supports it.',
        'In most cases the carrier automatically retries within 1–3 business days. If the exception has no detail after 48 hours, contact the carrier with your tracking number.',
      ],
      tips: [
        'Verify the shipping address you gave the seller  typos are cause #1.',
        'An exception after "Out for delivery" usually means a new attempt happens the next business day.',
      ],
    },
    fr: {
      title: 'Que signifie « Delivery Exception » (incident de livraison) ?',
      short: 'Un événement a interrompu la livraison  c’est généralement corrigeable.',
      meta: 'Votre suivi affiche un incident de livraison ? Signification du statut, causes fréquentes (adresse, douane, météo) et comment réagir.',
      paragraphs: [
        'Une « Delivery Exception » signifie que le déroulement normal de la livraison a été interrompu. Cela ne veut pas dire que votre colis est perdu  le transporteur a besoin d’information ou de temps pour continuer.',
        'Causes les plus fréquentes : adresse incomplète ou erronée, tentative de livraison échouée (absence), retenue en douane, perturbation météo ou étiquette endommagée.',
        'Consultez le détail de l’incident sur votre page de suivi : GlobalTrack affiche la raison et propose des actions comme replanifier ou corriger l’adresse quand le transporteur le permet.',
        'Dans la plupart des cas, le transporteur retente automatiquement sous 1 à 3 jours ouvrés. Si l’incident n’a pas de détail après 48 h, contactez le transporteur avec votre numéro de suivi.',
      ],
      tips: [
        'Vérifiez l’adresse fournie au vendeur  les fautes de frappe sont la cause n°1.',
        'Un incident après « Out for delivery » signifie en général une nouvelle tentative le jour ouvré suivant.',
      ],
    },
  },
  {
    slug: 'out-for-delivery',
    en: {
      title: 'What does "Out for Delivery" mean?',
      short: 'Your parcel is on the courier’s van  expect it today.',
      meta: 'Your package is out for delivery: what the status means, the usual delivery hours and what happens if you are not home.',
      paragraphs: [
        '"Out for delivery" means your parcel left the local depot this morning and is loaded on a courier’s vehicle. Delivery typically happens the same day, between 8:00 and 20:00 depending on the carrier.',
        'On supported networks (DPD Predict, UPS MyChoice, PostNL…), the tracking page narrows this down to a one-hour time slot and sometimes the courier’s remaining stops.',
        'If you are not home, the courier either leaves the parcel in a safe place, with a neighbor, or takes it to a nearby pickup point  the next scan tells you exactly where.',
        'If the status stays "Out for delivery" past evening, it usually means the route ran long: expect a new attempt the next business day.',
      ],
      tips: [
        'Keep your phone nearby  couriers often call or text at the door.',
        'Check the delivery attempt card for the pickup point address and PIN if applicable.',
      ],
    },
    fr: {
      title: 'Que signifie « Out for Delivery » (en cours de livraison) ?',
      short: 'Votre colis est dans le camion du livreur  attendez-le aujourd’hui.',
      meta: 'Votre colis est en cours de livraison : signification du statut, horaires habituels et ce qui se passe si vous êtes absent.',
      paragraphs: [
        '« Out for delivery » signifie que votre colis a quitté le dépôt local ce matin et est chargé dans le véhicule d’un livreur. La livraison a lieu le jour même, en général entre 8 h et 20 h selon le transporteur.',
        'Sur les réseaux compatibles (DPD Predict, UPS MyChoice, PostNL…), la page de suivi précise ce créneau à une heure près, et parfois le nombre d’arrêts restants du livreur.',
        'Si vous êtes absent, le livreur dépose le colis dans un endroit sûr, chez un voisin ou l’emmène dans un point relais proche  le scan suivant vous indique exactement où.',
        'Si le statut reste « Out for delivery » tard le soir, la tournée a probablement débordé : une nouvelle tentative a lieu le jour ouvré suivant.',
      ],
      tips: [
        'Gardez votre téléphone à portée  les livreurs appellent ou envoient un SMS à la porte.',
        'Consultez la carte de tentative de livraison pour l’adresse du point relais et le code PIN le cas échéant.',
      ],
    },
  },
  {
    slug: 'in-transit',
    en: {
      title: 'What does "In Transit" mean?',
      short: 'Your parcel is moving between hubs toward you.',
      meta: 'Your tracking shows "In Transit" with no new scan? What the status means, why scans pause, and when to worry.',
      paragraphs: [
        '"In Transit" means the carrier has your parcel and it is moving through the network  by truck between depots or by plane between countries.',
        'Scans are not continuous: between two hubs (e.g. Shanghai → Paris CDG), a parcel can travel 24–72 hours without any new scan. This is normal and does not mean it is stuck.',
        'International parcels also change carriers at the border (China Post → Colissimo, Royal Mail → Canada Post). GlobalTrack follows the hand-off automatically.',
        'Worry only if the status does not change for more than 7 days (international) or 3 days (domestic)  then contact the carrier.',
      ],
      tips: [
        'The ETA on your tracking page already accounts for the usual border hand-off delay.',
        'Air freight can be rerouted for weather  a day of silence is common.',
      ],
    },
    fr: {
      title: 'Que signifie « In Transit » (en transit) ?',
      short: 'Votre colis circule entre les hubs, vers chez vous.',
      meta: 'Votre suivi affiche « In Transit » sans nouveau scan ? Signification du statut, pourquoi les scans s’arrêtent et quand s’inquiéter.',
      paragraphs: [
        '« In Transit » signifie que le transporteur a votre colis et qu’il circule dans le réseau  par camion entre dépôts ou par avion entre pays.',
        'Les scans ne sont pas continus : entre deux hubs (ex. Shanghai → Paris CDG), un colis peut voyager 24 à 72 h sans aucun nouveau scan. C’est normal et ne signifie pas qu’il est bloqué.',
        'Les colis internationaux changent aussi de transporteur à la frontière (China Post → Colissimo, Royal Mail → Postes Canada). GlobalTrack suit ce relais automatiquement.',
        'Ne vous inquiétez que si le statut ne change pas pendant plus de 7 jours (international) ou 3 jours (domestique)  contactez alors le transporteur.',
      ],
      tips: [
        'L’ETA affichée sur votre page de suivi intègre déjà le délai habituel de relais frontière.',
        'Le fret aérien peut être dérouté pour cause de météo  un jour de silence est fréquent.',
      ],
    },
  },
  {
    slug: 'info-received',
    en: {
      title: 'What does "Shipment information received" mean?',
      short: 'The label was created but the carrier has not picked up yet.',
      meta: 'Your tracking says "Shipment information received" and nothing moves? What the status means and when the seller actually shipped.',
      paragraphs: [
        '"Shipment information received" (or "Label created") means the seller generated a shipping label, but the carrier has not physically received the parcel yet.',
        'This is the status to watch when you suspect a seller of not shipping: it should evolve to "Picked up" within 1–3 business days.',
        'If it stays there for more than 5 business days, contact the seller  and use the "Report suspicious package" button so other buyers are warned.',
        'Note: some marketplaces generate labels in bulk; the real journey starts at the first "Picked up" or hub scan.',
      ],
      tips: [
        'A label-only status for days is the #1 dropshipping scam signal.',
        'Screenshot the status history before opening a dispute with the seller or platform.',
      ],
    },
    fr: {
      title: 'Que signifie « Shipment information received » ?',
      short: 'L’étiquette est créée mais le transporteur n’a pas encore le colis.',
      meta: 'Votre suivi affiche « Shipment information received » et rien ne bouge ? Signification du statut et moment réel de l’expédition.',
      paragraphs: [
        '« Shipment information received » (ou « Label created ») signifie que le vendeur a généré une étiquette d’expédition, mais que le transporteur n’a pas encore physiquement reçu le colis.',
        'C’est le statut à surveiller si vous soupçonnez un vendeur de ne pas expédier : il doit évoluer vers « Picked up » sous 1 à 3 jours ouvrés.',
        'S’il reste inchangé plus de 5 jours ouvrés, contactez le vendeur  et utilisez le bouton « Signaler ce colis / vendeur suspect » pour prévenir les autres acheteurs.',
        'Note : certaines marketplaces génèrent des étiquettes en masse ; le vrai trajet commence au premier scan « Picked up » ou hub.',
      ],
      tips: [
        'Un statut « étiquette seule » pendant des jours est le signal n°1 d’arnaque dropshipping.',
        'Faites une capture de l’historique avant d’ouvrir un litige avec le vendeur ou la plateforme.',
      ],
    },
  },
  {
    slug: 'delivered',
    en: {
      title: 'Marked "Delivered" but nothing received?',
      short: 'Check neighbors, pickup points and the proof of delivery.',
      meta: 'Your tracking says delivered but you received nothing? The 5 things to check before contacting the carrier or the seller.',
      paragraphs: [
        'When tracking says "Delivered", the carrier recorded a proof of delivery: signature, photo, or GPS position at the drop point. Check it first  GlobalTrack shows it on the tracking page when available.',
        'Check in order: your building’s lobby / parcel room, neighbors, the delivery notice in your mailbox, and any pickup point mention in the last scans.',
        'Couriers occasionally scan "Delivered" up to 24 hours before the actual drop  if nothing appears by the next evening, contact the carrier with the tracking number.',
        'If the carrier confirms delivery to the right address and you still have nothing, open a dispute with the seller: the seller is legally responsible until you physically receive the goods (EU consumer law).',
      ],
      tips: [
        'The GPS position on the proof of delivery reveals if the drop happened at your address.',
        'Act fast: most seller platforms close disputes 30 days after "delivered".',
      ],
    },
    fr: {
      title: 'Marqué « Livré » mais rien reçu ?',
      short: 'Vérifiez voisins, point relais et preuve de livraison.',
      meta: 'Votre suivi indique livré mais vous n’avez rien reçu ? Les 5 vérifications à faire avant de contacter le transporteur ou le vendeur.',
      paragraphs: [
        'Quand le suivi indique « Delivered », le transporteur a enregistré une preuve de livraison : signature, photo ou position GPS au point de dépôt. Consultez-la en premier  GlobalTrack l’affiche sur la page de suivi quand elle existe.',
        'Vérifiez dans l’ordre : le hall / la consigne de votre immeuble, les voisins, l’avis de passage dans votre boîte aux lettres, et toute mention de point relais dans les derniers scans.',
        'Il arrive qu’un livreur scanne « Delivered » jusqu’à 24 h avant le dépôt réel  si rien n’apparaît avant le lendemain soir, contactez le transporteur avec le numéro de suivi.',
        'Si le transporteur confirme une livraison à la bonne adresse et que vous n’avez toujours rien, ouvrez un litige auprès du vendeur : le vendeur est légalement responsable jusqu’à ce que vous receviez physiquement le bien (droit de la consommation UE).',
      ],
      tips: [
        'La position GPS de la preuve de livraison révèle si le dépôt a bien eu lieu chez vous.',
        'Agissez vite : la plupart des plateformes ferment les litiges 30 jours après « livré ».',
      ],
    },
  },
]

export const HELP_TOPICS = TOPICS

export function HelpIndexPage() {
  const { locale } = useI18n()

  useEffect(() => {
    setMeta({
      title:
        locale === 'fr'
          ? 'Aide : comprendre les statuts de suivi | GlobalTrack'
          : 'Help: understand tracking statuses | GlobalTrack',
      description:
        locale === 'fr'
          ? 'Customs clearance, exception, out for delivery… Chaque statut de suivi expliqué simplement, avec les bons réflexes.'
          : 'Customs clearance, exception, out for delivery… Every tracking status explained simply, with the right reflexes.',
      path: '/help',
    })
  }, [locale])

  return (
    <div className="home-shell">
      <nav className="home-nav" aria-label="Main">
        <Link to="/" className="home-logo">GLOBAL<span>TRACK</span></Link>
      </nav>
      <main className="seo-page">
        <h1>{locale === 'fr' ? 'Comprendre les statuts de suivi' : 'Understand tracking statuses'}</h1>
        <div className="carrier-grid">
          {TOPICS.map((topic) => (
            <Link key={topic.slug} className="carrier-card" to={`/help/${topic.slug}/`}>
              <strong>{topic[locale]?.title ?? topic.en.title}</strong>
              <span>{topic[locale]?.short ?? topic.en.short}</span>
            </Link>
          ))}
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}

export function HelpArticlePage() {
  const { locale } = useI18n()
  const { slug } = useParams()
  const topic = TOPICS.find((t) => t.slug === slug)
  const content = topic ? (topic[locale] ?? topic.en) : null

  useEffect(() => {
    if (!content) return
    setMeta({
      title: `${content.title} | GlobalTrack`,
      description: content.meta,
      path: `/help/${slug}/`,
    })
  }, [content, slug])

  useJsonLd(
    content && {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: content.title,
      description: content.meta,
      inLanguage: locale,
    },
  )

  if (!topic) {
    return (
      <div className="home-shell">
        <main className="seo-page">
          <h1>Not found</h1>
          <p>
            <Link to="/help">{locale === 'fr' ? 'Tous les statuts' : 'All statuses'}</Link>
          </p>
        </main>
      </div>
    )
  }

  return (
    <div className="home-shell">
      <nav className="home-nav" aria-label="Main">
        <Link to="/" className="home-logo">GLOBAL<span>TRACK</span></Link>
        <Link to="/help" className="nav-mission">↩</Link>
      </nav>
      <main className="seo-page">
        <h1>{content.title}</h1>
        <p className="seo-subtitle">{content.short}</p>
        {content.paragraphs.map((text) => (
          <p key={text.slice(0, 40)} className="seo-paragraph">{text}</p>
        ))}
        <section className="seo-section">
          <h2>{locale === 'fr' ? 'Bons réflexes' : 'Good reflexes'}</h2>
          <ul className="seo-steps">
            {content.tips.map((tip) => (
              <li key={tip.slice(0, 30)}>{tip}</li>
            ))}
          </ul>
        </section>
        <section className="seo-section">
          <h2>{locale === 'fr' ? 'Autres statuts expliqués' : 'Other statuses explained'}</h2>
          <ul className="seo-carrier-links">
            {TOPICS.filter((t) => t.slug !== topic.slug).map((t) => (
              <li key={t.slug}>
                <Link to={`/help/${t.slug}/`}>{t[locale]?.title ?? t.en.title}</Link>
              </li>
            ))}
          </ul>
        </section>
      </main>
      <SiteFooter />
    </div>
  )
}
