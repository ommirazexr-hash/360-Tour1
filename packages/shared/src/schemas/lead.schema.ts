import { z } from 'zod';

export const createLeadSchema = z.object({
  projectId: z.string().uuid(),
  name: z.string().min(2).max(100).trim(),
  email: z.string().email().max(200).trim(),
  phone: z.string().max(30).trim().optional(),
  message: z.string().max(2000).trim().optional(),
  source: z.string().max(200).optional(),
});
