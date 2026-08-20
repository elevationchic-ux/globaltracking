import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '../i18n/I18nContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import Icon from './Icon.jsx';

const TOKEN_PACKS = [
  { id: 'starter', name: 'Starter', tokens: 10, price: '€1.99', perUnit: '€0.20', color: '#3b82f6', features: ['pricing.feat.simultaneous.5', 'pricing.feat.history', 'pricing.feat.carriers'] },
  { id: 'basic', name: 'Basic', tokens: 50, price: '€5.99', perUnit: '€0.12', color: '#8b5cf6', popular: true, features: ['pricing.feat.simultaneous.10', 'pricing.feat.history', 'pricing.feat.carriers', 'pricing.feat.whatsapp'] },
  { id: 'pro', name: 'Pro', tokens: 100, price: '€9.99', perUnit: '€0.10', color: '#06b6d4', features: ['pricing.feat.simultaneous.25', 'pricing.feat.history', 'pricing.feat.carriers', 'pricing.feat.whatsapp', 'pricing.feat.sms'] },
  { id: 'business', name: 'Business', tokens: 500, price: '€39.99', perUnit: '€0.08', color: '#10b981', features: ['pricing.feat.simultaneous.100', 'pricing.feat.history', 'pricing.feat.carriers', 'pricing.feat.whatsapp', 'pricing.feat.sms', 'pricing.feat.api'] },
  { id: 'enterprise', name: 'Enterprise', tokens: 2000, price: '€129.99', perUnit: '€0.065', color: '#f59e0b', features: ['pricing.feat.simultaneous.unlimited', 'pricing.feat.history', 'pricing.feat.carriers', 'pricing.feat.whatsapp', 'pricing.feat.sms', 'pricing.feat.api', 'pricing.feat.priority'] },
];

const PAYMENT_METHODS = [
  { name: 'Visa', icon: 'credit-card' },
  { name: 'Mastercard', icon: 'credit-card' },
  { name: 'American Express', icon: 'credit-card' },
  { name: 'PayPal', icon: 'send' },
  { name: 'Apple Pay', icon: 'smartphone' },
  { name: 'Google Pay', icon: 'smartphone' },
  { name: 'Stripe', icon: 'credit-card' },
  { name: 'Orange Money', icon: 'smartphone' },
  { name: 'MTN MoMo', icon: 'smartphone' },
  { name: 'M-Pesa', icon: 'smartphone' },
  { name: 'SEPA', icon: 'building' },
  { name: 'Crypto (USDC)', icon: 'key' },
];

