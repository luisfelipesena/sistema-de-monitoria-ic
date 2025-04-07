import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();
export const envSchema = z.object({
  DATABASE_URL: z.string(),
});

export const env = envSchema.parse(process.env);
