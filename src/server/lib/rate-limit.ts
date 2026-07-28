/**
 * Fixed-window rate limiter kept in the Node process memory.
 *
 * This is correct today only because the app runs as a single Dokku container.
 * If it is ever scaled to more than one web process, every process gets its own
 * counters and the effective limit silently multiplies by the process count —
 * at that point this must move to Upstash/Redis or a DB-backed counter.
 */

export type RateLimitConfig = {
  limit: number
  windowMs: number
  keyPrefix: string
}

export type RateLimitResult = {
  allowed: boolean
  retryAfterMs: number
}

type Bucket = {
  count: number
  resetAt: number
}

const MAX_ENTRIES = 5000

const buckets = new Map<string, Bucket>()

// Map preserves insertion order, so the first key is the oldest bucket.
function evictOldest() {
  while (buckets.size > MAX_ENTRIES) {
    const oldest = buckets.keys().next()
    if (oldest.done) return
    buckets.delete(oldest.value)
  }
}

export function consume(key: string, config: RateLimitConfig): RateLimitResult {
  const now = Date.now()
  const bucket = buckets.get(key)

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + config.windowMs })
    evictOldest()
    return { allowed: true, retryAfterMs: 0 }
  }

  if (bucket.count >= config.limit) {
    return { allowed: false, retryAfterMs: bucket.resetAt - now }
  }

  bucket.count += 1
  return { allowed: true, retryAfterMs: 0 }
}

const MINUTE_MS = 60 * 1000
const HOUR_MS = 60 * MINUTE_MS

export const RATE_LIMITS = {
  login: { limit: 5, windowMs: 15 * MINUTE_MS, keyPrefix: 'login' },
  register: { limit: 5, windowMs: HOUR_MS, keyPrefix: 'register' },
  requestPasswordReset: { limit: 3, windowMs: HOUR_MS, keyPrefix: 'password-reset' },
  resendVerification: { limit: 3, windowMs: HOUR_MS, keyPrefix: 'resend-verification' },
} as const satisfies Record<string, RateLimitConfig>
