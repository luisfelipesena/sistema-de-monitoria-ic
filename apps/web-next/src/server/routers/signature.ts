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
  signProject: protectedProcedure
    .input(
      z.object({
        projetoId: z.number().int().positive(),
        signatureImage: z.string().min(10),
        tipoAssinatura: z.enum(['PROJETO_PROFESSOR_RESPONSAVEL', 'PROJETO_COORDENADOR_DEPARTAMENTO']),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // insere assinatura
      const [row] = await db
        .insert('@server/database/schema'.assinaturaDocumentoTable)
        .values({
          assinaturaData: input.signatureImage,
          tipoAssinatura: input.tipoAssinatura,
          userId: ctx.user!.id,
          projetoId: input.projetoId,
        })
        .returning({ id: '@server/database/schema'.assinaturaDocumentoTable.id });

      // atualiza status projeto
      await db
        .update('@server/database/schema'.projetoTable)
        .set({ status: 'PENDING_ADMIN_SIGNATURE' })
        .where(eq('@server/database/schema'.projetoTable.id, input.projetoId));

      return { success: true, signatureId: row.id };
    }),
});