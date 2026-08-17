import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { fetchTracking } from '../api.js'
import Timeline from '../components/Timeline.jsx'
import './ResultsPage.css'

const STATUS_LABELS = {
  PENDING: 'En attente',
  INFO_RECEIVED: 'Informations reçues',
  IN_TRANSIT: 'En transit',
  OUT_FOR_DELIVERY: 'En cours de livraison',
  DELIVERED: 'Livré',
  EXCEPTION: 'Incident',
  RETURNED: 'Retourné',
}

function formatPlace(place) {
  if (!place) return '—'
  if (typeof place === 'string') return place
  return [place.city, place.country].filter(Boolean).join(', ')
}

export default function ResultsPage() {
  const { number } = useParams()
  const [result, setResult] = useState(null)

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

  return (
    <main className="results">
      <header className="results-header">
        <Link to="/" className="back-link">← Nouvelle recherche</Link>
        <h1 className="results-title">Suivi du colis</h1>
        <p className="tracking-number">{number}</p>
      </header>

      {state.loading && <p className="results-info">Chargement…</p>}

      {state.error && (
        <div className="results-error" role="alert">
          <p>{state.error.message}</p>
          <Link to="/">Réessayer avec un autre numéro</Link>
        </div>
      )}

      {state.data && (
        <>
          <section className="shipment-card">
            <div className="shipment-row">
              <span className="shipment-label">Statut</span>
              <span className={`status-badge status-${state.data.shipment.currentStatus}`}>
                {STATUS_LABELS[state.data.shipment.currentStatus] ??
                  state.data.shipment.currentStatus}
              </span>
            </div>
            <div className="shipment-row">
              <span className="shipment-label">Transporteur</span>
              <span>{state.data.carrier.name}</span>
            </div>
            <div className="shipment-row">
              <span className="shipment-label">Origine</span>
              <span>{formatPlace(state.data.shipment.origin)}</span>
            </div>
            <div className="shipment-row">
              <span className="shipment-label">Destination</span>
              <span>{formatPlace(state.data.shipment.destination)}</span>
            </div>
          </section>

          <section className="timeline-section">
            <h2>Historique du transit</h2>
            <Timeline events={state.data.events} />
          </section>
        </>
      )}
    </main>
  )
}
