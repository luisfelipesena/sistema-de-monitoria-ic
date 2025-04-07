import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const isTest = process.env.NODE_ENV === 'test';

export const envSchema = z.object({
  DATABASE_URL: z.string(),
  RESEND_API_KEY: isTest ? z.string().optional() : z.string(),
  EMAIL_FROM: z.string().optional(),
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
});

export const env = envSchema.parse(process.env);
