import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();
export const envSchema = z.object({
  DATABASE_URL: z.string(),
  SERVER_NAME: z.string().default('http://localhost:3000'),
  CLIENT_URL: z.string().default('http://localhost:5173'),
  CAS_SERVER_URL_PREFIX: z.string().default('https://autenticacao.ufba.br/ca'),
  NODE_ENV: z.enum(['development', 'production']).default('development'),
});

export const env = envSchema.parse(process.env);
