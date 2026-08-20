import { useState } from 'react'
import { useI18n } from '../i18n/I18nContext.jsx'

const REPORTS_KEY = 'globaltrack:reports'

/**
 * Anti-scam reassurance: GlobalTrack is an independent tracking tool 
 * neither the seller nor the carrier. Prevents support emails from users
 * who believe we hold their parcel.
 */
export function Disclaimer() {
  const { t } = useI18n()
  return (
    <aside className="disclaimer" role="note">
      <strong className="disclaimer-title">ⓘ {t('trust.disclaimer.title')}</strong>
      <p>{t('trust.disclaimer.body')}</p>
    </aside>
  )
}

/**
 * "Report this package / suspicious seller"  crowdsourced fraud signal.
 * Reports are persisted locally; repeated signals on the same number can
 * later feed a caution-alert system.
 */
export function ReportButton({ trackingNumber }) {
  const { t } = useI18n()
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [done, setDone] = useState(false)

  function submit(event) {
    event.preventDefault()
    try {
      const reports = JSON.parse(localStorage.getItem(REPORTS_KEY)) || []
      reports.push({ number: trackingNumber, reason: reason.trim(), at: new Date().toISOString() })
      localStorage.setItem(REPORTS_KEY, JSON.stringify(reports))
    } catch {
      /* storage unavailable  still acknowledge the user */
    }
    setDone(true)
    setOpen(false)
  }

  if (done) {
    return <p className="report-done" role="status">✓ {t('trust.report.done')}</p>
  }

  if (!open) {
    return (
      <button type="button" className="report-button" onClick={() => setOpen(true)}>
        🚩 {t('trust.report')}
      </button>
    )
  }

  return (
    <form className="report-form" onSubmit={submit}>
      <p className="report-title">{t('trust.report.title')}</p>
      <textarea
        className="report-input"
        rows="2"
        value={reason}
        onChange={(event) => setReason(event.target.value)}
        placeholder={t('trust.report.placeholder')}
      />
      <div className="report-actions">
        <button type="submit" className="report-submit">{t('trust.report.submit')}</button>
        <button type="button" className="report-cancel" onClick={() => setOpen(false)}>
          {t('trust.report.cancel')}
        </button>
      </div>
    </form>
  )
}
