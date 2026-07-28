import { createEnv } from '@t3-oss/env-nextjs'
import { z } from 'zod'

export const env = createEnv({
  /**
   * Client-side environment variables (accessible in browser)
   * These are prefixed with NEXT_PUBLIC_
   */
  client: {
    NEXT_PUBLIC_APP_URL: z.string().url().default('https://sistema-de-monitoria.app.ic.ufba.br'),
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
    SERVER_URL: z.string().url().default('https://sistema-de-monitoria.app.ic.ufba.br/api'),
    CLIENT_URL: z.string().url().default('https://sistema-de-monitoria.app.ic.ufba.br'),

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
    EMAIL_VERIFICATION_URL: z.string().url().optional(),
    PASSWORD_RESET_URL: z.string().url().optional(),
    EMAIL_FROM_NAME: z.string().default('Sistema de Monitoria IC - UFBA'),

    // SMTP (optional override; without SMTP_HOST the Gmail service transport is used)
    SMTP_HOST: z.string().optional(),
    SMTP_PORT: z.coerce.number().int().positive().optional(),
    SMTP_SECURE: z.enum(['true', 'false']).optional(),
    SMTP_USER: z.string().optional(),
    SMTP_PASS: z.string().optional(),

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
    EMAIL_VERIFICATION_URL: process.env.EMAIL_VERIFICATION_URL,
    PASSWORD_RESET_URL: process.env.PASSWORD_RESET_URL,
    EMAIL_FROM_NAME: process.env.EMAIL_FROM_NAME,
    SMTP_HOST: process.env.SMTP_HOST,
    SMTP_PORT: process.env.SMTP_PORT,
    SMTP_SECURE: process.env.SMTP_SECURE,
    SMTP_USER: process.env.SMTP_USER,
    SMTP_PASS: process.env.SMTP_PASS,
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
