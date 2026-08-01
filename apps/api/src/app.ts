import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';

import { env } from './config/env';
import { logger } from './lib/logger';
import { errorMiddleware } from './middleware/error.middleware';
import { apiLimiter } from './middleware/rateLimiter.middleware';

import authRoutes from './modules/auth/auth.routes';
import projectRoutes from './modules/project/project.routes';
import brandingRoutes from './modules/branding/branding.routes';
import { projectScenesRouter, scenesRouter } from './modules/scene/scene.routes';
import { sceneHotspotsRouter, hotspotsRouter } from './modules/hotspot/hotspot.routes';
import assetRoutes from './modules/asset/asset.routes';
import guidedTourRoutes from './modules/guided-tour/guided-tour.routes';
import viewerRoutes from './modules/viewer/viewer.routes';
import avatarRoutes from './modules/avatar/avatar.routes';
import exportRoutes from './modules/export/export.routes';
import leadRoutes from './modules/lead/lead.routes';

const app = express();

// ─── Request Logger Middleware ────────────────────────
app.use((req, res, next) => {
  logger.info(`HTTP ${req.method} ${req.originalUrl}`);
  res.on('finish', () => {
    logger.info(`HTTP ${req.method} ${req.originalUrl} -> ${res.statusCode}`);
  });
  next();
});

// ─── Security & Parsing ──────────────────────────────
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  frameguard: false,
  contentSecurityPolicy: false,
}));
app.use(cors({
  origin: env.CORS_ORIGIN,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─── Static File Serving ─────────────────────────────
// Serve assets from the project directory under the /uploads route
app.use('/uploads', express.static(path.resolve(env.PROJECT_DIR, 'assets'), {
  maxAge: '7d',
  etag: true,
}));

// ─── Global Rate Limit ───────────────────────────────
app.use('/api', apiLimiter);

// ─── Health Check ─────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), env: env.NODE_ENV });
});

// ─── API Routes ───────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/project', projectRoutes);

// Project configurations (singular, no ID)
app.use('/api/project/branding', brandingRoutes);
app.use('/api/project/guided-tour', guidedTourRoutes);
app.use('/api/project/scenes', projectScenesRouter);

// Scene & Hotspot operations
app.use('/api/scenes', scenesRouter);
app.use('/api/scenes/:sceneId/hotspots', sceneHotspotsRouter);
app.use('/api/hotspots', hotspotsRouter);

app.use('/api/assets', assetRoutes);
app.use('/api/avatars', avatarRoutes);
app.use('/api/viewer', viewerRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/leads', leadRoutes);

// ─── 404 Handler ──────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Route not found' } });
});

// ─── Global Error Handler ─────────────────────────────
app.use(errorMiddleware);

export { app };
