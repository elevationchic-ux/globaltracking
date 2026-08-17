import './Timeline.css'

function formatPlace(place) {
  if (!place) return ''
  if (typeof place === 'string') return place
  return [place.city, place.country].filter(Boolean).join(', ')
}

function formatDate(timestamp) {
  return new Date(timestamp).toLocaleString('fr-FR', {
    dateStyle: 'long',
    timeStyle: 'short',
  })
}

export default function Timeline({ events }) {
  if (!events?.length) {
    return <p className="timeline-empty">Aucun événement de suivi pour le moment.</p>
  }

  const ordered = [...events].reverse()

  return (
    <ol className="timeline">
      {ordered.map((event, index) => (
        <li
          key={`${event.timestamp}-${index}`}
          className={`timeline-step${index === 0 ? ' timeline-step-current' : ''}`}
        >
          <span className="timeline-marker" aria-hidden="true" />
          <div className="timeline-content">
            <p className="timeline-description">{event.statusDescription}</p>
            <p className="timeline-meta">
              {formatDate(event.timestamp)}
              {formatPlace(event.location) && ` · ${formatPlace(event.location)}`}
            </p>
          </div>
        </li>
      ))}
    </ol>
  )
}
