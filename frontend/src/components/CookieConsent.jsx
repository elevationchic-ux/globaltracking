import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useI18n } from '../i18n/I18nContext.jsx'

const CONSENT_KEY = 'globaltrack:consent'

/**
 * GDPR / CCPA consent gate. Nothing beyond essential cookies is set until
 * the visitor chooses; the choice is persisted and revocable by clearing it.
 */
export default function CookieConsent() {
  const { t } = useI18n()
  const [visible, setVisible] = useState(() => {
    try {
      return !localStorage.getItem(CONSENT_KEY)
    } catch {
      return true
    }
  })

  function choose(choice) {
    try {
      localStorage.setItem(CONSENT_KEY, choice)
    } catch {
      /* storage unavailable  banner simply closes */
    }
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="cookie-consent" role="dialog" aria-modal="false" aria-label="Cookies">
      <p className="cookie-text">
        {t('consent.text')}{' '}
        <Link to="/privacy">{t('footer.privacy')}</Link>
      </p>
      <div className="cookie-actions">
        <button type="button" className="cookie-accept" onClick={() => choose('all')}>
          {t('consent.accept')}
        </button>
        <button type="button" className="cookie-essential" onClick={() => choose('essential')}>
          {t('consent.essential')}
        </button>
      </div>
    </div>
  )
}
