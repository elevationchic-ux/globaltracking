import { useState } from 'react';
import { useI18n } from '../i18n/I18nContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const TOKEN_PACKS = [
  { id: 'starter', name: 'Starter', tokens: 10, price: '€1.99', perUnit: '€0.20', color: '#3b82f6' },
  { id: 'basic', name: 'Basic', tokens: 50, price: '€5.99', perUnit: '€0.12', color: '#8b5cf6', popular: true },
  { id: 'pro', name: 'Pro', tokens: 100, price: '€9.99', perUnit: '€0.10', color: '#06b6d4' },
  { id: 'business', name: 'Business', tokens: 500, price: '€39.99', perUnit: '€0.08', color: '#10b981' },
  { id: 'enterprise', name: 'Enterprise', tokens: 2000, price: '€129.99', perUnit: '€0.065', color: '#f59e0b' },
];

const MICRO_TX = [
  { id: 'whatsapp', icon: '💬', name: 'pricing.whatsappAlert', desc: 'pricing.whatsappDesc', price: '€0.99', unit: 'pricing.perPackage' },
  { id: 'sms', icon: '📱', name: 'pricing.smsAlert', desc: 'pricing.smsDesc', price: '€0.99', unit: 'pricing.perPackage' },
  { id: 'bulk', icon: '📦', name: 'pricing.bulkProcess', desc: 'pricing.bulkDesc', price: '€2.99', unit: 'pricing.perFile' },
];

