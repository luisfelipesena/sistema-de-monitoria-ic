import { db } from '@/server/database';
import { alunoTable, insertAlunoTableSchema } from '@/server/database/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { createTRPCRouter, privateProcedure } from '../init';

// Schema estendido para incluir campos de upload
const alunoInputSchema = insertAlunoTableSchema.extend({
  historicoEscolarFileId: z.string().optional(),
  comprovanteMatriculaFileId: z.string().optional(),
});

export const alunoRouter = createTRPCRouter({
  get: privateProcedure.query(async ({ ctx }) => {
    const aluno = await db.query.alunoTable.findFirst({
      where: eq(alunoTable.userId, ctx.user.id),
    });
    return aluno;
  }),
  set: privateProcedure
    .input(alunoInputSchema)
    .mutation(async ({ input, ctx }) => {
      // Extrair os campos de upload antes de inserir no banco
      const { historicoEscolarFileId, comprovanteMatriculaFileId, ...alunoData } = input;

      const aluno = await db.query.alunoTable.findFirst({
        where: eq(alunoTable.userId, ctx.user.id),
      });

      // TODO: Armazenar IDs de arquivos em uma tabela de documentos relacionada
      // por enquanto apenas registramos o aluno

      if (!aluno) {
        return await db
          .insert(alunoTable)
          .values({
            ...alunoData,
            userId: ctx.user.id,
          })
          .returning();
      }

      return await db
        .update(alunoTable)
        .set(alunoData)
        .where(eq(alunoTable.id, aluno.id))
        .returning();
    }),
});
