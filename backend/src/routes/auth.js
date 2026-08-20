import { Router } from 'express';
import { getUserByEmail, createUser, verifyPassword, getUserById, updateUserLastActive, ensureAdmin } from '../data/db.js';
import { encodeToken, requireAuth } from '../middleware/authGuard.js';

const router = Router();

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * POST /api/auth/register
 * Body: { email, password, name }
 */
router.post('/register', (req, res) => {
  const { email, password, name } = req.body;

  if (!email || !password || !name) {
    return res.status(400).json({ error: 'MISSING_FIELDS', message: 'All fields are required.' });
  }
  if (!EMAIL_PATTERN.test(email)) {
    return res.status(400).json({ error: 'INVALID_EMAIL', message: 'Invalid email address.' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'WEAK_PASSWORD', message: 'Password must be at least 6 characters.' });
  }
  if (getUserByEmail(email)) {
    return res.status(409).json({ error: 'EMAIL_EXISTS', message: 'This email is already registered.' });
  }

  const user = createUser({ email, password, name });
  const token = encodeToken({ userId: user.id, email: user.email, role: user.role, name: user.name });

  res.status(201).json({
    token,
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
  });
});

/**
 * POST /api/auth/login
 * Body: { email, password }
 */
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'MISSING_FIELDS', message: 'Email and password are required.' });
  }

  let user = getUserByEmail(email);
  // Lazy-create admin on first login attempt (not auto-seeded in DB)
  if (!user) {
    user = ensureAdmin(email, password);
  }
  if (!user || !verifyPassword(user, password)) {
    return res.status(401).json({ error: 'INVALID_CREDENTIALS', message: 'Invalid email or password.' });
  }

  updateUserLastActive(user.id);
  const token = encodeToken({ userId: user.id, email: user.email, role: user.role, name: user.name });

  res.json({
    token,
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
  });
});

/**
 * GET /api/auth/me
 * Requires: Authorization: Bearer <token>
 */
router.get('/me', requireAuth, (req, res) => {
  const user = getUserById(req.user.userId);
  if (!user) {
    return res.status(404).json({ error: 'USER_NOT_FOUND', message: 'User no longer exists.' });
  }
  res.json({
    user: { id: user.id, email: user.email, name: user.name, role: user.role, createdAt: user.createdAt },
  });
});

export default router;
