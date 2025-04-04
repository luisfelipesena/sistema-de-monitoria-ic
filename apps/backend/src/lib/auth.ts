import { DrizzlePostgreSQLAdapter } from "@lucia-auth/adapter-drizzle"
import { Lucia } from "lucia"
import { db } from "../database"
import { sessionTable, userTable, type userRoleEnum } from "../database/schema"

const adapter = new DrizzlePostgreSQLAdapter(db, sessionTable, userTable)

// NOTE: Make sure to configure NODE_ENV=production when deploying!
const isProduction = process.env.NODE_ENV === "production"

export const lucia = new Lucia(adapter, {
  sessionCookie: {
    // IMPORTANT! Set `secure` attribute to `true` when using HTTPS
    // Set `secure` attribute to `false` or `!isProduction` in development
    attributes: {
      secure: isProduction,
    },
  },
  getUserAttributes: (attributes) => {
    // attributes defined in `DatabaseUserAttributes`
    return {
      email: attributes.email,
      role: attributes.role,
    }
  },
})

// IMPORTANT! Register your Lucia instance type
declare module "lucia" {
  interface Register {
    Lucia: typeof lucia
    DatabaseUserAttributes: DatabaseUserAttributes // Extend DatabaseUserAttributes
  }

  // Extend DatabaseUserAttributes
  interface DatabaseUserAttributes {
    email: string
    role: typeof userRoleEnum.enumValues[number]
  }
}
