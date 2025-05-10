import { db } from '@/server/database';
import {
  insertProfessorTableSchema,
  professorTable,
  selectProfessorTableSchema,
} from '@/server/database/schema';
import { TRPCError } from '@trpc/server';
import { eq } from 'drizzle-orm';
import { createTRPCRouter, privateProcedure } from '../init';

export const professorRouter = createTRPCRouter({
  get: privateProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== 'professor') {
      throw new TRPCError({ code: 'FORBIDDEN', message: 'Not a professor' });
    }
    const professor = await db.query.professorTable.findFirst({
      where: eq(professorTable.userId, ctx.user.id),
    });
    if (!professor) return {};
    return selectProfessorTableSchema.parse(professor);
  }),
  set: privateProcedure
    .input(insertProfessorTableSchema)
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== 'professor') {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Not a professor' });
      }
      let professor = await db.query.professorTable.findFirst({
        where: eq(professorTable.userId, ctx.user.id),
      });
      if (!professor) {
        const [created] = await db
          .insert(professorTable)
          .values({ ...input, userId: ctx.user.id })
          .returning();
        return selectProfessorTableSchema.parse(created);
      }
      const [updated] = await db
        .update(professorTable)
        .set(input)
        .where(eq(professorTable.id, professor.id))
        .returning();
      return selectProfessorTableSchema.parse(updated);
    }),
});
