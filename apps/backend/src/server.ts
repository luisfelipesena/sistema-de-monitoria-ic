import { serve } from "@hono/node-server"
import { createMiddleware } from "hono/factory"
import { db } from "./database"
import { app } from "./index"
import type { AppEnv } from "./types"

const injectDependencies = createMiddleware<AppEnv>(async (c, next) => {
  c.set("db", db)
  c.set("user", null)
  c.set("session", null)
  await next()
})

serve({ fetch: app(injectDependencies).fetch, port: 3000 })
console.log(" ✅ Server starting on port 3000...")
