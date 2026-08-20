/**
 * Vercel serverless entry point.
 * Re-exports the exact Express app used in local dev / Docker so production
 * and development share one code path (no drift, no duplication).
 * Mounted at /api/* and /health via vercel.json rewrites.
 */
export { default } from '../backend/src/app.js';
