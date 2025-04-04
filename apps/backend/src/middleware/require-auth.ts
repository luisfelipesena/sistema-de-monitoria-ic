import { createMiddleware } from "hono/factory"
import { HTTPException } from "hono/http-exception"
import type { AppEnv } from "../types"

/**
 * Middleware to ensure the user is authenticated.
 * Must be placed *after* the main `authMiddleware`.
 * Throws a 401 HTTPException if the user is not authenticated.
 */
export const requireAuth = createMiddleware<AppEnv>(async (c, next) => {
  const user = c.get("user")

  if (!user) {
    throw new HTTPException(401, { message: "Unauthorized: Authentication required" })
  }

  // User is authenticated, proceed to the next middleware or route handler
  await next()
}) 