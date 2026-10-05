/**
 * Express application (no network listener) so tests can drive it in-process.
 * server.ts is the entry point that binds the port.
 */
// Must be the first import: modules below read process.env when they load
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import path from 'path';
import fs from 'fs';
import apiRoutes from './routes/api.js';
import authRoutes from './routes/authRoutes.js';

const app = express();

// Behind a reverse proxy (Render, Nginx, etc.) set TRUST_PROXY=1 so rate limits
// apply per real client IP instead of treating every user as the proxy's IP.
if (process.env.TRUST_PROXY) {
  const hops = Number(process.env.TRUST_PROXY);
  app.set('trust proxy', Number.isNaN(hops) ? process.env.TRUST_PROXY : hops);
}

// Security Headers
app.use(helmet());

// Secure CORS configuration (CORS_ORIGIN accepted as an alias)
const frontendUrl = process.env.FRONTEND_URL || process.env.CORS_ORIGIN || 'http://localhost:5173';
app.use(
  cors({
    origin: frontendUrl,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);

app.use(cookieParser());

// Text submissions are small; files go through multer with their own limits
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

const frontendDist = fs.existsSync(path.resolve(process.cwd(), 'frontend/dist'))
  ? path.resolve(process.cwd(), 'frontend/dist')
  : path.resolve(process.cwd(), '../frontend/dist');

// Mount API routes
app.use('/api/auth', authRoutes);
app.use('/api', apiRoutes);

// Static frontend serving in production
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
} else {
  // Root information fallback endpoint when running in pure API dev mode
  app.get('/', (_req, res) => {
    res.json({
      platform: 'SCAMCHECK — AI Opportunity Intelligence',
      tagline: 'Verify before you trust.',
      status: 'OPERATIONAL',
      apiDocumentation: '/api/health'
    });
  });
}

// Global Error Handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  // Client errors (malformed JSON bodies, oversized payloads, rejected uploads) keep their 4xx status
  const status = Number(err.status || err.statusCode);
  if (status >= 400 && status < 500) {
    res.status(status).json({
      error: err.type === 'entity.parse.failed' ? 'Request body is not valid JSON.' : err.message || 'Bad request'
    });
    return;
  }

  console.error('Unhandled Server Error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: 'An unexpected error occurred'
  });
});

export default app;
