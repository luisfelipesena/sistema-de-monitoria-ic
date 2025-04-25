import { DrizzlePostgreSQLAdapter } from '@lucia-auth/adapter-drizzle';
import { Lucia, TimeSpan } from 'lucia';
import { db } from '../database';
import { sessionTable, userTable, type userRoleEnum } from '../database/schema';
import { env } from '@/utils/env';

// TODO: Properly configure environment variables for start-basic
const isProduction = env.NODE_ENV === 'production';

const adapter = new DrizzlePostgreSQLAdapter(db, sessionTable, userTable);

export const lucia = new Lucia(adapter, {
  sessionExpiresIn: new TimeSpan(30, 'd'), // 30 days
  sessionCookie: {
    name: 'session',
    expires: false, // session cookies have very long lifespan (2 years)
    attributes: {
      secure: isProduction,
      sameSite: 'lax',
      path: '/',
      // domain: isProduction ? '.yourdomain.com' : undefined, // Optional: set domain in production
    },
  },
  getUserAttributes: (attributes) => {
    return {
      username: attributes.username,
      email: attributes.email,
      role: attributes.role,
      // Add other attributes needed directly on the user object
    };
  },
});

declare module 'lucia' {
  interface Register {
    Lucia: typeof lucia;
    DatabaseUserAttributes: DatabaseUserAttributes;
    UserId: number; // Changed from string if your userTable ID is serial (integer)
  }

  interface DatabaseUserAttributes {
    username: string;
    email: string;
    role: (typeof userRoleEnum.enumValues)[number];
    // Ensure these match the attributes returned in getUserAttributes
  }
}
