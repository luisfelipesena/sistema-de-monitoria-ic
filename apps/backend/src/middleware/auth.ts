import { createMiddleware } from "hono/factory"
import { lucia } from "../lib/auth"
import type { AppEnv } from "../types"

export const authMiddleware = createMiddleware<AppEnv>(async (c, next) => {
  const sessionId = lucia.readSessionCookie(c.req.header("Cookie") ?? "")

  if (!sessionId) {
    c.set("user", null)
    c.set("session", null)
    return next()
  }

  const { session, user } = await lucia.validateSession(sessionId)

  if (session && session.fresh) {
    // Session was refreshed, create a new cookie
    const sessionCookie = lucia.createSessionCookie(session.id)
    c.header("Set-Cookie", sessionCookie.serialize(), { append: true })
  }

  if (!session) {
    // Invalid session, create a blank cookie to remove the old one
    const sessionCookie = lucia.createBlankSessionCookie()
    c.header("Set-Cookie", sessionCookie.serialize(), { append: true })
  }

  c.set("user", user)
  c.set("session", session)
  return next()
}) 