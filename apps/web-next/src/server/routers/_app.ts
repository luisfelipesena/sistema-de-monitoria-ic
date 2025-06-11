import { router, publicProcedure } from '../trpc';
import { authRouter } from './auth';
import { signatureRouter } from './signature';

export const appRouter = router({
  health: publicProcedure.query(() => 'ok'),
  auth: authRouter,
  signature: signatureRouter,
});

export type AppRouter = typeof appRouter;