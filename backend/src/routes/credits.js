import { Router } from 'express';
import { requireAuth } from '../middleware/authGuard.js';
import {
  getCreditBalance, getCreditsByUser, addCreditPack, deductCredit, hasEnoughCredits,
  getApiKeysByUser, createApiKey, revokeApiKey, findApiKey, incrementApiUsage,
  getAlertsByUser, createAlert, deactivateAlert,
} from '../data/db.js';

const router = Router();

// --- Credit Packs (predefined) ---
const CREDIT_PACKS = [
  { id: 'starter', name: 'Starter', amount: 10, price: 1.99 },
  { id: 'basic', name: 'Basic', amount: 50, price: 5.99 },
  { id: 'pro', name: 'Pro', amount: 100, price: 9.99 },
  { id: 'business', name: 'Business', amount: 500, price: 39.99 },
  { id: 'enterprise', name: 'Enterprise', amount: 2000, price: 129.99 },
];

// --- Credits ---
router.get('/balance', requireAuth, (req, res) => {
  const balance = getCreditBalance(req.user.id);
  const history = getCreditsByUser(req.user.id);
  res.json({ balance, history });
});

router.get('/packs', (_req, res) => {
  res.json({ packs: CREDIT_PACKS });
});

router.post('/purchase', requireAuth, (req, res) => {
  const { packId } = req.body;
  const pack = CREDIT_PACKS.find((p) => p.id === packId);
  if (!pack) {
    return res.status(400).json({ error: 'INVALID_PACK', message: 'Credit pack not found.' });
  }
  // In production, this is where payment gateway (Stripe, Mobile Money) would be called.
  // For now, we simulate a successful purchase.
  const credit = addCreditPack(req.user.id, pack);
  res.status(201).json({
    credit,
    message: `Purchased ${pack.amount} credits for €${pack.price}`,
    newBalance: getCreditBalance(req.user.id),
  });
});

router.post('/deduct', requireAuth, (req, res) => {
  const { count = 1 } = req.body;
  if (!hasEnoughCredits(req.user.id, count)) {
    return res.status(402).json({
      error: 'INSUFFICIENT_CREDITS',
      message: 'Not enough credits. Please purchase more.',
      balance: getCreditBalance(req.user.id),
    });
  }
  const success = deductCredit(req.user.id, count);
  if (!success) {
    return res.status(500).json({ error: 'DEDUCTION_FAILED' });
  }
  res.json({ success: true, balance: getCreditBalance(req.user.id) });
});

// --- API Keys ---
router.get('/keys', requireAuth, (req, res) => {
  const keys = getApiKeysByUser(req.user.id);
  res.json({ keys });
});

router.post('/keys', requireAuth, (req, res) => {
  const { name } = req.body;
  const key = createApiKey(req.user.id, name);
  res.status(201).json({ key });
});

router.delete('/keys/:id', requireAuth, (req, res) => {
  const key = revokeApiKey(req.params.id);
  if (!key) return res.status(404).json({ error: 'NOT_FOUND' });
  res.json({ success: true });
});

// --- API usage (called internally by tracking routes) ---
router.post('/api-usage', requireAuth, (req, res) => {
  const { apiKey } = req.body;
  if (!apiKey) return res.status(400).json({ error: 'MISSING_KEY' });

  const key = findApiKey(apiKey);
  if (!key) return res.status(401).json({ error: 'INVALID_KEY', message: 'Invalid or revoked API key.' });

  incrementApiUsage(key.id);
  res.json({ success: true, usageCount: key.usageCount });
});

// --- Alerts (WhatsApp/SMS micro-transactions) ---
router.get('/alerts', requireAuth, (req, res) => {
  const alerts = getAlertsByUser(req.user.id);
  res.json({ alerts });
});

router.post('/alerts', requireAuth, (req, res) => {
  const { trackingNumber, channel } = req.body;
  if (!trackingNumber || !channel) {
    return res.status(400).json({ error: 'MISSING_FIELDS', message: 'Tracking number and channel are required.' });
  }
  if (!['whatsapp', 'sms'].includes(channel)) {
    return res.status(400).json({ error: 'INVALID_CHANNEL', message: 'Channel must be whatsapp or sms.' });
  }
  // In production, payment of €0.99 would be processed here.
  const alert = createAlert(req.user.id, trackingNumber, channel);
  res.status(201).json({ alert, message: `Alert created for ${trackingNumber} via ${channel}. Price: €0.99` });
});

router.delete('/alerts/:id', requireAuth, (req, res) => {
  const alert = deactivateAlert(req.params.id);
  if (!alert) return res.status(404).json({ error: 'NOT_FOUND' });
  res.json({ success: true });
});

export { CREDIT_PACKS };
export default router;
