import sharp from 'sharp';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { storage } from './storage';

interface ProcessedImage {
  fileName: string;
  originalPath: string;
  optimizedPath: string | null;
  thumbnailPath: string | null;
  width: number | null;
  height: number | null;
}

interface ProcessOptions {
  category: 'PANORAMA' | 'IMAGE' | 'LOGO';
  originalExt: string;
  fileBuffer: Buffer;
}

export async function processImage(opts: ProcessOptions): Promise<ProcessedImage> {
  const { category, originalExt, fileBuffer } = opts;
  const uuid = uuidv4();
  const fileName = `${uuid}${originalExt}`;
  
  const subFolder = category === 'PANORAMA' ? 'panoramas' : 'images';

  // 1. Save original
  const originalSubPath = `${subFolder}/${fileName}`;
  await storage.save(fileBuffer, originalSubPath);

  // 2. Get image metadata
  let width: number | null = null;
  let height: number | null = null;
  try {
    const meta = await sharp(fileBuffer).metadata();
    width = meta.width ?? null;
    height = meta.height ?? null;
  } catch { /* non-critical */ }

  // 3. Generate optimized version
  let optimizedPath: string | null = null;
  try {
    const optimizedName = `optimized_${uuid}.webp`;
    const optimizedSubPath = `${subFolder}/${optimizedName}`;

    let sharpPipeline = sharp(fileBuffer);

    if (category === 'PANORAMA') {
      // Maintain 2:1 equirectangular ratio, max 8192px width
      sharpPipeline = sharpPipeline.resize({ width: 8192, withoutEnlargement: true });
    } else if (category === 'IMAGE') {
      sharpPipeline = sharpPipeline.resize({ width: 2048, withoutEnlargement: true });
    } else if (category === 'LOGO') {
      sharpPipeline = sharpPipeline.resize({ width: 500, withoutEnlargement: true });
    }

    const optimizedBuffer = await sharpPipeline
      .webp({ quality: 85, effort: 4 })
      .toBuffer();

    await storage.save(optimizedBuffer, optimizedSubPath);
    optimizedPath = optimizedSubPath;
  } catch (err) {
    // Non-fatal — original still available
    console.error('Optimization failed:', err);
  }

  // 4. Generate thumbnail
  let thumbnailPath: string | null = null;
  try {
    const thumbName = `thumb_${uuid}.webp`;
    const thumbSubPath = `${subFolder}/${thumbName}`;

    const thumbSize = category === 'PANORAMA' ? 800 : 400;
    const thumbBuffer = await sharp(fileBuffer)
      .resize({ width: thumbSize, withoutEnlargement: true })
      .webp({ quality: 80, effort: 3 })
      .toBuffer();

    await storage.save(thumbBuffer, thumbSubPath);
    thumbnailPath = thumbSubPath;
  } catch (err) {
    console.error('Thumbnail generation failed:', err);
  }

  return { fileName, originalPath: originalSubPath, optimizedPath, thumbnailPath, width, height };
}

export function getExtension(originalName: string): string {
  return path.extname(originalName).toLowerCase();
}
