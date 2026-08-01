import { z } from 'zod';

export const createProjectSchema = z.object({
  name: z.string().min(2).max(200).trim(),
  companyName: z.string().max(200).trim().optional(),
  description: z.string().max(5000).trim().optional(),
});

export const updateProjectSchema = z.object({
  name: z.string().min(2).max(200).trim().optional(),
  companyName: z.string().max(200).trim().nullable().optional(),
  description: z.string().max(5000).trim().nullable().optional(),
});

export const duplicateProjectSchema = z.object({
  name: z.string().min(2).max(200).trim().optional(),
});
