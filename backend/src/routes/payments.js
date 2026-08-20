import { Router } from 'express';
import { randomBytes } from 'node:crypto';
import { requireAuth } from '../middleware/authGuard.js';
import {
  getCreditBalance, addCreditPack, createAlert,
} from '../data/db.js';

const router = Router();

// --- Credit Packs (mirror of credits.js for price lookup) ---
const CREDIT_PACKS = [
  { id: 'starter', name: 'Starter', amount: 10, price: 1.99 },
  { id: 'basic', name: 'Basic', amount: 50, price: 5.99 },
  { id: 'pro', name: 'Pro', amount: 100, price: 9.99 },
  { id: 'business', name: 'Business', amount: 500, price: 39.99 },
  { id: 'enterprise', name: 'Enterprise', amount: 2000, price: 129.99 },
];

const MICRO_ITEMS = [
  { id: 'whatsapp-alert', name: 'WhatsApp Alert', price: 0.99, type: 'alert', channel: 'whatsapp' },
  { id: 'sms-alert', name: 'SMS Alert', price: 0.99, type: 'alert', channel: 'sms' },
  { id: 'bulk-csv', name: 'Bulk CSV Processing', price: 2.99, type: 'bulk' },
];

// --- Payment method validation ---
const PAYMENT_VALIDATORS = {
  card: (info) => {
    if (!info.cardNumber || info.cardNumber.replace(/\s/g, '').length < 13) return 'Invalid card number';
    if (!info.expiry || !/^\d{2}\/\d{2}$/.test(info.expiry)) return 'Invalid expiry (MM/YY)';
    if (!info.cvv || info.cvv.length < 3) return 'Invalid CVV';
    if (!info.holderName || info.holderName.trim().length < 2) return 'Cardholder name required';
    return null;
  },
  'orange-money': (info) => {
    if (!info.phone || info.phone.replace(/\D/g, '').length < 8) return 'Invalid phone number';
    if (!info.holderName || info.holderName.trim().length < 2) return 'Account holder name required';
    return null;
  },
  'mtn-momo': (info) => {
    if (!info.phone || info.phone.replace(/\D/g, '').length < 8) return 'Invalid phone number';
    if (!info.holderName || info.holderName.trim().length < 2) return 'Account holder name required';
    return null;
  },
  'm-pesa': (info) => {
    if (!info.phone || info.phone.replace(/\D/g, '').length < 8) return 'Invalid phone number';
    if (!info.holderName || info.holderName.trim().length < 2) return 'Account holder name required';
    return null;
  },
  paypal: (info) => {
    if (!info.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(info.email)) return 'Invalid PayPal email';
    return null;
  },
  'apple-pay': (info) => {
    // Apple Pay is tokenized — just need a confirmation
    if (!info.holderName || info.holderName.trim().length < 2) return 'Name required';
    return null;
  },
  'google-pay': (info) => {
    if (!info.holderName || info.holderName.trim().length < 2) return 'Name required';
    return null;
  },
  sepa: (info) => {
    if (!info.iban || info.iban.replace(/\s/g, '').length < 15) return 'Invalid IBAN';
    if (!info.holderName || info.holderName.trim().length < 2) return 'Account holder name required';
    return null;
  },
  crypto: (info) => {
    // Crypto: user sends to our address, we just need their wallet address for reference
    if (!info.walletAddress || info.walletAddress.trim().length < 10) return 'Wallet address required';
    return null;
  },
};

