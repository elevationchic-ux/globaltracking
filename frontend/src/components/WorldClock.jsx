import { useEffect, useMemo, useState } from 'react'
import { useI18n } from '../i18n/I18nContext.jsx'

/**
 * Universal world clock  the real local time of every major logistics hub,
 * ticking live. Pure Intl.DateTimeFormat: no API, no hardcoded offsets,
 * DST handled by the browser's IANA timezone database.
 * Renders as a horizontally scrolling marquee.
 */

const HUBS = [
  { id: 'utc', city: { en: 'UTC', fr: 'UTC', es: 'UTC', de: 'UTC' }, tz: 'UTC' },
  { id: 'lax', city: { en: 'Los Angeles', fr: 'Los Angeles', es: 'Los Ángeles', de: 'Los Angeles' }, tz: 'America/Los_Angeles' },
  { id: 'nyc', city: { en: 'New York', fr: 'New York', es: 'Nueva York', de: 'New York' }, tz: 'America/New_York' },
  { id: 'gru', city: { en: 'São Paulo', fr: 'São Paulo', es: 'São Paulo', de: 'São Paulo' }, tz: 'America/Sao_Paulo' },
  { id: 'lon', city: { en: 'London', fr: 'Londres', es: 'Londres', de: 'London' }, tz: 'Europe/London' },
  { id: 'par', city: { en: 'Paris', fr: 'Paris', es: 'París', de: 'Paris' }, tz: 'Europe/Paris' },
  { id: 'fra', city: { en: 'Frankfurt', fr: 'Francfort', es: 'Fráncfort', de: 'Frankfurt' }, tz: 'Europe/Berlin' },
  { id: 'dxb', city: { en: 'Dubai', fr: 'Dubaï', es: 'Dubái', de: 'Dubai' }, tz: 'Asia/Dubai' },
  { id: 'sin', city: { en: 'Singapore', fr: 'Singapour', es: 'Singapur', de: 'Singapur' }, tz: 'Asia/Singapore' },
  { id: 'sha', city: { en: 'Shanghai', fr: 'Shanghai', es: 'Shanghái', de: 'Shanghai' }, tz: 'Asia/Shanghai' },
  { id: 'tyo', city: { en: 'Tokyo', fr: 'Tokyo', es: 'Tokio', de: 'Tokio' }, tz: 'Asia/Tokyo' },
  { id: 'syd', city: { en: 'Sydney', fr: 'Sydney', es: 'Sídney', de: 'Sydney' }, tz: 'Australia/Sydney' },
]

const LANG = { en: 'en-GB', fr: 'fr-FR', es: 'es-ES', de: 'de-DE' }

/** Format a date in one IANA timezone, returning {time, tzShort, day}. */
function hubTime(date, tz, lang) {
  const parts = new Intl.DateTimeFormat(lang, {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: tz,
    timeZoneName: 'short',
  }).formatToParts(date)
  const time = parts.filter((p) => p.type !== 'timeZoneName').map((p) => p.value).join('')
  const tzShort = parts.find((p) => p.type === 'timeZoneName')?.value ?? ''
  const day = new Intl.DateTimeFormat('en-US', { weekday: 'short', timeZone: tz }).format(date)
  return { time, tzShort, day }
}

function ClockCell({ hub, locale, userDay, now }) {
  const lang = LANG[locale] ?? LANG.en
  const { time, tzShort, day } = hubTime(now, hub.tz, lang)
  return (
    <li className="world-clock-cell">
      <span className="world-clock-city">{hub.city[locale] ?? hub.city.en}</span>
      <span className="world-clock-time">
        {time}
        {day !== userDay && <em className="world-clock-day"> {day}</em>}
      </span>
      <span className="world-clock-tz">{tzShort}</span>
    </li>
  )
}

function ClockSet({ locale, userDay, now }) {
  return (
    <ul className="world-clock-set">
      {HUBS.map((hub) => (
        <ClockCell key={hub.id} hub={hub} locale={locale} userDay={userDay} now={now} />
      ))}
    </ul>
  )
}

export default function WorldClock() {
  const { locale, t } = useI18n()
  const [now, setNow] = useState(() => new Date())

  // Tick every 10 s  enough for minute precision, cheap on battery/CPU.
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 10_000)
    return () => clearInterval(timer)
  }, [])

  const userDay = useMemo(
    () => new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(now),
    [now],
  )

  return (
    <section className="world-clock" aria-label={t('clock.title')}>
      <p className="world-clock-title">🌍 {t('clock.title')}</p>

      {/* Scrolling marquee: duplicate the set for seamless loop */}
      <div className="world-clock-marquee">
        <div className="world-clock-track">
          <ClockSet locale={locale} userDay={userDay} now={now} />
          <ClockSet locale={locale} userDay={userDay} now={now} />
        </div>
      </div>

      <p className="world-clock-note">{t('clock.note')}</p>
    </section>
  )
}
