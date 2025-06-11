import { type NextApiRequest, type NextApiResponse } from 'next';
import { parse } from 'cookie';
import { JwtUser, Context } from './trpc';
import { lucia } from '@/server/lib/auth';
import { getSessionId } from '@/utils/lucia';
import { db } from '@/server/database';
import { userTable } from '@/server/database/schema';
import { eq } from 'drizzle-orm';

export async function createContext({ req, res }: { req: NextApiRequest; res: NextApiResponse }): Promise<Context> {
  // TODO: integrate lucia session cookie verification; stub for now
  const cookies = parse(req.headers.cookie || '');
  const sessionId = getSessionId(new Headers(req.headers as any));

  let user: JwtUser | null = null;
  if (sessionId) {
    const { session, user } = await lucia.validateSession(sessionId);
    if (session && user) {
      // fetch role from DB
      const res = await db
        .select({ role: userTable.role })
        .from(userTable)
        .where(eq(userTable.id, user.id))
        .limit(1);
      const role = res[0]?.role;
      user = { id: user.id, username: user.username, email: user.email, role } as any;
    }
  }

  return {
    user,
  };
}