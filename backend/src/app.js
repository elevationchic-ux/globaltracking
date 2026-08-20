import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import trackRouter from './routes/track.js';
import authRouter from './routes/auth.js';
import chatRouter from './routes/chat.js';
import adminRouter from './routes/admin.js';
import { optionalAuth } from './middleware/authGuard.js';

/**
 * Express app factory, decoupled from the listener so the exact same app
 * can run as a classic Node server (dev / Docker / Railway) or be exported
 * as a Vercel serverless function (see /api/index.js at the repo root).
 */
export function createApp() {
  const app = express();

  app.disable('x-powered-by');
  app.use(helmet());
  app.use(compression());
  app.use(
    cors({
      origin: process.env.CORS_ORIGIN?.split(',') ?? '*',
    })
  );
  app.use(express.json());
  app.use(optionalAuth);

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', uptime: process.uptime() });
  });

  app.use('/api', trackRouter);
  app.use('/api/auth', authRouter);
  app.use('/api/chat', chatRouter);
  app.use('/api/admin', adminRouter);

  app.use((_req, res) => {
    res.status(404).json({ error: 'NOT_FOUND', message: 'Unknown route.' });
  });

  app.use((err, _req, res, _next) => {
    console.error(err);
    res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Internal server error.' });
  });

  return app;
}

export default createApp();
