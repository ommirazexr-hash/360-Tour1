import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(4000),
  PROJECT_DIR: z.string().default('./project'),
  API_PUBLIC_URL: z.string().default('http://localhost:4000'),
  MAX_FILE_SIZE: z.coerce.number().default(524288000), // 500MB
  CORS_ORIGIN: z.string().default('http://localhost:3000'),
  JWT_SECRET: z.string().default('virtual-tour-builder-secret-key-12345'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  ADMIN_PASSWORD: z.string().default('admin'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:');
  parsed.error.issues.forEach((issue) => {
    console.error(`  ${issue.path.join('.')}: ${issue.message}`);
  });
  process.exit(1);
}

export const env = parsed.data;
export type Env = typeof env;
