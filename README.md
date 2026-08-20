# Tracking App  Suivi de colis

Socle d'application de suivi de colis : API Node.js/Express + frontend React (Vite).

## Architecture

```
tracking-app/
├── backend/            # API Express (ESM)
│   ├── src/
│   │   ├── models/     # Shipment, TrackingEvent
│   │   ├── carriers/   # Adaptateurs transporteurs (pattern extensible)
│   │   ├── routes/     # GET /api/track/:number, GET /api/carriers
│   │   └── data/       # Store en mémoire avec données de démo
│   ├── Dockerfile      # Image optimisée pour Railway
│   └── railway.json    # Config de déploiement Railway
├── frontend/           # React + Vite + React Router
│   └── src/
│       ├── pages/      # HomePage (recherche), ResultsPage (timeline)
│       └── components/ # Timeline (stepper vertical)
└── docker-compose.yml  # Environnement local complet
```

## Démarrage rapide (local)

### Option A  sans Docker

```bash
# Terminal 1 : backend (port 3001)
cd backend && npm install && npm run dev

# Terminal 2 : frontend (port 5173, proxy /api vers le backend)
cd frontend && npm install && npm run dev
```

### Option B  avec Docker

```bash
docker compose up --build
```

Ouvrir http://localhost:5173 puis tester avec les numéros de démo :
`DEMO123456789` (en transit) ou `DEMO987654321` (livré).

## API

| Méthode | Route                | Description                                  |
| ------- | -------------------- | -------------------------------------------- |
| GET     | `/api/track/:number` | Suivi d'un colis (shipment + événements)     |
| GET     | `/api/carriers`      | Liste des transporteurs intégrés             |
| GET     | `/health`            | Healthcheck (utilisé par Railway)            |

Réponse de `/api/track/:number` :

```json
{
  "carrier": { "code": "demo", "name": "Demo Carrier" },
  "shipment": {
    "trackingNumber": "DEMO123456789",
    "carrier": "demo",
    "currentStatus": "IN_TRANSIT",
    "origin": { "city": "Paris", "country": "FR" },
    "destination": { "city": "Cotonou", "country": "BJ" }
  },
  "events": [
    {
      "shipmentId": "DEMO123456789",
      "timestamp": "2026-08-12T09:15:00.000Z",
      "location": { "city": "Paris", "country": "FR" },
      "statusDescription": "Colis pris en charge par le transporteur",
      "status": "INFO_RECEIVED"
    }
  ]
}
```

## Intégrer un nouveau transporteur

1. Créer une classe qui étend `CarrierAdapter` (`backend/src/carriers/CarrierAdapter.js`) :
   implémenter `code`, `name`, `matches(trackingNumber)` (détection du format) et
   `track(trackingNumber)` (appel API + normalisation en `{ shipment, events }`).
2. L'enregistrer dans `backend/src/carriers/registry.js`.

## Déploiement sur Railway

1. Créer un service Railway pointant sur le dossier `backend/` (Root Directory).
2. Railway détecte le `Dockerfile` automatiquement (`railway.json` fournit
   le healthcheck `/health` et la politique de redémarrage).
3. Définir `CORS_ORIGIN` avec l'URL du frontend en production.
4. Déployer le frontend (Vercel, Netlify, Railway static) avec
   `VITE_API_URL` pointant vers l'URL du backend.