export default function PricingPlans() {
  const { t } = useI18n();
  const { user, authFetch } = useAuth();
  const [purchasing, setPurchasing] = useState(null);
  const [message, setMessage] = useState(null);

  async function handlePurchase(packId) {
    if (!user) {
      setMessage({ type: 'error', text: t('pricing.loginRequired') });
      return;
    }
    setPurchasing(packId);
    try {
      const res = await authFetch('/api/credits/purchase', {
        method: 'POST',
        body: JSON.stringify({ packId }),
      });
      const data = await res.json().catch(() => null);
      if (res.ok) {
        setMessage({ type: 'success', text: `${data.message}  ${t('pricing.newBalance')}: ${data.newBalance}` });
      } else {
        setMessage({ type: 'error', text: data?.message || t('pricing.purchaseFailed') });
      }
    } catch {
      setMessage({ type: 'error', text: t('pricing.purchaseFailed') });
    }
    setPurchasing(null);
  }

  return (
    <div className="pricing-page">
      <div className="pricing-hero">
        <h1 className="pricing-title">{t('pricing.title')}</h1>
        <p className="pricing-subtitle">{t('pricing.subtitle')}</p>
      </div>

      {message && (
        <div className={`pricing-toast ${message.type === 'success' ? 'pricing-toast-success' : 'pricing-toast-error'}`}>
          {message.text}
          <button onClick={() => setMessage(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontSize: '1.1rem' }}>✕</button>
        </div>
      )}

      {/* ── Free Tier ─────────────────────────────────── */}
      <section className="pricing-section">
        <div className="pricing-tier pricing-tier-free">
          <div className="pricing-tier-header">
            <h3>{t('pricing.freeTitle')}</h3>
            <div className="pricing-price">
              <span className="pricing-amount">€0</span>
              <span className="pricing-period">{t('pricing.forever')}</span>
            </div>
            <p className="pricing-desc">{t('pricing.freeDesc')}</p>
          </div>
          <ul className="pricing-features">
            <li>✓ {t('pricing.freeFeat1')}</li>
            <li>✓ {t('pricing.freeFeat2')}</li>
            <li>✓ {t('pricing.freeFeat3')}</li>
            <li>✓ {t('pricing.freeFeat4')}</li>
            <li className="pricing-feat-disabled">✕ {t('pricing.freeLimit1')}</li>
            <li className="pricing-feat-disabled">✕ {t('pricing.freeLimit2')}</li>
          </ul>
        </div>
      </section>

      {/* ── Token Packs (Credits System) ──────────────── */}
      <section className="pricing-section">
        <h2 className="pricing-section-title">{t('pricing.tokenTitle')}</h2>
        <p className="pricing-section-desc">{t('pricing.tokenDesc')}</p>

        <div className="pricing-tokens-grid">
          {TOKEN_PACKS.map((pack) => (
            <div key={pack.id} className={`pricing-token-card ${pack.popular ? 'pricing-token-popular' : ''}`} style={{ '--accent': pack.color }}>
              {pack.popular && <div className="pricing-popular-badge">{t('pricing.popular')}</div>}
              <div className="pricing-token-name">{pack.name}</div>
              <div className="pricing-token-amount">{pack.tokens}</div>
              <div className="pricing-token-label">{t('pricing.requests')}</div>
              <div className="pricing-token-price">{pack.price}</div>
              <div className="pricing-token-unit">{pack.perUnit} {t('pricing.perRequest')}</div>
              <button
                className="pricing-token-btn"
                style={{ background: pack.color }}
                onClick={() => handlePurchase(pack.id)}
                disabled={purchasing === pack.id}
              >
                {purchasing === pack.id ? t('pricing.processing') : t('pricing.buyNow')}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* ── Micro-transactions ────────────────────────── */}
      <section className="pricing-section">
        <h2 className="pricing-section-title">{t('pricing.microTitle')}</h2>
        <p className="pricing-section-desc">{t('pricing.microDesc')}</p>

        <div className="pricing-micro-grid">
          {MICRO_TX.map((item) => (
            <div key={item.id} className="pricing-micro-card">
              <div className="pricing-micro-icon">{item.icon}</div>
              <h4>{t(item.name)}</h4>
              <p>{t(item.desc)}</p>
              <div className="pricing-micro-price">
                <span className="pricing-micro-amount">{item.price}</span>
                <span className="pricing-micro-unit">{t(item.unit)}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── API Pay-As-You-Go ─────────────────────────── */}
      <section className="pricing-section">
        <div className="pricing-api-section">
          <h2 className="pricing-section-title">{t('pricing.apiTitle')}</h2>
          <p className="pricing-section-desc">{t('pricing.apiDesc')}</p>
          <div className="pricing-api-features">
            <div className="pricing-api-feat">
              <span className="pricing-api-feat-icon">🔑</span>
              <div>
                <h4>{t('pricing.apiFeat1Title')}</h4>
                <p>{t('pricing.apiFeat1Desc')}</p>
              </div>
            </div>
            <div className="pricing-api-feat">
              <span className="pricing-api-feat-icon">📊</span>
              <div>
                <h4>{t('pricing.apiFeat2Title')}</h4>
                <p>{t('pricing.apiFeat2Desc')}</p>
              </div>
            </div>
            <div className="pricing-api-feat">
              <span className="pricing-api-feat-icon">💳</span>
              <div>
                <h4>{t('pricing.apiFeat3Title')}</h4>
                <p>{t('pricing.apiFeat3Desc')}</p>
              </div>
            </div>
            <div className="pricing-api-feat">
              <span className="pricing-api-feat-icon">📱</span>
              <div>
                <h4>{t('pricing.apiFeat4Title')}</h4>
                <p>{t('pricing.apiFeat4Desc')}</p>
              </div>
            </div>
          </div>
          <div className="pricing-api-cta">
            <a href="/help?topic=api" className="pricing-api-btn">{t('pricing.apiContact')}</a>
          </div>
        </div>
      </section>

      {/* ── Payment Methods ───────────────────────────── */}
      <section className="pricing-section pricing-payment-methods">
        <h3>{t('pricing.paymentMethods')}</h3>
        <div className="pricing-payment-icons">
          <span title="Visa">💳 Visa</span>
          <span title="Mastercard">💳 Mastercard</span>
          <span title="Mobile Money">📲 Mobile Money</span>
          <span title="PayPal">🅿️ PayPal</span>
          <span title="Orange Money">🍊 Orange Money</span>
          <span title="MTN MoMo">🟡 MTN MoMo</span>
        </div>
      </section>
    </div>
  );
}
