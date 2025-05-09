import { getSessionId } from '@/utils/lucia';
import { initTRPC } from '@trpc/server';
import superjson from 'superjson';
import { lucia } from '../lib/auth';

export async function createContext(req: Request) {
  const headers = req.headers;
  const sessionId = getSessionId(headers);
  const result = await lucia.validateSession(sessionId || '');
  return {
    user: result.user,
    session: result.session,
  };
}

type Context = Awaited<ReturnType<typeof createContext>>;
const t = initTRPC.context<Context>().create({
  transformer: superjson,
});

const isAuthed = t.middleware(async ({ ctx, next }) => {
  if (!ctx.session || !ctx.user) throw new Error('Unauthorized');

  return next({
    ctx: {
      user: ctx.user,
      session: ctx.session,
    },
  });
});

export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure;
export const privateProcedure = t.procedure.use(isAuthed);
