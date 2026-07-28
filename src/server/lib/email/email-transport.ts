import { env } from '@/utils/env'
import nodemailer from 'nodemailer'

const user = env.SMTP_USER ?? env.EMAIL_USER
const pass = env.SMTP_PASS ?? env.EMAIL_PASS

const smtpPort = env.SMTP_PORT ?? 587

// Without SMTP_HOST we keep nodemailer's well-known gmail entry (smtp.gmail.com:465,
// implicit TLS). Expanding it into host/port defaults would silently move to STARTTLS.
export const transporter = env.SMTP_HOST
  ? nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: smtpPort,
      secure: env.SMTP_SECURE ? env.SMTP_SECURE === 'true' : smtpPort === 465,
      auth: user ? { user, pass } : undefined,
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 20_000,
    })
  : nodemailer.createTransport({
      service: 'gmail',
      auth: { user, pass },
    })

export const emailFromAddress = `"${env.EMAIL_FROM_NAME}" <${user ?? ''}>`

export type EmailTransportHealth = {
  healthy: boolean
  checkedAt: Date
  error: string | null
}

let cachedHealth: EmailTransportHealth | null = null
const HEALTH_TTL_MS = 60_000

/**
 * Cached because each verify() opens a real SMTP connection and counts against the
 * provider's rate limits. It detects auth failures (534 WebLoginRequired) but not
 * quota failures (550-5.4.5 daily limit), so the persisted failure count stays the
 * primary alert.
 */
export async function checkEmailTransport(force = false): Promise<EmailTransportHealth> {
  if (!force && cachedHealth && Date.now() - cachedHealth.checkedAt.getTime() < HEALTH_TTL_MS) {
    return cachedHealth
  }

  try {
    await transporter.verify()
    cachedHealth = { healthy: true, checkedAt: new Date(), error: null }
  } catch (error) {
    cachedHealth = {
      healthy: false,
      checkedAt: new Date(),
      error: error instanceof Error ? error.message : 'Unknown error verifying email transport',
    }
  }

  return cachedHealth
}
