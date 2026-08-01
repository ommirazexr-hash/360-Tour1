import { z } from 'zod';

const assetCategoryEnum = z.enum(['PANORAMA', 'IMAGE', 'VIDEO', 'PDF', 'LOGO', 'AVATAR', 'AUDIO']);

export const uploadAssetSchema = z.object({
  category: assetCategoryEnum,
  tags: z.string().max(500).optional(), // comma-separated
});

export const updateAssetSchema = z.object({
  originalName: z.string().min(1).max(500).trim().optional(),
  tags: z.array(z.string().max(50)).max(20).optional(),
});
