import { serve } from "@hono/node-server"
import { createMiddleware } from "hono/factory"
import { db } from "./database"
import { app } from "./index"
import { AppVariables } from "./types"

const TrueDeps = createMiddleware<{ Variables: AppVariables }>(async (c, next) => {
  c.set("db", db)
  await next()
})
serve({ fetch: app(TrueDeps).fetch, port: 3001 })
console.log(" ✅ Server starting on port 3000...")