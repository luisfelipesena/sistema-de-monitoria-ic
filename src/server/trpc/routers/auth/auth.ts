import { lucia } from '@/server/lib/auth';
import { z } from 'zod';
import { createTRPCRouter, privateProcedure, publicProcedure } from '../../init';
import { AuthService } from './service';

const authService = new AuthService();

export const authRouter = createTRPCRouter({
  me: privateProcedure.query(async ({ ctx }) => {
    return ctx.user;
  }),
  logout: privateProcedure.mutation(async ({ ctx }) => {
    await lucia.invalidateSession(ctx.session?.id || '');
    ctx.cookies.removeCookie(lucia.sessionCookieName);
    return { success: true };
  }),
  login: publicProcedure.mutation(async ({ ctx }) => {
    return authService.getClientLoginRedirectUrl();
  }),
  loginCallback: publicProcedure.input(z.object({ responseData: z.string() })).mutation(async ({ input, ctx }) => {
    const { responseData } = input;
    const result = await authService.handleLoginCallback(responseData, ctx.cookies)
    return result
  }),
});
