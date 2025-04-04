import { Hono, type MiddlewareHandler } from "hono"
import { cors } from "hono/cors"
import { HTTPException } from "hono/http-exception"
import { logger } from "hono/logger"
import { poweredBy } from "hono/powered-by"
import { prettyJSON } from "hono/pretty-json"
import { AppError } from "./error"
import { authMiddleware } from "./middleware/auth"
import { authRoutes } from "./modules/auth/routes"
import { helloWorldRoutes } from "./modules/hello-world/routes"
import type { AppEnv } from "./types"

// --- API Routes ---

export const app = (depsMiddleware: MiddlewareHandler<AppEnv>) =>
  new Hono<AppEnv>()
    .use(depsMiddleware)
    .use("*", poweredBy())
    .use("*", logger())
    .use("*", cors())
    .use("*", prettyJSON())
    .use("/api/*", authMiddleware)
    .route("/auth", authRoutes)
    .route("/hello-world", helloWorldRoutes)
    .notFound((c) => {
      return c.json({ message: "Not Found", ok: false }, 404)
    })
    .onError((err, c) => {
      if (err instanceof HTTPException) {
        return err.getResponse()
      }
      if (err instanceof AppError) {
        return c.json({ message: err.message }, err.status)
      }
      console.error(`Server Error: ${err}`)
      return c.json({ message: "Internal Server Error" }, 500)
    })

export type AppType = ReturnType<typeof app>
