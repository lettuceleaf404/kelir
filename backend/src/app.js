import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { config } from './config.js';
import authRoutes from './routes/auth.js';
import contentRoutes from './routes/contents.js';
import homeRoutes from './routes/home.js';
import meRoutes from './routes/me.js';
import collectionRoutes from './routes/collections.js';
import subscriptionRoutes from './routes/subscription.js';
import adminRoutes from './routes/admin.js';
import { errorHandler, notFound } from './middleware/errors.js';

const mediaDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'media');

export function createApp() {
  const app = express();

  // Render, Railway and similar hosts sit behind one proxy; needed for client IPs (rate limit) and https URLs.
  app.set('trust proxy', 1);

  // Demo clips are loaded by <video> on the web app's own domain, so they must be shareable cross-origin.
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.use(
    cors({
      origin: config.corsOrigins.includes('*') ? '*' : config.corsOrigins,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    }),
  );
  app.use(express.json({ limit: '200kb' }));
  if (config.nodeEnv !== 'test') app.use(morgan(config.isProduction ? 'combined' : 'dev'));

  app.use('/media', express.static(mediaDir, { maxAge: '7d', fallthrough: false }));

  app.get('/', (req, res) => {
    res.json({ name: 'KELIR API', tagline: 'Satu Ruang, Sejuta Cerita.', status: 'ok', health: '/api/health' });
  });
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/home', homeRoutes);
  app.use('/api/contents', contentRoutes);
  app.use('/api/me', meRoutes);
  app.use('/api/collections', collectionRoutes);
  app.use('/api/subscription', subscriptionRoutes);
  app.use('/api/admin', adminRoutes);

  app.use(notFound);
  app.use(errorHandler);
  return app;
}
