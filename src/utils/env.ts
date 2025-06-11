import { createEnv } from '@t3-oss/env-nextjs'
import { z } from 'zod'

export const env = createEnv({
  /**
   * Client-side environment variables (accessible in browser)
   * These are prefixed with NEXT_PUBLIC_
   */
  client: {
    NEXT_PUBLIC_APP_URL: z.string().url().default('http://localhost:3000'),
  },

  /**
   * Server-side environment variables (server-side only)
   * These are NOT accessible in the browser
   */
  server: {
    // Database
    DATABASE_URL: z.string().url(),

    // Authentication
    CAS_SERVER_URL_PREFIX: z.string().url().default('https://autenticacao.ufba.br/ca'),
    SERVER_URL: z.string().url().default('http://localhost:3000'),
    CLIENT_URL: z.string().url().default('http://localhost:3000'),

    // Environment
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.string().default('3000'),

    // MinIO Storage
    MINIO_ENDPOINT: z.string().default('localhost'),
    MINIO_PORT: z.string().default('9000'),
    MINIO_ACCESS_KEY: z.string().default('minioadmin'),
    MINIO_SECRET_KEY: z.string().default('minioadmin'),
    MINIO_BUCKET_NAME: z.string().default('sistema-de-monitoria-dev'),

    // Email
    EMAIL_USER: z.string().email().optional(),
    EMAIL_PASS: z.string().optional(),

    // API Auth
    JWT_SECRET: z.string().min(32).optional(),
  },

  /**
   * Runtime environment variables
   * Ensures type safety at build time
   */
  runtimeEnv: {
    // Client
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,

    // Server
    DATABASE_URL: process.env.DATABASE_URL,
    CAS_SERVER_URL_PREFIX: process.env.CAS_SERVER_URL_PREFIX,
    SERVER_URL: process.env.SERVER_URL,
    CLIENT_URL: process.env.CLIENT_URL,
    NODE_ENV: process.env.NODE_ENV,
    PORT: process.env.PORT,
    MINIO_ENDPOINT: process.env.MINIO_ENDPOINT,
    MINIO_PORT: process.env.MINIO_PORT,
    MINIO_ACCESS_KEY: process.env.MINIO_ACCESS_KEY,
    MINIO_SECRET_KEY: process.env.MINIO_SECRET_KEY,
    MINIO_BUCKET_NAME: process.env.MINIO_BUCKET_NAME,
    EMAIL_USER: process.env.EMAIL_USER,
    EMAIL_PASS: process.env.EMAIL_PASS,
    JWT_SECRET: process.env.JWT_SECRET,
  },

  /**
   * Skip validation during build time
   * Useful for Docker builds where env vars might not be available
   */
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,

  /**
   * Ensures environment variables are not bundled into client-side code
   * when they shouldn't be
   */
  emptyStringAsUndefined: true,
})

// Type-safe environment variables
export type Env = typeof env
