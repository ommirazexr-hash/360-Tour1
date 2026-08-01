import { z } from 'zod';

export const createSceneSchema = z.object({
  title: z.string().min(1).max(200).trim(),
  description: z.string().max(5000).trim().optional(),
});

export const updateSceneSchema = z.object({
  title: z.string().min(1).max(200).trim().optional(),
  description: z.string().max(5000).trim().nullable().optional(),
  defaultAvatarId: z.string().uuid().nullable().optional(),
  avatarPlaybackMode: z.enum(['CLICK_TO_PLAY', 'AUTO_PLAY', 'GUIDED_TOUR']).nullable().optional(),
  avatarPosition: z.enum(['BOTTOM_LEFT', 'BOTTOM_RIGHT', 'CENTER', 'CUSTOM']).nullable().optional(),
  avatarVolume: z.number().int().min(0).max(100).nullable().optional(),
  avatarMuted: z.boolean().nullable().optional(),
  avatarReplay: z.boolean().nullable().optional(),
  avatarPostPlaybackAction: z.enum(['DO_NOTHING', 'JUMP_TO_SCENE', 'OPEN_PDF', 'OPEN_URL', 'PLAY_NEXT_AVATAR']).nullable().optional(),
  avatarPostPlaybackTargetSceneId: z.string().uuid().nullable().optional(),
  avatarPostPlaybackTargetAssetId: z.string().nullable().optional(),
  avatarPostPlaybackTargetUrl: z.string().url().max(2000).or(z.literal('')).nullable().optional(),
  avatarPostPlaybackTargetNextAvatarId: z.string().uuid().nullable().optional(),
  avatarCustomPositionX: z.number().min(0).max(100).nullable().optional(),
  avatarCustomPositionY: z.number().min(0).max(100).nullable().optional(),
  avatarScale: z.number().min(0.5).max(5).nullable().optional(),
});

export const reorderScenesSchema = z.object({
  scenes: z.array(
    z.object({
      id: z.string().uuid(),
      order: z.number().int().min(0),
    })
  ).min(1),
});

export const updateDefaultViewSchema = z.object({
  defaultYaw: z.number().min(-Math.PI).max(Math.PI),
  defaultPitch: z.number().min(-Math.PI / 2).max(Math.PI / 2),
  defaultZoom: z.number().min(0).max(100),
});
