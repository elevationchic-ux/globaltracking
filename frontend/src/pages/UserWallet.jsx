import { useState, useEffect, useCallback } from 'react';
import { useI18n } from '../i18n/I18nContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { Link, Navigate } from 'react-router-dom';

export default function UserWallet() {
  const { t } = useI18n();
  const { user, authFetch } = useAuth();
  const [balance, setBalance] = useState(0);
  const [history, setHistory] = useState([]);
  const [keys, setKeys] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [newKeyName, setNewKeyName] = useState('');
  const [msg, setMsg] = useState(null);

  const fetchAll = useCallback(async () => {
    try {
      const [balRes, keysRes, alertsRes] = await Promise.all([
        authFetch('/api/credits/balance'),
        authFetch('/api/credits/keys'),
        authFetch('/api/credits/alerts'),
      ]);
      if (balRes.ok) {
        const balData = await balRes.json().catch(() => null);
        setBalance(balData?.balance ?? 0);
        setHistory(balData?.history ?? []);
      }
      if (keysRes.ok) {
        const keysData = await keysRes.json().catch(() => null);
        setKeys(keysData?.keys ?? []);
      }
      if (alertsRes.ok) {
        const alertsData = await alertsRes.json().catch(() => null);
        setAlerts(alertsData?.alerts ?? []);
      }
    } catch { /* ignore */ }
  }, [authFetch]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  async function handleCreateKey() {
    try {
      const res = await authFetch('/api/credits/keys', {
        method: 'POST',
        body: JSON.stringify({ name: newKeyName || 'Default' }),
      });
      if (res.ok) {
        setNewKeyName('');
        fetchAll();
        setMsg({ type: 'success', text: t('wallet.keyCreated') });
      }
    } catch { /* ignore */ }
  }

  async function handleRevokeKey(keyId) {
    if (!confirm(t('wallet.confirmRevoke'))) return;
    try {
      await authFetch(`/api/credits/keys/${keyId}`, { method: 'DELETE' });
      fetchAll();
    } catch { /* ignore */ }
  }

  async function handleDeactivateAlert(alertId) {
    try {
      await authFetch(`/api/credits/alerts/${alertId}`, { method: 'DELETE' });
      fetchAll();
    } catch { /* ignore */ }
  }

  if (!user) return <Navigate to="/login" />;

  return (
    <div className="wallet-page">
      <div className="wallet-header">
        <h1>{t('wallet.title')}</h1>
        <Link to="/pricing" className="wallet-btn wallet-btn-primary" style={{ textDecoration: 'none' }}>
          + {t('wallet.buyCredits')}
        </Link>
      </div>

      {msg && (
        <div className={`pricing-toast pricing-toast-${msg.type}`} style={{ marginBottom: '1rem' }}>
          {msg.text}
          <button onClick={() => setMsg(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}>✕</button>
        </div>
      )}

      {/* Balance Card */}
      <div className="wallet-balance-card">
        <div className="wallet-balance-label">{t('wallet.availableCredits')}</div>
        <div className="wallet-balance-value">{balance}</div>
        <div className="wallet-balance-sub">{t('wallet.creditsRemaining')}</div>
      </div>

      {/* Credit History */}
      <div className="wallet-section">
        <h2>{t('wallet.purchaseHistory')}</h2>
        {history.length === 0 ? (
          <p className="wallet-empty">{t('wallet.noPurchases')}</p>
        ) : (
          <div className="wallet-keys-list">
            {history.map((h) => (
              <div key={h.id} className="wallet-key-item">
                <div className="wallet-key-info">
                  <div className="wallet-key-name">{h.packName}</div>
                  <div className="wallet-key-id">
                    {h.amount - h.used} / {h.amount} {t('wallet.remaining')} · {t('wallet.purchasedOn')} {new Date(h.purchasedAt).toLocaleDateString()}
                  </div>
                </div>
                <div style={{ color: '#67e8f9', fontWeight: 600, fontSize: '0.9rem' }}>€{h.pricePaid}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* API Keys */}
      <div className="wallet-section">
        <h2>{t('wallet.apiKeys')}</h2>
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', alignItems: 'center' }}>
          <input
            className="wallet-input"
            value={newKeyName}
            onChange={(e) => setNewKeyName(e.target.value)}
            placeholder={t('wallet.keyNamePlaceholder')}
          />
          <button className="wallet-btn wallet-btn-primary" onClick={handleCreateKey}>
            {t('wallet.generateKey')}
          </button>
        </div>
        {keys.length === 0 ? (
          <p className="wallet-empty">{t('wallet.noKeys')}</p>
        ) : (
          <div className="wallet-keys-list">
            {keys.map((k) => (
              <div key={k.id} className="wallet-key-item">
                <div className="wallet-key-info">
                  <div className="wallet-key-name">{k.name}</div>
                  <div className="wallet-key-id">{k.id}</div>
                  <div className="wallet-key-stats">
                    {k.usageCount} {t('wallet.calls')} · {k.active ? t('wallet.activeKey') : t('wallet.revokedKey')}
                    {k.lastUsedAt && ` · ${t('wallet.lastUsed')} ${new Date(k.lastUsedAt).toLocaleDateString()}`}
                  </div>
                </div>
                <div className="wallet-key-actions">
                  {k.active && (
                    <button className="wallet-btn wallet-btn-danger" onClick={() => handleRevokeKey(k.id)}>
                      {t('wallet.revoke')}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Alerts */}
      <div className="wallet-section">
        <h2>{t('wallet.activeAlerts')}</h2>
        {alerts.length === 0 ? (
          <p className="wallet-empty">{t('wallet.noAlerts')}</p>
        ) : (
          <div className="wallet-alerts-list">
            {alerts.map((a) => (
              <div key={a.id} className="wallet-alert-item">
                <div className="wallet-alert-info">
                  <span className="wallet-alert-channel">{a.channel === 'whatsapp' ? '💬' : '📱'}</span>
                  <span className="wallet-alert-tracking">{a.trackingNumber}</span>
                  <span className={`wallet-alert-status ${a.active ? 'wallet-alert-active' : 'wallet-alert-inactive'}`}>
                    {a.active ? t('wallet.activeKey') : t('wallet.inactiveAlert')}
                  </span>
                </div>
                {a.active && (
                  <button className="wallet-btn wallet-btn-ghost" onClick={() => handleDeactivateAlert(a.id)}>
                    {t('wallet.stopAlert')}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
