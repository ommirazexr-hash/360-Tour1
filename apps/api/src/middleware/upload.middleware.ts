import multer from 'multer';
import path from 'path';
import os from 'os';
import { Request } from 'express';
import { ASSET_CATEGORIES, ALLOWED_EXTENSIONS } from '@vt/shared';
import type { AssetCategory } from '@vt/shared';

// Store uploads in system temp dir for processing
export const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '524288000'), // 500MB default
  },
  fileFilter: (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    // We validate category-specific types in the service layer
    // Here we just ensure it's not an executable
    const ext = path.extname(file.originalname).toLowerCase();
    const dangerousExts = ['.exe', '.bat', '.sh', '.cmd', '.ps1', '.php', '.py', '.js', '.ts'];
    if (dangerousExts.includes(ext)) {
      cb(new Error('File type not allowed'));
      return;
    }
    cb(null, true);
  },
});

export const uploadSingle = (fieldName: string) => upload.single(fieldName);
export const uploadMultiple = (fieldName: string, maxCount = 10) =>
  upload.array(fieldName, maxCount);

/**
 * Validate that the uploaded file matches the expected asset category.
 */
export function validateFileForCategory(
  file: Express.Multer.File,
  category: AssetCategory
): void {
  const ext = path.extname(file.originalname).toLowerCase();
  const allowed = ALLOWED_EXTENSIONS[category];
  if (!allowed.includes(ext)) {
    throw new Error(
      `Invalid file type "${ext}" for category ${category}. Allowed: ${allowed.join(', ')}`
    );
  }

  const config = ASSET_CATEGORIES[category];
  if (file.size > config.maxSize) {
    const maxMB = Math.round(config.maxSize / 1024 / 1024);
    throw new Error(`File exceeds maximum size of ${maxMB}MB for category ${category}`);
  }
}
