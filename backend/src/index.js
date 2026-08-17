import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import trackRouter from './routes/track.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.disable('x-powered-by');
app.use(helmet());
app.use(compression());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN?.split(',') ?? '*',
  })
);
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

app.use('/api', trackRouter);

app.use((_req, res) => {
  res.status(404).json({ error: 'NOT_FOUND', message: 'Route inconnue.' });
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Erreur interne du serveur.' });
});

app.listen(PORT, () => {
  console.log(`Tracking API listening on port ${PORT}`);
});
