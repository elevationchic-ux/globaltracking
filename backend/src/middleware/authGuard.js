import { randomBytes } from 'node:crypto';

/**
 * Lightweight token-based auth middleware.
 * Token format: base64(JSON({ userId, email, role, exp, jti }))
 * Stored in Authorization header as: Bearer <token>
 */

const SECRET_SALT = process.env.AUTH_SECRET || 'globaltrack-dev-secret-2026';

function encodeToken(payload) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify({
    ...payload,
    exp: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
    jti: randomBytes(8).toString('hex'),
  })).toString('base64url');
  const signature = Buffer.from(`${header}.${body}.${SECRET_SALT}`).toString('base64url');
  return `${header}.${body}.${signature}`;
}

function decodeToken(token) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const body = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
    if (body.exp < Date.now()) return null;
    return body;
  } catch {
    return null;
  }
}

/**
 * Middleware: extract user from token, attach to req.user (or null).
 */
export function optionalAuth(req, _res, next) {
  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) {
    const token = header.slice(7);
    req.user = decodeToken(token);
  } else {
    req.user = null;
  }
  next();
}

/**
 * Middleware: require authenticated user.
 */
export function requireAuth(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'UNAUTHORIZED', message: 'Authentication required.' });
  }
  next();
}

/**
 * Middleware: require admin role.
 */
export function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'FORBIDDEN', message: 'Admin access required.' });
  }
  next();
}

export { encodeToken, decodeToken };
