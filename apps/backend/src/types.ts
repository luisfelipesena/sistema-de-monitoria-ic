import type { User, Session } from "lucia"
import { db } from "./database"

type DatabaseInstance = typeof db

// Define Variables type for Hono context
export interface AppVariables {
  // jwtPayload: { // We might not need JWT payload if using Lucia sessions directly
  //   // TODO: Add jwtPayload type
  // }
  db: DatabaseInstance
  user: User | null // Add user type from Lucia
  session: Session | null // Add session type from Lucia
}

// Define Bindings if needed (for Cloudflare Workers, etc.)
// export interface AppBindings {}

// Combine Variables and Bindings for Hono's Env type
export type AppEnv = {
  Variables: AppVariables
  // Bindings: AppBindings
}