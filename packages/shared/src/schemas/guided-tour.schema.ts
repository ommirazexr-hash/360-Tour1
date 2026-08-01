import { z } from 'zod';

const guidedStepInput = z.object({
  sceneId: z.string().uuid(),
  order: z.number().int().min(0),
  duration: z.number().int().min(1).max(300).default(10),
  narrationTitle: z.string().max(200).trim().nullable().optional(),
  narrationText: z.string().max(2000).trim().nullable().optional(),
  targetYaw: z.number().nullable().optional(),
  targetPitch: z.number().nullable().optional(),
  targetZoom: z.number().min(0).max(100).nullable().optional(),
  rotationAngle: z.number().nullable().optional(),
  rotationSpeed: z.number().min(0.1).max(20).nullable().optional(),
  audioUrl: z.string().trim().nullable().optional(),
  highlightHotspotId: z.string().uuid().nullable().optional(),
});

export const updateGuidedTourSchema = z.object({
  steps: z.array(guidedStepInput).min(0).max(100),
});
