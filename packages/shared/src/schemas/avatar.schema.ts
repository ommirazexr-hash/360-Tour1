import { z } from 'zod';

export const createAvatarSchema = z.object({
  name: z.string().min(1).max(200).trim(),
  description: z.string().max(2000).trim().optional().nullable(),
  language: z.string().max(50).trim().optional().default('en'),
  scriptNotes: z.string().max(5000).trim().optional().nullable(),
  projectId: z.string().uuid().optional().nullable(),
  scale: z.preprocess(
    (val) => (val === undefined || val === null || val === '' ? undefined : Number(val)),
    z.number().min(0.1).max(5.0).optional()
  ),
});

export const updateAvatarSchema = z.object({
  name: z.string().min(1).max(200).trim().optional(),
  description: z.string().max(2000).trim().optional().nullable(),
  language: z.string().max(50).trim().optional(),
  scriptNotes: z.string().max(5000).trim().optional().nullable(),
  scale: z.preprocess(
    (val) => (val === undefined || val === null || val === '' ? undefined : Number(val)),
    z.number().min(0.1).max(5.0).optional()
  ),
});
