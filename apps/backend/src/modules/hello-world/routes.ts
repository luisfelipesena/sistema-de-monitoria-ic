import { Hono } from "hono"
import type { AppVariables } from "../../types"

export const helloWorldRoutes = new Hono<{ Variables: AppVariables }>().get("/", async (c) => {
  return c.json({ message: "Hello World" }, 200)
})
