import { lucia } from '@/server/lib/auth';
import { env } from '@/utils/env';
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
    return authService.getLoginRedirectUrl();
  }),
  casCallback: publicProcedure.input(z.object({ ticket: z.string() })).mutation(async ({ input, ctx }) => {
    const ticket = input.ticket;
    const serviceUrl = `${env.SERVER_URL}/auth/cas-callback`;
    const result = await authService.handleCasCallback(ticket, serviceUrl, ctx.cookies);
    if (result.success) return { success: true };
    throw new Error(result.error || 'Erro na autenticação CAS');
  }),
});
