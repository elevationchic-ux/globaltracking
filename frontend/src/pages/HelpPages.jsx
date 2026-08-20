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
        'Ne payez jamais de « frais de douane » via un lien reçu par SMS d\'un expéditeur inconnu : payez uniquement sur le site officiel du transporteur.',
      ],
    },
    es: {
      title: '¿Qué significa "Customs Clearance" (despacho de aduanas)?',
      short: 'Tu paquete está siendo inspeccionado o gravado en la frontera.',
      meta: 'Tu paquete muestra "Customs Clearance" o "retention en aduanas"? Qué significa, cuánto tarda y cuándo debes pagar aranceles.',
      paragraphs: [
        'Todo paquete que cruza una frontera internacional pasa por la aduana del país de destino. El estado "Customs Clearance" significa que tu paquete llegó a una instalación aduanera (JFK en Nueva York, CDG en París…) y está esperando ser liberado.',
        'La mayoría de los paquetes se despachan en pocas horas a 2 días sin acción necesaria. Los escaneos como "Import clearance started" son pasos normales.',
        'Si el estado cambia a "Held in customs" o menciona una tarifa, se deben aranceles de importación o IVA. El transportista muestra el monto y permite pagar en línea; una vez pagado, el paquete se libera generalmente en 24 horas.',
        'Si la retención dura más de 5 días, contacta al transportista con tu número de seguimiento: puede faltar una factura o un artículo requerir documentos del vendedor.',
      ],
      tips: [
        'Guarda la confirmación del pedido / factura, la aduana spesso la solicita.',
        'Nunca pagues "gastos de aduana" a través de enlaces recibidos por SMS de remitentes desconocidos.',
      ],
    },
    de: {
      title: 'Was bedeutet "Customs Clearance" (Zollabfertigung)?',
      short: 'Ihr Paket wird an der Grenze inspiziert oder besteuert.',
      meta: 'Ihr Paket zeigt "Customs Clearance" oder "Im Zoll festgehalten"? Was es bedeutet, wie lange es dauert und wann Sie Einfuhrabgaben zahlen müssen.',
      paragraphs: [
        'Jedes Paket, das eine internationale Grenze überquert, durchläuft den Zoll des Ziellandes. Der Status "Customs Clearance" bedeutet, dass Ihr Paket in einer Zolleinrichtung eingetroffen ist und auf Freigabe wartet.',
        'Die meisten Pakete werden innerhalb weniger Stunden bis 2 Tage ohne Aktion abgefertigt. Scans wie "Import clearance started" sind normale Zwischenschritte.',
        'Wenn der Status zu "Held in customs" wird oder eine Gebühr erwähnt, sind Einfuhrzölle oder MwSt. fällig. Der Spediteur zeigt den Betrag an und ermöglicht Online-Zahlung – nach Zahlung wird das Paket normalerweise innerhalb von 24 Stunden freigegeben.',
        'Wenn die Festhaltung länger als 5 Tage dauert, kontaktieren Sie den Spediteur mit Ihrer Sendungsnummer.',
      ],
      tips: [
        'Bewahren Sie die Bestellbestätigung / Rechnung auf – der Zoll fordert sie oft an.',
        'Zahlen Sie niemals "Zollgebühren" über per SMS erhaltene Links von unbekannten Absendern.',
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
        'Vérifiez l\'adresse fournie au vendeur  les fautes de frappe sont la cause n°1.',
        'Un incident après « Out for delivery » signifie en général une nouvelle tentative le jour ouvré suivant.',
      ],
    },
    es: {
      title: '¿Qué significa "Delivery Exception" (incidencia de entrega)?',
      short: 'Algo interrumpió la entrega, generalmente es solucionable.',
      meta: 'Tu seguimiento muestra una excepción de entrega? Qué significa, las causas más frecuentes y cómo reaccionar.',
      paragraphs: [
        'Una "Delivery Exception" significa que el flujo normal de entrega se interrumpió. No significa que tu paquete esté perdido, el transportista necesita información o tiempo para continuar.',
        'Las causas más comunes: dirección incompleta o incorrecta, intento de entrega fallido, retención en aduana, interrupción climática o etiqueta dañada.',
        'Consulta el detalle de la excepción en tu página de seguimiento: GlobalTrack muestra la razón y ofrece acciones como reprogramar o corregir la dirección.',
        'En la mayoría de los casos, el transportista reintenta automáticamente en 1-3 días hábiles. Si la excepción no tiene detalle después de 48 horas, contacta al transportista.',
      ],
      tips: [
        'Verifica la dirección proporcionada al vendedor, los errores tipográficos son la causa n°1.',
        'Una incidencia después de "Out for delivery" generalmente significa un nuevo intento al día hábil siguiente.',
      ],
    },
    de: {
      title: 'Was bedeutet "Delivery Exception" (Lieferausnahme)?',
      short: 'Etwas hat die Lieferung unterbrochen – es ist normalerweise behebbar.',
      meta: 'Ihr Tracking zeigt eine Lieferausnahme? Was der Status bedeutet, die häufigsten Ursachen und wie Sie reagieren.',
      paragraphs: [
        'Eine "Delivery Exception" bedeutet, dass der normale Lieferfluss unterbrochen wurde. Es bedeutet nicht, dass Ihr Paket verloren ist – der Spediteur benötigt Informationen oder Zeit.',
        'Die häufigsten Ursachen: unvollständige oder falsche Adresse, fehlgeschlagener Zustellversuch, Zollfesthaltung, Wetterstörung oder beschädigtes Etikett.',
        'Überprüfen Sie die Ausnahmedetails auf Ihrer Tracking-Seite: GlobalTrack zeigt den Grund und bietet Aktionen wie Umbuchung oder Adresskorrektur.',
        'In den meisten Fällen unternimmt der Spediteur automatisch innerhalb von 1-3 Werktagen einen neuen Versuch.',
      ],
      tips: [
        'Überprüfen Sie die dem Verkäufer angegebene Adresse – Tippfehler sind Ursache Nr. 1.',
        'Eine Ausnahme nach "Out for delivery" bedeutet normalerweise einen neuen Versuch am nächsten Werktag.',
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
        'Consultez la carte de tentative de livraison pour l\'adresse du point relais et le code PIN le cas échéant.',
      ],
    },
    es: {
      title: '¿Qué significa "Out for Delivery" (en reparto)?',
      short: 'Tu paquete está en la furgoneta del repartidor, esperalo hoy.',
      meta: 'Tu paquete está en reparto: qué significa el estado, horarios habituales y qué pasa si no estás en casa.',
      paragraphs: [
        '"Out for delivery" significa que tu paquete salió del depósito local esta mañana y está cargado en el vehículo de un repartidor. La entrega ocurre el mismo día, generalmente entre las 8:00 y las 20:00.',
        'En redes compatibles (DPD Predict, UPS MyChoice, PostNL…), la página de seguimiento precisa la ventana a una hora.',
        'Si no estás en casa, el repartidor deja el paquete en un lugar seguro, con un vecino o lo lleva a un punto de recogida.',
        'Si el estado permanece "Out for delivery" pasada la noche, la ruta se extendió: espera un nuevo intento al día hábil siguiente.',
      ],
      tips: [
        'Mantén tu teléfono cerca, los repartidores suelen llamar o enviar SMS.',
        'Consulta la tarjeta de intento de entrega para la dirección del punto de recogida.',
      ],
    },
    de: {
      title: 'Was bedeutet "Out for Delivery" (in Zustellung)?',
      short: 'Ihr Paket ist im Lieferfahrzeug – erwarten Sie es heute.',
      meta: 'Ihr Paket ist in Zustellung: was der Status bedeutet, übliche Lieferzeiten und was passiert wenn Sie nicht zu Hause sind.',
      paragraphs: [
        '"Out for delivery" bedeutet, dass Ihr Paket das lokale Depot verlassen hat und im Fahrzeug eines Zustellers geladen ist. Die Zustellung erfolgt am selben Tag, normalerweise zwischen 8:00 und 20:00 Uhr.',
        'Bei unterstützten Netzwerken (DPD Predict, UPS MyChoice, PostNL…) wird das Zeitfenster auf eine Stunde präzisiert.',
        'Wenn Sie nicht zu Hause sind, hinterlässt der Zusteller das Paket an einem sicheren Ort, bei einem Nachbarn oder bringt es zu einem Abholpunkt.',
        'Wenn der Status "Out for delivery" abends unverändert bleibt, wurde die Route verlängert: neuer Versuch am nächsten Werktag.',
      ],
      tips: [
        'Halten Sie Ihr Telefon bereit – Zusteller rufen oft an oder senden SMS.',
        'Überprüfen Sie die Zustellkarte für die Abholpunkt-Adresse.',
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
        'L\'ETA affichée sur votre page de suivi intègre déjà le délai habituel de relais frontière.',
        'Le fret aérien peut être dérouté pour cause de météo  un jour de silence est fréquent.',
      ],
    },
    es: {
      title: '¿Qué significa "In Transit" (en tránsito)?',
      short: 'Tu paquete se mueve entre centros hacia ti.',
      meta: 'Tu seguimiento muestra "In Transit" sin nuevo escaneo? Qué significa, por qué se pausan los escaneos y cuándo preocuparse.',
      paragraphs: [
        '"In Transit" significa que el transportista tiene tu paquete y circula por la red, en camión entre depósitos o en avión entre países.',
        'Los escaneos no son continuos: entre dos centros (ej. Shanghái → París CDG), un paquete puede viajar 24-72 horas sin nuevo escaneo. Esto es normal.',
        'Los paquetes internacionales también cambian de transportista en la frontera. GlobalTrack sigue el relevo automáticamente.',
        'Preocúpate solo si el estado no cambia más de 7 días (internacional) o 3 días (nacional) – entonces contacta al transportista.',
      ],
      tips: [
        'La ETA en tu página de seguimiento ya incluye el retraso habitual de relevo fronterizo.',
        'El carga aérea puede desviarse por clima – un día de silencio es común.',
      ],
    },
    de: {
      title: 'Was bedeutet "In Transit" (in Transit)?',
      short: 'Ihr Paket bewegt sich zwischen Hubs zu Ihnen.',
      meta: 'Ihr Tracking zeigt "In Transit" ohne neuen Scan? Was der Status bedeutet, warum Scans pausieren und wann Sie sich Sorgen machen sollten.',
      paragraphs: [
        '"In Transit" bedeutet, dass der Spediteur Ihr Paket hat und es sich durch das Netzwerk bewegt – per LKW zwischen Depots oder per Flugzeug zwischen Ländern.',
        'Scans sind nicht kontinuierlich: zwischen zwei Hubs (z.B. Shanghai → Paris CDG) kann ein Paket 24-72 Stunden ohne neuen Scan reisen. Das ist normal.',
        'Internationale Pakete wechseln auch an der Grenze den Spediteur. GlobalTrack verfolgt den Wechsel automatisch.',
        'Sorgen Sie sich nur, wenn sich der Status länger als 7 Tage (international) oder 3 Tage (national) nicht ändert.',
      ],
      tips: [
        'Die ETA auf Ihrer Tracking-Seite berücksichtigt bereits die übliche Grenzübergabe-Verzögerung.',
        'Luftfracht kann wetterbedingt umgeleitet werden – ein Tag Stille ist häufig.',
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
        'Un statut « étiquette seule » pendant des jours est le signal n°1 d\'arnaque dropshipping.',
        'Faites une capture de l\'historique avant d\'ouvrir un litige avec le vendeur ou la plateforme.',
      ],
    },
    es: {
      title: '¿Qué significa "Shipment information received"?',
      short: 'La etiqueta se creó pero el transportista aún no tiene el paquete.',
      meta: 'Tu seguimiento dice "Shipment information received" y nada se mueve? Qué significa y cuándo envió realmente el vendedor.',
      paragraphs: [
        '"Shipment information received" (o "Label created") significa que el vendedor generó una etiqueta de envío, pero el transportista aún no ha recibido físicamente el paquete.',
        'Este es el estado a vigilar cuando sospechas que un vendedor no envió: debería evolucionar a "Picked up" en 1-3 días hábiles.',
        'Si permanece así por más de 5 días hábiles, contacta al vendedor y usa el botón de "Reportar paquete sospechoso".',
        'Nota: algunas marketplaces generan etiquetas en masa; el viaje real comienza en el primer escaneo "Picked up" o de hub.',
      ],
      tips: [
        'Un estado de solo etiqueta durante días es la señal n°1 de estafa de dropshipping.',
        'Haz una captura del historial antes de abrir una disputa.',
      ],
    },
    de: {
      title: 'Was bedeutet "Shipment information received"?',
      short: 'Das Etikett wurde erstellt, aber der Spediteur hat das Paket noch nicht.',
      meta: 'Ihr Tracking sagt "Shipment information received" und nichts bewegt sich? Was es bedeutet und wann der Verkäufer wirklich versendet hat.',
      paragraphs: [
        '"Shipment information received" (oder "Label Created") bedeutet, dass der Verkäufer ein Versandetikett erstellt hat, aber der Spediteur das Paket noch nicht physisch erhalten hat.',
        'Dies ist der Status, den Sie beobachten sollten, wenn Sie vermuten, dass ein Verkäufer nicht versendet hat: er sollte innerhalb von 1-3 Werktagen zu "Picked up" werden.',
        'Wenn es länger als 5 Werktage unverändert bleibt, kontaktieren Sie den Verkäufer.',
        'Hinweis: Einige Marketplaces generieren Etiketten in Massen; die echte Reise beginnt beim ersten "Picked up" oder Hub-Scan.',
      ],
      tips: [
        'Ein Nur-Etikett-Status über Tage ist das Nr. 1 Dropshipping-Betrugssignal.',
        'Machen Sie einen Screenshot des Verlaufs bevor Sie einen Streit eröffnen.',
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
    es: {
      title: '¿Marcado "Entregado" pero nada recibido?',
      short: 'Verifica vecinos, puntos de recogida y prueba de entrega.',
      meta: 'Tu seguimiento dice entregado pero no recibiste nada? Las 5 verificaciones antes de contactar al transportista o vendedor.',
      paragraphs: [
        'Cuando el seguimiento dice "Delivered", el transportista registró una prueba de entrega: firma, foto o posición GPS. Consúltala primero – GlobalTrack la muestra cuando está disponible.',
        'Verifica en orden: la recepción de tu edificio, vecinos, el aviso de paso en tu buzón, y cualquier punto de recogida mencionado en los últimos escaneos.',
        'Los repartidores a veces escanean "Delivered" hasta 24 horas antes de la entrega real – si nada aparece al día siguiente, contacta al transportista.',
        'Si el transportista confirma la entrega en la dirección correcta y aún no tienes nada, abre una disputa con el vendedor: el vendedor es legalmente responsable hasta que recibas físicamente los bienes.',
      ],
      tips: [
        'La posición GPS de la prueba de entrega revela si la entrega fue en tu dirección.',
        'Actúa rápido: la mayoría de las plataformas cierran disputas 30 días después de "entregado".',
      ],
    },
    de: {
      title: 'Als "Zugestellt" markiert, aber nichts erhalten?',
      short: 'Überprüfen Sie Nachbarn, Abholpunkte und den Liefernachweis.',
      meta: 'Ihr Tracking sagt zugestellt, aber Sie haben nichts erhalten? Die 5 Überprüfungen bevor Sie den Spediteur oder Verkäufer kontaktieren.',
      paragraphs: [
        'Wenn das Tracking "Delivered" anzeigt, hat der Spediteur einen Liefernachweis erfasst: Unterschrift, Foto oder GPS-Position. Überprüfen Sie diese zuerst – GlobalTrack zeigt sie an, wenn verfügbar.',
        'Überprüfen Sie der Reihe nach: Ihr Gebäude-Foyer, Nachbarn, den Zustellhinweis in Ihrem Briefkasten und jeden erwähnten Abholpunkt.',
        'Zusteller scannen manchmal "Delivered" bis zu 24 Stunden vor der tatsächlichen Übergabe – wenn bis zum nächsten Abend nichts erscheint, kontaktieren Sie den Spediteur.',
        'Wenn der Spediteur die Lieferung an die richtige Adresse bestätigt und Sie immer noch nichts haben, eröffnen Sie einen Streit beim Verkäufer.',
      ],
      tips: [
        'Die GPS-Position des Liefernachweises zeigt, ob die Zustellung an Ihrer Adresse erfolgte.',
        'Handeln Sie schnell: die meisten Plattformen schließen Streitigkeiten 30 Tage nach "zugestellt".',
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
