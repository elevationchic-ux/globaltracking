import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { useI18n } from '../i18n/I18nContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const PACKS = [
  { id: 'starter', name: 'Starter', tokens: 10, price: 1.99, color: '#3b82f6' },
  { id: 'basic', name: 'Basic', tokens: 50, price: 5.99, color: '#8b5cf6' },
  { id: 'pro', name: 'Pro', tokens: 100, price: 9.99, color: '#06b6d4' },
  { id: 'business', name: 'Business', tokens: 500, price: 39.99, color: '#10b981' },
  { id: 'enterprise', name: 'Enterprise', tokens: 2000, price: 129.99, color: '#f59e0b' },
];

const MICRO_ITEMS = [
  { id: 'whatsapp-alert', name: 'checkout.whatsappAlert', price: 0.99, type: 'alert', channel: 'whatsapp', icon: '💬' },
  { id: 'sms-alert', name: 'checkout.smsAlert', price: 0.99, type: 'alert', channel: 'sms', icon: '📱' },
  { id: 'bulk-csv', name: 'checkout.bulkCsv', price: 2.99, type: 'bulk', icon: '📦' },
];

const PAYMENT_METHODS = [
  { id: 'card', name: 'checkout.payCard', icon: '💳', fields: ['cardNumber', 'expiry', 'cvv', 'holderName'] },
  { id: 'orange-money', name: 'checkout.payOrangeMoney', icon: '🍊', fields: ['phone', 'holderName'] },
  { id: 'mtn-momo', name: 'checkout.payMtnMomo', icon: '🟡', fields: ['phone', 'holderName'] },
  { id: 'm-pesa', name: 'checkout.payMPesa', icon: '🟢', fields: ['phone', 'holderName'] },
  { id: 'paypal', name: 'PayPal', icon: '🅿️', fields: ['email'] },
  { id: 'apple-pay', name: 'Apple Pay', icon: '🍎', fields: ['holderName'] },
  { id: 'google-pay', name: 'Google Pay', icon: '🔵', fields: ['holderName'] },
  { id: 'sepa', name: 'checkout.paySEPA', icon: '🏦', fields: ['iban', 'holderName'] },
  { id: 'crypto', name: 'checkout.payCrypto', icon: '₿', fields: ['walletAddress'] },
];

// Field labels and placeholders
const FIELD_META = {
  cardNumber: { label: 'checkout.fieldCardNumber', placeholder: '4242 4242 4242 4242', type: 'text', inputMode: 'numeric' },
  expiry: { label: 'checkout.fieldExpiry', placeholder: 'MM/YY', type: 'text', inputMode: 'numeric' },
  cvv: { label: 'checkout.fieldCvv', placeholder: '123', type: 'text', inputMode: 'numeric' },
  holderName: { label: 'checkout.fieldHolderName', placeholder: 'John Doe', type: 'text' },
  phone: { label: 'checkout.fieldPhone', placeholder: '+33 6 12 34 56 78', type: 'tel' },
  email: { label: 'checkout.fieldEmail', placeholder: 'you@example.com', type: 'email' },
  iban: { label: 'checkout.fieldIban', placeholder: 'FR76 1234 5678 9012 3456 7890 123', type: 'text' },
  walletAddress: { label: 'checkout.fieldWallet', placeholder: '0x...', type: 'text' },
};

