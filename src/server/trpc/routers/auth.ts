import { createTRPCRouter, privateProcedure } from '../init';

export const authRouter = createTRPCRouter({
  me: privateProcedure.query(async ({ ctx }) => {
    return ctx.user;
  }),
});
