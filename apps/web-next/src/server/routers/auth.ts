import { router, protectedProcedure } from '../trpc';
import { userSelectSchema } from '@validators';

export const authRouter = router({
  me: protectedProcedure.query(({ ctx }) => {
    if (!ctx.user) return null;
    return userSelectSchema.parse(ctx.user);
  }),
});