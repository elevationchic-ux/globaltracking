import './Timeline.css'
import { useI18n } from '../i18n/I18nContext.jsx'
import { browserTag } from '../utils/format.js'

function formatPlace(place) {
  if (!place) return ''
  if (typeof place === 'string') return place
  return [place.city, place.country].filter(Boolean).join(', ')
}

// Visitor-locale human format ("Aug 19, 2026, 2:30 PM" / "19 août 2026, 14:30")
//  never the raw developer format.
function formatDate(timestamp, tag) {
  const date = new Date(timestamp)
  if (Number.isNaN(date.getTime())) return timestamp
  return new Intl.DateTimeFormat(tag, { dateStyle: 'long', timeStyle: 'short' }).format(date)
}

export default function Timeline({ events }) {
  const { t, locale } = useI18n()
  const tag = browserTag(locale)

  if (!events?.length) {
    return <p className="timeline-empty">{t('timeline.empty')}</p>
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
              {formatDate(event.timestamp, tag)}
              {formatPlace(event.location) && ` · ${formatPlace(event.location)}`}
            </p>
          </div>
        </li>
      ))}
    </ol>
  )
}
