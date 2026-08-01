import { z } from 'zod';

export const updateSettingsSchema = z.object({
  settings: z.array(
    z.object({
      key: z.string().min(1).max(100),
      value: z.string().max(5000),
    })
  ).min(1).max(50),
});
