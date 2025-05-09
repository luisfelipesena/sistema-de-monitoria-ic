import { db } from '@/server/database';
import { alunoTable, insertAlunoTableSchema } from '@/server/database/schema';
import { eq } from 'drizzle-orm';
import { createTRPCRouter, privateProcedure } from '../init';

export const alunoRouter = createTRPCRouter({
  get: privateProcedure.query(async ({ ctx }) => {
    const aluno = await db.query.alunoTable.findFirst({
      where: eq(alunoTable.userId, ctx.user.id),
    });
    return aluno || {};
  }),
  set: privateProcedure
    .input(insertAlunoTableSchema)
    .mutation(async ({ input, ctx }) => {
      let aluno = await db.query.alunoTable.findFirst({
        where: eq(alunoTable.userId, ctx.user.id),
      });

      if (!aluno) {
        return await db
          .insert(alunoTable)
          .values({
            ...input,
            userId: ctx.user.id,
          })
          .returning();
      }

      return await db
        .update(alunoTable)
        .set(input)
        .where(eq(alunoTable.id, aluno.id))
        .returning();
    }),
});
