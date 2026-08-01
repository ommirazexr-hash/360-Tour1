import { app } from './app';
import { env } from './config/env';
import { logger } from './lib/logger';
import { projectStore } from './lib/project-store';
import { startCleanupWorker, stopCleanupWorker } from './lib/cleanup-worker';

async function start() {
  // Initialize file-based project store
  try {
    projectStore.init();
    logger.info('✅ Project Store initialized successfully');
    
    // Start background asset cleanup worker
    startCleanupWorker();
  } catch (err: any) {
    logger.error('❌ Failed to initialize Project Store', { error: err?.message });
    process.exit(1);
  }

  const server = app.listen(env.PORT, () => {
    logger.info(`🚀 API server running on port ${env.PORT} [${env.NODE_ENV}]`);
  });

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    logger.info(`${signal} received. Shutting down gracefully...`);
    
    // Stop background worker
    stopCleanupWorker();
    
    server.close(() => {
      logger.info('Server closed');
      process.exit(0);
    });
    setTimeout(() => {
      logger.error('Force exit after 10s');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled rejection', { reason });
  });
}

start();
