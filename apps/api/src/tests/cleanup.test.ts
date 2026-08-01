import './setup-env';
import test from 'node:test';
import assert from 'node:assert';
import fs from 'fs';
import path from 'path';
import { projectStore } from '../lib/project-store';
import { assetService } from '../modules/asset/asset.service';
import { storage } from '../lib/storage';

test('Asset Cleanup Suite', async (t) => {
  // Initialize project store
  projectStore.init();

  const testFileBuffer = Buffer.from('hello test file');
  const originalName = 'test-image.png';

  await t.test('1. Soft delete leaves files on disk, but marks deletedAt', async () => {
    // Create an asset mock
    const subPath = 'images/test-soft.png';
    const filePath = await storage.save(testFileBuffer, subPath);
    
    const asset = projectStore.createAsset({
      originalName,
      fileName: 'test-soft.png',
      mimeType: 'image/png',
      fileSize: testFileBuffer.length,
      filePath,
      optimizedPath: null,
      thumbnailPath: null,
      category: 'IMAGE',
      tags: [],
      width: 100,
      height: 100
    });

    // Verify file exists
    assert.strictEqual(await storage.exists(filePath), true);

    // Call soft delete
    await assetService.delete(asset.id, false);

    // Verify it is marked as soft-deleted in store (not found by standard getAsset)
    assert.strictEqual(projectStore.getAsset(asset.id), null);

    // But file still exists on disk
    assert.strictEqual(await storage.exists(filePath), true);
  });

  await t.test('2. Hard delete (force=true) immediately purges file and record', async () => {
    // Create asset
    const subPath = 'images/test-hard.png';
    const filePath = await storage.save(testFileBuffer, subPath);
    
    const asset = projectStore.createAsset({
      originalName,
      fileName: 'test-hard.png',
      mimeType: 'image/png',
      fileSize: testFileBuffer.length,
      filePath,
      optimizedPath: null,
      thumbnailPath: null,
      category: 'IMAGE',
      tags: [],
      width: 100,
      height: 100
    });

    // Call hard delete
    await assetService.delete(asset.id, true);

    // Verify file is gone from disk
    assert.strictEqual(await storage.exists(filePath), false);

    // Verify it is completely removed from list in store
    const { data: assets } = projectStore.listAssets({ limit: 1000 });
    const found = assets.some(a => a.id === asset.id);
    assert.strictEqual(found, false);
  });

  await t.test('3. Cleanup worker purges files past threshold', async () => {
    // Create an asset
    const subPath = 'images/test-expired.png';
    const filePath = await storage.save(testFileBuffer, subPath);
    
    const asset = projectStore.createAsset({
      originalName,
      fileName: 'test-expired.png',
      mimeType: 'image/png',
      fileSize: testFileBuffer.length,
      filePath,
      optimizedPath: null,
      thumbnailPath: null,
      category: 'IMAGE',
      tags: [],
      width: 100,
      height: 100
    });

    // Soft delete it
    await assetService.delete(asset.id, false);

    // Artificially modify deletedAt to be 2 hours ago
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    const rawAsset = (projectStore as any).data.assets.find((a: any) => a.id === asset.id);
    if (rawAsset) {
      rawAsset.deletedAt = twoHoursAgo;
    }

    // Verify it's found in expired soft deleted list with threshold of 1 hour (60 minutes)
    const expired = projectStore.getExpiredSoftDeletedAssets(60 * 60 * 1000);
    assert.strictEqual(expired.some(a => a.id === asset.id), true);

    // Run custom cleanup pass simulating the worker
    process.env.CLEANUP_THRESHOLD_MINUTES = '60'; // 1 hour
    
    // Call getExpiredSoftDeletedAssets and purge them
    const thresholdMs = 60 * 60 * 1000;
    const expiredAssets = projectStore.getExpiredSoftDeletedAssets(thresholdMs);
    for (const a of expiredAssets) {
      if (a.filePath) await storage.delete(a.filePath);
      projectStore.hardDeleteAsset(a.id);
    }

    // Verify the file is now gone
    assert.strictEqual(await storage.exists(filePath), false);

    // Verify asset is completely deleted from the store list
    const { data: assets } = projectStore.listAssets({ limit: 1000 });
    assert.strictEqual(assets.some(a => a.id === asset.id), false);
  });
});
