import express, { Application } from 'express';
import cors from 'cors';
import compression from 'compression';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import routes from './routes';
import { errorHandler } from './utils/errors';

// ============================================
// EXPRESS APP CONFIGURATION
// ============================================

export function createApp(): Application {
  const app = express();

  // ============================================
  // SECURITY MIDDLEWARE
  // ============================================
  
  // Helmet - Security headers
  // crossOriginResourcePolicy: 'cross-origin' permite que imágenes (logos, fotos)
  // sean cargadas desde el frontend en otro dominio (Vercel → Railway)
  app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  }));

  // CORS
  const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:5173';
  app.use(cors({
    origin: corsOrigin.split(','),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }));

  // Compression - reduce payload size for large JSON responses
  app.use(compression());

  // Rate limiting
  const isDev = process.env.NODE_ENV !== 'production';

  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: isDev ? 1000 : 100, // Relaxed in development to avoid blocking local work
    message: { success: false, error: { message: 'Too many requests, please try again later.' } },
    standardHeaders: true,
    legacyHeaders: false,
  });

  if (isDev) {
    // In development we relax the global limiter to avoid 429s during hot reloads / StrictMode double-fetch.
    // Keep the middleware installed but with a high limit. If you prefer to fully disable it in dev, replace
    // the following block with `// no-op` or skip `app.use(limiter)` entirely.
    console.info('API running in development mode: rate limiter relaxed (high limit).');
  }
  app.use(limiter);

  // Stricter rate limit for auth routes
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: isDev ? 50 : 10, // Relax login attempts cap in development but keep a guard
    message: { success: false, error: { message: 'Too many login attempts, please try again later.' } },
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use('/api/auth/login', authLimiter);

  // ============================================
  // BODY PARSING
  // ============================================
  
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Request timing middleware: logs the duration of each HTTP request.
  // Enable/disable via env var REQUEST_TIMING (defaults to enabled in development).
  const requestTimingEnabled = process.env.REQUEST_TIMING !== 'false';
  if (requestTimingEnabled) {
    app.use((req, res, next) => {
      const start = Date.now();
      // When response finishes, log method, url, status and duration in ms
      res.on('finish', () => {
        const ms = Date.now() - start;
        // Use info for visibility; in heavy production you may reduce to debug
        console.info(`[HTTP] ${req.method} ${req.originalUrl} ${res.statusCode} - ${ms}ms`);
      });
      next();
    });
  }

  // ============================================
  // ROUTES
  // ============================================
  
  app.use('/api', routes);

  // Root route
  app.get('/', (_req, res) => {
    res.json({
      name: 'Sistema Medallero Federativo API',
      version: '1.0.0',
      documentation: '/api/health',
    });
  });

  // 404 handler
  app.use((_req, res) => {
    res.status(404).json({
      success: false,
      error: { message: 'Route not found' },
    });
  });

  // ============================================
  // ERROR HANDLING
  // ============================================
  
  app.use(errorHandler);

  return app;
}
