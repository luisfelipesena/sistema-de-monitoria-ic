import { lucia } from '@/server/lib/auth';
import { createTRPCRouter, privateProcedure } from '../init';

export const authRouter = createTRPCRouter({
  me: privateProcedure.query(async ({ ctx }) => {
    return ctx.user;
  }),
  logout: privateProcedure.mutation(async ({ ctx }) => {
    ctx.cookies.removeCookie(lucia.sessionCookieName);
    return { success: true };
  }),
});