export default function PricingPlans() {
  const { t } = useI18n();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [message, setMessage] = useState(null);

  function handlePurchase(packId) {
    if (!user) {
      setMessage({ type: 'error', text: t('pricing.loginRequired') });
      return;
    }
    navigate(`/checkout?pack=${packId}`);
  }

  function handleMicroPurchase(itemId) {
    if (!user) {
      setMessage({ type: 'error', text: t('pricing.loginRequired') });
      return;
    }
    navigate(`/checkout?item=${itemId}`);
  }

  // Feature comparison rows for the table
  const comparisonFeatures = [
    { key: 'simultaneous', free: '2', starter: '5', basic: '10', pro: '25', business: '100', enterprise: 'pricing.feat.unlimited' },
    { key: 'carriers', free: '400+', starter: '2,400+', basic: '2,400+', pro: '2,400+', business: '2,400+', enterprise: '2,400+' },
    { key: 'history', free: false, starter: true, basic: true, pro: true, business: true, enterprise: true },
    { key: 'languages', free: true, starter: true, basic: true, pro: true, business: true, enterprise: true },
    { key: 'whatsapp', free: false, starter: false, basic: true, pro: true, business: true, enterprise: true },
    { key: 'sms', free: false, starter: false, basic: false, pro: true, business: true, enterprise: true },
    { key: 'bulk', free: false, starter: false, basic: false, pro: true, business: true, enterprise: true },
    { key: 'api', free: false, starter: false, basic: false, pro: false, business: true, enterprise: true },
    { key: 'priority', free: false, starter: false, basic: false, pro: false, business: false, enterprise: true },
  ];

  return (
    <div className="pricing-page">
      <div className="pricing-hero">
        <h1 className="pricing-title">{t('pricing.title')}</h1>
        <p className="pricing-subtitle">{t('pricing.subtitle')}</p>
      </div>

      {message && (
        <div className={`pricing-toast ${message.type === 'success' ? 'pricing-toast-success' : 'pricing-toast-error'}`}>
          {message.text}
          <button onClick={() => setMessage(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontSize: '1.1rem', display: 'flex' }}><Icon name="x" size={18} /></button>
        </div>
      )}

      {/* ── Free Tier ─────────────────────────────────── */}
      <section className="pricing-section">
        <div className="pricing-tier pricing-tier-free">
          <div className="pricing-tier-header">
            <span className="pricing-tier-badge">{t('pricing.freeTitle')}</span>
            <div className="pricing-price">
              <span className="pricing-amount">€0</span>
              <span className="pricing-period">{t('pricing.forever')}</span>
            </div>
            <p className="pricing-desc">{t('pricing.freeDesc')}</p>
          </div>
          <ul className="pricing-features">
            <li className="pricing-feat-check">✓ {t('pricing.freeFeat1')}</li>
            <li className="pricing-feat-check">✓ {t('pricing.freeFeat2')}</li>
            <li className="pricing-feat-check">✓ {t('pricing.freeFeat4')}</li>
            <li className="pricing-feat-disabled">✕ {t('pricing.freeLimit1')}</li>
            <li className="pricing-feat-disabled">✕ {t('pricing.freeLimit2')}</li>
            <li className="pricing-feat-disabled">✕ {t('pricing.freeLimit3')}</li>
          </ul>
          <button className="pricing-tier-btn pricing-tier-btn-free">{t('pricing.getStarted')}</button>
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
              <ul className="pricing-token-features">
                {pack.features.map((feat) => (
                  <li key={feat}>✓ {t(feat)}</li>
                ))}
              </ul>
              <button
                className="pricing-token-btn"
                style={{ background: pack.color }}
                onClick={() => handlePurchase(pack.id)}
              >
                {t('pricing.buyNow')}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* ── Feature Comparison Table ──────────────────── */}
      <section className="pricing-section">
        <h2 className="pricing-section-title">{t('pricing.compareTitle')}</h2>
        <p className="pricing-section-desc">{t('pricing.compareDesc')}</p>
        <div className="pricing-comparison-wrapper">
          <table className="pricing-comparison-table">
            <thead>
              <tr>
                <th>{t('pricing.feature')}</th>
                <th>{t('pricing.freeTitle')}</th>
                <th>Starter</th>
                <th>Basic</th>
                <th>Pro</th>
                <th className="pricing-th-highlight">Business</th>
                <th>Enterprise</th>
              </tr>
            </thead>
            <tbody>
              {comparisonFeatures.map((feat) => (
                <tr key={feat.key}>
                  <td className="pricing-td-label">{t(`pricing.compare.${feat.key}`)}</td>
                  {['free', 'starter', 'basic', 'pro', 'business', 'enterprise'].map((tier) => {
                    const val = feat[tier];
                    if (val === true) return <td key={tier} className="pricing-td-check">✓</td>;
                    if (val === false) return <td key={tier} className="pricing-td-cross">✕</td>;
                    return <td key={tier} className="pricing-td-value">{val === 'pricing.feat.unlimited' ? t('pricing.feat.unlimited') : val}</td>;
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── Micro-transactions ────────────────────────── */}
      <section className="pricing-section">
        <h2 className="pricing-section-title">{t('pricing.microTitle')}</h2>
        <p className="pricing-section-desc">{t('pricing.microDesc')}</p>
        <div className="pricing-micro-grid">
          <div className="pricing-micro-card">
            <div className="pricing-micro-icon"><Icon name="whatsapp" size={28} /></div>
            <h4>{t('pricing.whatsappAlert')}</h4>
            <p>{t('pricing.whatsappDesc')}</p>
            <div className="pricing-micro-price">
              <span className="pricing-micro-amount">€0.99</span>
              <span className="pricing-micro-unit">{t('pricing.perPackage')}</span>
            </div>
            <button className="pricing-token-btn" style={{ background: '#25D366', marginTop: '0.75rem' }} onClick={() => handleMicroPurchase('whatsapp-alert')}>
              {t('pricing.buyNow')}
            </button>
          </div>
          <div className="pricing-micro-card">
            <div className="pricing-micro-icon"><Icon name="smartphone" size={28} /></div>
            <h4>{t('pricing.smsAlert')}</h4>
            <p>{t('pricing.smsDesc')}</p>
            <div className="pricing-micro-price">
              <span className="pricing-micro-amount">€0.99</span>
              <span className="pricing-micro-unit">{t('pricing.perPackage')}</span>
            </div>
            <button className="pricing-token-btn" style={{ background: '#8b5cf6', marginTop: '0.75rem' }} onClick={() => handleMicroPurchase('sms-alert')}>
              {t('pricing.buyNow')}
            </button>
          </div>
          <div className="pricing-micro-card">
            <div className="pricing-micro-icon"><Icon name="package" size={28} /></div>
            <h4>{t('pricing.bulkProcess')}</h4>
            <p>{t('pricing.bulkDesc')}</p>
            <div className="pricing-micro-price">
              <span className="pricing-micro-amount">€2.99</span>
              <span className="pricing-micro-unit">{t('pricing.perFile')}</span>
            </div>
            <button className="pricing-token-btn" style={{ background: '#06b6d4', marginTop: '0.75rem' }} onClick={() => handleMicroPurchase('bulk-csv')}>
              {t('pricing.buyNow')}
            </button>
          </div>
        </div>
      </section>

      {/* ── API Pay-As-You-Go ─────────────────────────── */}
      <section className="pricing-section">
        <div className="pricing-api-section">
          <div className="pricing-api-badge">{t('pricing.apiBadge')}</div>
          <h2 className="pricing-section-title">{t('pricing.apiTitle')}</h2>
          <p className="pricing-section-desc">{t('pricing.apiDesc')}</p>
          <div className="pricing-api-features">
            <div className="pricing-api-feat">
              <span className="pricing-api-feat-icon"><Icon name="key" size={22} /></span>
              <div>
                <h4>{t('pricing.apiFeat1Title')}</h4>
                <p>{t('pricing.apiFeat1Desc')}</p>
              </div>
            </div>
            <div className="pricing-api-feat">
              <span className="pricing-api-feat-icon"><Icon name="bar-chart" size={22} /></span>
              <div>
                <h4>{t('pricing.apiFeat2Title')}</h4>
                <p>{t('pricing.apiFeat2Desc')}</p>
              </div>
            </div>
            <div className="pricing-api-feat">
              <span className="pricing-api-feat-icon"><Icon name="credit-card" size={22} /></span>
              <div>
                <h4>{t('pricing.apiFeat3Title')}</h4>
                <p>{t('pricing.apiFeat3Desc')}</p>
              </div>
            </div>
            <div className="pricing-api-feat">
              <span className="pricing-api-feat-icon"><Icon name="shield-check" size={22} /></span>
              <div>
                <h4>{t('pricing.apiFeat5Title')}</h4>
                <p>{t('pricing.apiFeat5Desc')}</p>
              </div>
            </div>
          </div>
          <div className="pricing-api-cta">
            <p className="pricing-api-note">{t('pricing.apiNote')}</p>
            <a href="/pricing" className="pricing-api-btn">{t('pricing.apiCta')}</a>
          </div>
        </div>
      </section>

      {/* ── Payment Methods ───────────────────────────── */}
      <section className="pricing-section pricing-payment-methods">
        <h3>{t('pricing.paymentMethods')}</h3>
        <div className="pricing-payment-grid">
          {PAYMENT_METHODS.map((pm) => (
            <div key={pm.name} className="pricing-payment-item">
              <span className="pricing-payment-icon"><Icon name={pm.icon} size={20} /></span>
              <span className="pricing-payment-name">{pm.name}</span>
            </div>
          ))}
        </div>
        <p className="pricing-payment-note">{t('pricing.paymentNote')}</p>
      </section>
    </div>
  );
}
