import { getSessionId } from '@/utils/lucia';
import { initTRPC } from '@trpc/server';
import cookie from 'cookie';
import superjson from 'superjson';
import { lucia } from '../lib/auth';

export async function createContext(req: Request, resHeaders: Headers) {
  const headers = req.headers;
  const sessionId = getSessionId(headers);
  const result = await lucia.validateSession(sessionId || '');
  return {
    user: result.user,
    session: result.session,
    request: req,
    cookies: {
      getCookies() {
        const cookieHeader = req.headers.get('Cookie');
        if (!cookieHeader) return {};
        return cookie.parse(cookieHeader);
      },
      getCookie(name: string) {
        const cookieHeader = req.headers.get('Cookie');
        if (!cookieHeader) return;
        const cookies = cookie.parse(cookieHeader);
        return cookies[name];
      },
      setCookie(sessionCookie: any) {
        resHeaders.append('Set-Cookie', sessionCookie.serialize());
      },
      removeCookie(name: string) {
        resHeaders.delete(name);
      },
    },
  };
}

type Context = Awaited<ReturnType<typeof createContext>>;
const t = initTRPC.context<Context>().create({
  transformer: superjson,
});

const isAuthed = t.middleware(async ({ ctx, next }) => {
  if (!ctx.session || !ctx.user) {
    if (ctx.session) {
      await lucia.invalidateSession(ctx.session?.id || '');
    }
    ctx.cookies.removeCookie(lucia.sessionCookieName);
    throw new Error('Unauthorized');
  }

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
