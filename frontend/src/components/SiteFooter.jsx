import { Link } from 'react-router-dom'
import { useI18n } from '../i18n/I18nContext.jsx'
import WorldClock from './WorldClock.jsx'
import ManifestPage from '../pages/ManifestPage.jsx'

/**
 * Institutional footer with the legal pages EU/US visitors expect
 * (About, Privacy, Terms, Legal Notice) plus SEO entry points
 * (carrier landing pages, status help center).
 */
export default function SiteFooter() {
  const { t } = useI18n()
  return (
    <footer className="site-footer">
      <WorldClock />
      <p className="footer-disclaimer">{t('footer.disclaimerShort')}</p>
      <nav className="footer-nav" aria-label="Footer">
        <Link to="/carriers">{t('footer.carriers')}</Link>
        <Link to="/corridors">{t('footer.corridors')}</Link>
        <Link to="/help">{t('footer.help')}</Link>
        <Link to="/about">{t('footer.about')}</Link>
        <Link to="/privacy">{t('footer.privacy')}</Link>
        <Link to="/terms">{t('footer.terms')}</Link>
        <Link to="/legal">{t('footer.legalNotice')}</Link>
        <ManifestPage />
      </nav>
      <p className="footer-fineprint">{t('footer.legal')}</p>
    </footer>
  )
}
