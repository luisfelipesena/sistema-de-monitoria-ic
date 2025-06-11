import { router, protectedProcedure } from '../trpc';
import { z } from 'zod';
import { db } from '@server/database';
import { userTable } from '@server/database/schema';
import { eq } from 'drizzle-orm';

export const signatureRouter = router({
  getProfile: protectedProcedure.query(async ({ ctx }) => {
    return db
      .select({ assinaturaDefault: userTable.assinaturaDefault, dataAssinaturaDefault: userTable.dataAssinaturaDefault })
      .from(userTable)
      .where(eq(userTable.id, ctx.user!.id))
      .then((r) => r[0] || null);
  }),
  saveProfile: protectedProcedure
    .input(z.object({ signatureImage: z.string().min(10) }))
    .mutation(async ({ ctx, input }) => {
      const now = new Date();
      await db
        .update(userTable)
        .set({ assinaturaDefault: input.signatureImage, dataAssinaturaDefault: now })
        .where(eq(userTable.id, ctx.user!.id));
      return { success: true };
    }),
});