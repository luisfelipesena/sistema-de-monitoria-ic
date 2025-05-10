import { env } from '@/utils/env';
import { LUCIA_SESSION_COOKIE_NAME } from '@/utils/types';
import { DrizzlePostgreSQLAdapter } from '@lucia-auth/adapter-drizzle';
import { Lucia, TimeSpan } from 'lucia';
import { db } from '../database';
import { sessionTable, userTable, type userRoleEnum } from '../database/schema';

const isProduction = env.NODE_ENV === 'production';
const adapter = new DrizzlePostgreSQLAdapter(db, sessionTable, userTable);

export const lucia = new Lucia(adapter, {
  sessionExpiresIn: new TimeSpan(30, 'd'), // 30 days
  sessionCookie: {
    name: LUCIA_SESSION_COOKIE_NAME,
    expires: false, // session cookies have very long lifespan (2 years)
    attributes: {
      secure: isProduction,
      sameSite: 'lax',
      path: '/',
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

  interface DatabaseUserAttributes {
    username: string;
    email: string;
    role: (typeof userRoleEnum.enumValues)[number];
  }
}