export default function CheckoutPage() {
  const { t, locale } = useI18n();
  const { user, authFetch } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const packId = searchParams.get('pack');
  const microId = searchParams.get('item');

  const [step, setStep] = useState('info'); // info | payment | processing | success
  const [method, setMethod] = useState('');
  const [form, setForm] = useState({});
  const [extra, setExtra] = useState({}); // trackingNumber, notificationNumber for alerts
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  // Resolve item
  const pack = PACKS.find((p) => p.id === packId);
  const micro = MICRO_ITEMS.find((m) => m.id === microId);
  const item = pack || micro;

  // Redirect if not logged in
  useEffect(() => {
    if (!user && step !== 'success') {
      navigate('/login?redirect=/checkout' + (packId ? `?pack=${packId}` : microId ? `?item=${microId}` : ''));
    }
  }, [user, step, navigate, packId, microId]);

  const isAlert = micro?.type === 'alert';
  const selectedMethod = PAYMENT_METHODS.find((m) => m.id === method);

  const handleFieldChange = useCallback((field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError('');
  }, []);

  const handleExtraChange = useCallback((field, value) => {
    setExtra((prev) => ({ ...prev, [field]: value }));
    setError('');
  }, []);

  // Format card number with spaces
  const formatCardNumber = (val) => {
    const digits = val.replace(/\D/g, '').slice(0, 16);
    return digits.replace(/(.{4})/g, '$1 ').trim();
  };

  // Format expiry
  const formatExpiry = (val) => {
    const digits = val.replace(/\D/g, '').slice(0, 4);
    if (digits.length > 2) return digits.slice(0, 2) + '/' + digits.slice(2);
    return digits;
  };

  async function handleSubmit() {
    if (!item) { setError(t('checkout.noItem')); return; }
    if (!method) { setError(t('checkout.selectMethod')); return; }

    // Validate required fields
    if (isAlert && !extra.trackingNumber) {
      setError(t('checkout.trackingRequired'));
      return;
    }

    // Validate payment fields
    if (selectedMethod) {
      for (const field of selectedMethod.fields) {
        if (!form[field] || form[field].trim() === '') {
          setError(t('checkout.fillAllFields'));
          return;
        }
      }
    }

    setStep('processing');
    try {
      const body = {
        itemId: item.id,
        itemType: pack ? 'pack' : 'micro',
        paymentMethod: method,
        paymentInfo: form,
        extra: isAlert ? { trackingNumber: extra.trackingNumber, notificationNumber: extra.notificationNumber } : undefined,
      };
      const res = await authFetch('/api/payments/checkout', {
        method: 'POST',
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => null);
      if (res.ok && data?.success) {
        setResult(data);
        setStep('success');
      } else {
        setError(data?.message || t('checkout.paymentFailed'));
        setStep('payment');
      }
    } catch {
      setError(t('checkout.paymentFailed'));
      setStep('payment');
    }
  }

  if (!item) {
    return (
      <div className="checkout-page">
        <div className="checkout-container">
          <div className="checkout-empty">
            <h2>{t('checkout.noItem')}</h2>
            <p>{t('checkout.noItemDesc')}</p>
            <Link to="/pricing" className="checkout-btn checkout-btn-primary">{t('checkout.viewPricing')}</Link>
          </div>
        </div>
      </div>
    );
  }

  // ── Success Screen ──
  if (step === 'success' && result) {
    return (
      <div className="checkout-page">
        <div className="checkout-container">
          <div className="checkout-success">
            <div className="checkout-success-icon">✓</div>
            <h2>{t('checkout.successTitle')}</h2>
            <p className="checkout-success-msg">{result.message}</p>
            <div className="checkout-success-details">
              <div className="checkout-detail-row">
                <span>{t('checkout.paymentId')}</span>
                <span className="checkout-detail-value">{result.paymentId}</span>
              </div>
              <div className="checkout-detail-row">
                <span>{t('checkout.paymentMethodLabel')}</span>
                <span className="checkout-detail-value">{t(`checkout.pay${method.replace(/-/g, '').replace(/^./, (c) => c.toUpperCase())}`) || method}</span>
              </div>
              <div className="checkout-detail-row">
                <span>{t('checkout.amountPaid')}</span>
                <span className="checkout-detail-value checkout-detail-highlight">€{item.price}</span>
              </div>
              {result.newBalance !== undefined && (
                <div className="checkout-detail-row">
                  <span>{t('checkout.newBalance')}</span>
                  <span className="checkout-detail-value">{result.newBalance} {t('checkout.credits')}</span>
                </div>
              )}
            </div>
            <div className="checkout-success-actions">
              <Link to="/wallet" className="checkout-btn checkout-btn-primary">{t('checkout.goToWallet')}</Link>
              <Link to="/pricing" className="checkout-btn checkout-btn-ghost">{t('checkout.backToPricing')}</Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-page">
      <div className="checkout-container">
        {/* ── Header ── */}
        <div className="checkout-header">
          <Link to="/pricing" className="checkout-back">← {t('checkout.backToPricing')}</Link>
          <h1 className="checkout-title">{t('checkout.title')}</h1>
        </div>

        <div className="checkout-layout">
          {/* ── Left: Order Summary + Payment Form ── */}
          <div className="checkout-main">
            {/* Order Summary */}
            <div className="checkout-summary">
              <h3>{t('checkout.orderSummary')}</h3>
              <div className="checkout-item">
                <div className="checkout-item-icon" style={{ background: pack ? pack.color : '#8b5cf6' }}>
                  {pack ? pack.tokens : micro.icon}
                </div>
                <div className="checkout-item-info">
                  <div className="checkout-item-name">{pack ? pack.name : t(micro.name)}</div>
                  <div className="checkout-item-desc">
                    {pack
                      ? `${pack.tokens} ${t('checkout.credits')}`
                      : isAlert
                        ? `${t('checkout.alertFor')} ${extra.trackingNumber || '...'}`
                        : t('checkout.bulkAccess')}
                  </div>
                </div>
                <div className="checkout-item-price">€{item.price}</div>
              </div>
            </div>

            {/* Alert Extra Info */}
            {isAlert && (
              <div className="checkout-section">
                <h3>{t('checkout.alertDetails')}</h3>
                <div className="checkout-form-group">
                  <label>{t('checkout.trackingNumberLabel')}</label>
                  <input
                    className="checkout-input"
                    type="text"
                    value={extra.trackingNumber || ''}
                    onChange={(e) => handleExtraChange('trackingNumber', e.target.value)}
                    placeholder={t('checkout.trackingPlaceholder')}
                  />
                </div>
                <div className="checkout-form-group">
                  <label>
                    {micro.channel === 'whatsapp' ? t('checkout.whatsappNumberLabel') : t('checkout.phoneNumberLabel')}
                  </label>
                  <input
                    className="checkout-input"
                    type="tel"
                    value={extra.notificationNumber || ''}
                    onChange={(e) => handleExtraChange('notificationNumber', e.target.value)}
                    placeholder={micro.channel === 'whatsapp' ? '+33 6 12 34 56 78' : '+33 6 12 34 56 78'}
                  />
                  <span className="checkout-hint">
                    {micro.channel === 'whatsapp' ? t('checkout.whatsappHint') : t('checkout.smsHint')}
                  </span>
                </div>
              </div>
            )}

            {/* Payment Method Selection */}
            <div className="checkout-section">
              <h3>{t('checkout.paymentMethod')}</h3>
              {error && <div className="checkout-error">{error}</div>}
              <div className="checkout-methods">
                {PAYMENT_METHODS.map((pm) => (
                  <button
                    key={pm.id}
                    className={`checkout-method ${method === pm.id ? 'checkout-method-active' : ''}`}
                    onClick={() => { setMethod(pm.id); setForm({}); setError(''); }}
                  >
                    <span className="checkout-method-icon">{pm.icon}</span>
                    <span className="checkout-method-name">{t(pm.name)}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Payment Form */}
            {selectedMethod && (
              <div className="checkout-section">
                <h3>{t('checkout.paymentDetails')}</h3>
                <div className="checkout-form-grid">
                  {selectedMethod.fields.map((field) => {
                    const meta = FIELD_META[field];
                    if (!meta) return null;
                    return (
                      <div key={field} className="checkout-form-group">
                        <label>{t(meta.label)}</label>
                        <input
                          className="checkout-input"
                          type={meta.type}
                          inputMode={meta.inputMode || undefined}
                          value={form[field] || ''}
                          onChange={(e) => {
                            let val = e.target.value;
                            if (field === 'cardNumber') val = formatCardNumber(val);
                            if (field === 'expiry') val = formatExpiry(val);
                            if (field === 'cvv') val = val.replace(/\D/g, '').slice(0, 4);
                            handleFieldChange(field, val);
                          }}
                          placeholder={t(meta.placeholder)}
                          autoComplete={field === 'cardNumber' ? 'cc-number' : field === 'expiry' ? 'cc-exp' : field === 'cvv' ? 'cc-csc' : undefined}
                        />
                      </div>
                    );
                  })}
                </div>

                {/* Crypto info */}
                {method === 'crypto' && (
                  <div className="checkout-crypto-info">
                    <p>{t('checkout.cryptoInstruction')}</p>
                    <div className="checkout-crypto-address">
                      <span className="checkout-crypto-label">USDC (ERC-20):</span>
                      <code>0x0000000000000000000000000000000000000000</code>
                    </div>
                  </div>
                )}

                {/* SEPA info */}
                {method === 'sepa' && (
                  <div className="checkout-crypto-info">
                    <p>{t('checkout.sepaInstruction')}</p>
                    <div className="checkout-crypto-address">
                      <span className="checkout-crypto-label">IBAN:</span>
                      <code>XX00 0000 0000 0000 0000 0000</code>
                    </div>
                    <div className="checkout-crypto-address">
                      <span className="checkout-crypto-label">BIC:</span>
                      <code>XXXXXXXX</code>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Submit */}
            {method && (
              <div className="checkout-submit">
                <button
                  className="checkout-btn checkout-btn-pay"
                  onClick={handleSubmit}
                  disabled={step === 'processing'}
                >
                  {step === 'processing' ? (
                    <span className="checkout-spinner">{t('checkout.processing')}</span>
                  ) : (
                    <>{t('checkout.payNow')} €{item.price}</>
                  )}
                </button>
                <p className="checkout-secure">{t('checkout.securePayment')}</p>
              </div>
            )}
          </div>

          {/* ── Right: Sidebar Summary ── */}
          <div className="checkout-sidebar">
            <div className="checkout-sidebar-card">
              <h4>{t('checkout.yourOrder')}</h4>
              <div className="checkout-sidebar-line">
                <span>{pack ? pack.name + ` (${pack.tokens} ${t('checkout.credits')})` : t(micro.name)}</span>
                <span>€{item.price}</span>
              </div>
              <div className="checkout-sidebar-divider" />
              <div className="checkout-sidebar-line checkout-sidebar-total">
                <span>{t('checkout.total')}</span>
                <span>€{item.price}</span>
              </div>
              <div className="checkout-sidebar-guarantees">
                <div>🔒 {t('checkout.guaranteeSecure')}</div>
                <div>⚡ {t('checkout.guaranteeInstant')}</div>
                <div>💯 {t('checkout.guaranteeSatisfied')}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