// --- POST /api/payments/checkout ---
// Full checkout: validates payment, processes it, creates credits/alerts
router.post('/checkout', requireAuth, (req, res) => {
  const { itemId, itemType, paymentMethod, paymentInfo, extra } = req.body;

  // 1. Validate payment method
  if (!paymentMethod || !PAYMENT_VALIDATORS[paymentMethod]) {
    return res.status(400).json({ error: 'INVALID_PAYMENT_METHOD', message: 'Unsupported payment method.' });
  }

  // 2. Validate payment info
  const validationError = PAYMENT_VALIDATORS[paymentMethod](paymentInfo || {});
  if (validationError) {
    return res.status(400).json({ error: 'INVALID_PAYMENT_INFO', message: validationError });
  }

  // 3. Resolve item
  let item = null;
  if (itemType === 'pack') {
    item = CREDIT_PACKS.find((p) => p.id === itemId);
  } else if (itemType === 'micro') {
    item = MICRO_ITEMS.find((m) => m.id === itemId);
  }

  if (!item) {
    return res.status(400).json({ error: 'INVALID_ITEM', message: 'Item not found.' });
  }

  // 4. Generate payment ID
  const paymentId = `pay_${randomBytes(12).toString('hex')}`;
  const now = new Date().toISOString();

  // 5. Process the payment (simulated — in production, call Stripe/Mobile Money/etc.)
  // For alerts, create the alert with notification number
  if (item.type === 'alert') {
    if (!extra?.trackingNumber) {
      return res.status(400).json({ error: 'MISSING_TRACKING', message: 'Tracking number required for alerts.' });
    }
    const notificationNumber = extra.notificationNumber || '';
    const alert = createAlert(req.user.id, extra.trackingNumber, item.channel, {
      notificationNumber,
      paymentId,
      paymentMethod,
      pricePaid: item.price,
    });
    return res.status(201).json({
      success: true,
      paymentId,
      item: { id: item.id, name: item.name, price: item.price },
      paymentMethod,
      alert,
      message: `Payment successful! ${item.name} activated for ${extra.trackingNumber}.`,
    });
  }

  // For packs, add credits
  if (itemType === 'pack') {
    const credit = addCreditPack(req.user.id, item);
    return res.status(201).json({
      success: true,
      paymentId,
      item: { id: item.id, name: item.name, price: item.price, amount: item.amount },
      paymentMethod,
      credit,
      newBalance: getCreditBalance(req.user.id),
      message: `Payment successful! ${item.amount} credits added to your wallet.`,
    });
  }

  // For bulk CSV
  if (itemType === 'micro' && item.type === 'bulk') {
    return res.status(201).json({
      success: true,
      paymentId,
      item: { id: item.id, name: item.name, price: item.price },
      paymentMethod,
      message: `Payment successful! Bulk processing unlocked.`,
    });
  }

  return res.status(500).json({ error: 'PROCESSING_FAILED', message: 'Could not process payment.' });
});

// --- GET /api/payments/methods ---
// Return available payment methods with their required fields
router.get('/methods', (_req, res) => {
  const methods = [
    {
      id: 'card',
      name: 'Credit / Debit Card',
      icon: '💳',
      fields: ['cardNumber', 'expiry', 'cvv', 'holderName'],
    },
    {
      id: 'orange-money',
      name: 'Orange Money',
      icon: '🍊',
      fields: ['phone', 'holderName'],
    },
    {
      id: 'mtn-momo',
      name: 'MTN MoMo',
      icon: '🟡',
      fields: ['phone', 'holderName'],
    },
    {
      id: 'm-pesa',
      name: 'M-Pesa',
      icon: '🟢',
      fields: ['phone', 'holderName'],
    },
    {
      id: 'paypal',
      name: 'PayPal',
      icon: '🅿️',
      fields: ['email'],
    },
    {
      id: 'apple-pay',
      name: 'Apple Pay',
      icon: '🍎',
      fields: ['holderName'],
    },
    {
      id: 'google-pay',
      name: 'Google Pay',
      icon: '🔵',
      fields: ['holderName'],
    },
    {
      id: 'sepa',
      name: 'Bank Transfer (SEPA)',
      icon: '🏦',
      fields: ['iban', 'holderName'],
    },
    {
      id: 'crypto',
      name: 'Crypto (USDC)',
      icon: '₿',
      fields: ['walletAddress'],
    },
  ];
  res.json({ methods });
});

// --- GET /api/payments/packs ---
// Return packs with prices for checkout display
router.get('/packs', (_req, res) => {
  res.json({ packs: CREDIT_PACKS, microItems: MICRO_ITEMS });
});

export default router;
