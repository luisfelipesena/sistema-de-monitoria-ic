import { env } from '@/config/env';
import { DrizzlePostgreSQLAdapter } from '@lucia-auth/adapter-drizzle';
import { Lucia } from 'lucia';
import { db } from '../database';
import { sessionTable, userTable, type userRoleEnum } from '../database/schema';

const adapter = new DrizzlePostgreSQLAdapter(db, sessionTable, userTable);
const isProduction = env.NODE_ENV === 'production';

export const lucia = new Lucia(adapter, {
  sessionCookie: {
    attributes: {
      secure: isProduction,
    },
  },
  getUserAttributes: (attributes) => {
    return {
      username: attributes.username,
      email: attributes.email,
      role: attributes.role,
    };
  },
});

declare module 'lucia' {
  interface Register {
    Lucia: typeof lucia;
    DatabaseUserAttributes: DatabaseUserAttributes;
    UserId: number;
  }

  // Extend DatabaseUserAttributes
  interface DatabaseUserAttributes {
    username: string;
    email: string;
    role: (typeof userRoleEnum.enumValues)[number];
  }
}
