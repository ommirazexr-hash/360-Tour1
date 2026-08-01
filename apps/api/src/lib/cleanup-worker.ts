import { projectStore } from './project-store';
import { storage } from './storage';
import { logger } from './logger';

let intervalId: NodeJS.Timeout | null = null;

/**
 * Starts the periodic background asset cleanup worker.
 */
export function startCleanupWorker(): void {
  if (intervalId) return;

  // Run check every hour by default (3,600,000 ms)
  const checkIntervalMs = parseInt(process.env.CLEANUP_CHECK_INTERVAL_MS || '3600000', 10);
  
  logger.info(`[Cleanup Worker] Starting background cleanup worker (check interval: ${checkIntervalMs}ms)`);
  
  // Run immediately on start
  runCleanup().catch((err) => {
    logger.error('[Cleanup Worker] Initial run failed', { error: err?.message });
  });

  intervalId = setInterval(() => {
    runCleanup().catch((err) => {
      logger.error('[Cleanup Worker] Periodic run failed', { error: err?.message });
    });
  }, checkIntervalMs);
}

/**
 * Stops the background asset cleanup worker.
 */
export function stopCleanupWorker(): void {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
    logger.info('[Cleanup Worker] Background cleanup worker stopped');
  }
}

/**
 * Executes a single run of the cleanup logic.
 */
async function runCleanup(): Promise<void> {
  // Threshold defaults to 24 hours (1440 minutes)
  const thresholdMinutes = parseInt(process.env.CLEANUP_THRESHOLD_MINUTES || '1440', 10);
  const thresholdMs = thresholdMinutes * 60 * 1000;
  
  logger.info(`[Cleanup Worker] Running check for soft-deleted items older than ${thresholdMinutes} minute(s)...`);

  // 1. Clean up expired soft-deleted assets
  try {
    const expiredAssets = projectStore.getExpiredSoftDeletedAssets(thresholdMs);
    if (expiredAssets.length > 0) {
      logger.info(`[Cleanup Worker] Found ${expiredAssets.length} expired asset(s) to purge.`);
      
      for (const asset of expiredAssets) {
        try {
          if (asset.filePath) {
            await storage.delete(asset.filePath);
            logger.info(`[Cleanup Worker] Purged physical file: ${asset.filePath}`);
          }
          if (asset.optimizedPath) {
            await storage.delete(asset.optimizedPath);
            logger.info(`[Cleanup Worker] Purged physical file: ${asset.optimizedPath}`);
          }
          if (asset.thumbnailPath) {
            await storage.delete(asset.thumbnailPath);
            logger.info(`[Cleanup Worker] Purged physical file: ${asset.thumbnailPath}`);
          }
          projectStore.hardDeleteAsset(asset.id);
          logger.info(`[Cleanup Worker] Purged store record for asset ${asset.id}`);
        } catch (err: any) {
          logger.error(`[Cleanup Worker] Failed to purge files/record for asset ${asset.id}`, { error: err?.message });
        }
      }
    }
  } catch (err: any) {
    logger.error('[Cleanup Worker] Error during asset cleanup', { error: err?.message });
  }

  // 2. Clean up expired soft-deleted avatars
  try {
    const expiredAvatars = projectStore.getExpiredSoftDeletedAvatars(thresholdMs);
    if (expiredAvatars.length > 0) {
      logger.info(`[Cleanup Worker] Found ${expiredAvatars.length} expired avatar(s) to purge.`);
      
      for (const avatar of expiredAvatars) {
        try {
          projectStore.hardDeleteAvatar(avatar.id);
          logger.info(`[Cleanup Worker] Purged store record for avatar ${avatar.id}`);
        } catch (err: any) {
          logger.error(`[Cleanup Worker] Failed to purge record for avatar ${avatar.id}`, { error: err?.message });
        }
      }
    }
  } catch (err: any) {
    logger.error('[Cleanup Worker] Error during avatar cleanup', { error: err?.message });
  }
}
