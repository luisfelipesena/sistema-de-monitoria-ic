import { db } from '@/server/db'
import { logger } from '@/utils/logger'
import { sql } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

const log = logger.child({ context: 'HealthCheck' })

const PLAIN_TEXT = {
  'Content-Type': 'text/plain; charset=utf-8',
  'Cache-Control': 'no-store',
}

/**
 * Liveness only, and deliberately opaque: the middleware matcher skips /api, so this
 * route is world-reachable and must never name the failing dependency. Deep checks
 * (SMTP verify, object storage) stay out on purpose: verify() opens a real SMTP
 * connection per request, which turns the endpoint into a quota-burning amplifier.
 */
export async function GET() {
  try {
    await db.execute(sql`SELECT 1`)
  } catch (error) {
    log.error({ error }, 'Health check failed')
    return new Response('unavailable', { status: 503, headers: PLAIN_TEXT })
  }

  return new Response('ok', { status: 200, headers: PLAIN_TEXT })
}
