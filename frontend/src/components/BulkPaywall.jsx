import { useI18n } from '../i18n/I18nContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const FREE_LIMIT = 5;

export default function BulkPaywall({ count, onClose, onProceed }) {
  const { t } = useI18n();
  const { user } = useAuth();

  if (count <= FREE_LIMIT) return null;

  return (
    <div className="paywall-overlay" onClick={onClose}>
      <div className="paywall-modal" onClick={(e) => e.stopPropagation()}>
        <h3>{t('paywall.title')}</h3>
        <p>{t('paywall.desc', `${count}`)}</p>
        <div className="paywall-price">€2.99</div>
        <div className="paywall-unit">{t('paywall.perFile')}</div>
        <div style={{ background: '#0f172a', borderRadius: 10, padding: '0.75rem', marginBottom: '1rem', textAlign: 'left' }}>
          <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.25rem' }}>
            {t('paywall.includes')}:
          </div>
          <div style={{ fontSize: '0.85rem', color: '#e2e8f0' }}>✓ {t('paywall.feat1')}</div>
          <div style={{ fontSize: '0.85rem', color: '#e2e8f0' }}>✓ {t('paywall.feat2')}</div>
          <div style={{ fontSize: '0.85rem', color: '#e2e8f0' }}>✓ {t('paywall.feat3')}</div>
        </div>
        <div className="paywall-actions">
          <button className="paywall-btn paywall-btn-ghost" onClick={onClose}>
            {t('paywall.cancel')}
          </button>
          <button className="paywall-btn paywall-btn-primary" onClick={onProceed}>
            {user ? t('paywall.processNow') : t('paywall.loginFirst')}
          </button>
        </div>
      </div>
    </div>
  );
}

export { FREE_LIMIT };
