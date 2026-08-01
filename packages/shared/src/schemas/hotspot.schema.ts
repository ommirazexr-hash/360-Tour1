import { z } from 'zod';

const hotspotTypeEnum = z.enum([
  'SCENE_LINK',
  'INFO_POPUP',
  'PDF',
  'VIDEO',
  'IMAGE',
  'EXTERNAL_URL',
  'CONTACT_FORM',
  'AVATAR',
]);

const avatarFields = {
  avatarId: z.string().uuid().nullable().optional(),
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
};

export const createHotspotSchema = z.object({
  label: z.string().min(1).max(200).trim(),
  description: z.string().max(2000).trim().nullable().optional(),
  iconType: z.string().max(50).default('default'),
  yaw: z.number(),
  pitch: z.number(),
  type: hotspotTypeEnum,
  targetSceneId: z.string().uuid().nullable().optional(),
  targetAssetId: z.string().nullable().optional(),
  targetUrl: z.string().url().max(2000).or(z.literal('')).nullable().optional(),
  ...avatarFields,
}).refine((data) => {
  if (data.type === 'SCENE_LINK' && !data.targetSceneId) {
    return false;
  }
  if (data.type === 'EXTERNAL_URL' && !data.targetUrl) {
    return false;
  }
  if (['PDF', 'IMAGE'].includes(data.type) && !data.targetAssetId) {
    return false;
  }
  if (data.type === 'AVATAR' && !data.avatarId) {
    return false;
  }
  return true;
}, {
  message: 'Target field is required for the selected hotspot type',
});

export const updateHotspotSchema = z.object({
  label: z.string().min(1).max(200).trim().optional(),
  description: z.string().max(2000).trim().nullable().optional(),
  iconType: z.string().max(50).optional(),
  yaw: z.number().optional(),
  pitch: z.number().optional(),
  type: hotspotTypeEnum.optional(),
  targetSceneId: z.string().uuid().nullable().optional(),
  targetAssetId: z.string().nullable().optional(),
  targetUrl: z.string().url().max(2000).or(z.literal('')).nullable().optional(),
  ...avatarFields,
});

export const updateHotspotPositionSchema = z.object({
  yaw: z.number(),
  pitch: z.number(),
});
