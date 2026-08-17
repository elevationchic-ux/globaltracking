import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './HomePage.css'

export default function HomePage() {
  const [trackingNumber, setTrackingNumber] = useState('')
  const navigate = useNavigate()

  function handleSubmit(event) {
    event.preventDefault()
    const trimmed = trackingNumber.trim().toUpperCase()
    if (trimmed) navigate(`/track/${encodeURIComponent(trimmed)}`)
  }

  return (
    <main className="home">
      <h1 className="home-title">Suivi de colis</h1>
      <p className="home-subtitle">
        Entrez votre numéro de suivi pour connaître l&apos;état de votre livraison
      </p>
      <form className="search-form" onSubmit={handleSubmit}>
        <input
          className="search-input"
          type="text"
          placeholder="Ex : DEMO123456789"
          value={trackingNumber}
          onChange={(event) => setTrackingNumber(event.target.value)}
          aria-label="Numéro de suivi"
          autoFocus
        />
        <button className="search-button" type="submit" disabled={!trackingNumber.trim()}>
          Suivre
        </button>
      </form>
    </main>
  )
}
