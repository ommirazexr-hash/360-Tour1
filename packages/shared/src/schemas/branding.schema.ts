import { z } from 'zod';

const hexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Must be a valid hex color');

export const updateBrandingSchema = z.object({
  logoAssetId: z.string().nullable().optional(),
  logoPosition: z.enum(['top-left', 'top-right', 'top-center', 'bottom-left', 'bottom-right']).optional(),
  logoSize: z.enum(['small', 'medium', 'large']).optional(),
  coverAssetId: z.string().nullable().optional(),
  primaryColor: hexColor.optional(),
  secondaryColor: hexColor.optional(),
  backgroundColor: hexColor.optional(),
  textColor: hexColor.optional(),
  autoRotate: z.boolean().optional(),
  autoRotateSpeed: z.number().min(0.01).max(5).optional(),
  showControls: z.boolean().optional(),
  showSceneMenu: z.boolean().optional(),
  contactEmail: z.string().email().max(200).or(z.literal('')).nullable().optional(),
  contactPhone: z.string().max(30).nullable().optional(),
  websiteUrl: z.string().url().max(500).nullable().optional(),
  welcomeTitle: z.string().max(200).nullable().optional(),
  welcomeMessage: z.string().max(2000).nullable().optional(),
});
