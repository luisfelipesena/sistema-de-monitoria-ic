import { db } from '@/server/database';
import { alunoTable, professorTable } from '@/server/database/schema';
import { eq } from 'drizzle-orm';
import { createTRPCRouter, privateProcedure } from '../init';

export const onboardingRouter = createTRPCRouter({
  getStatus: privateProcedure.query(async ({ ctx }) => {
    const { id, role } = ctx.user;
    if (role === 'student') {
      const aluno = await db.query.alunoTable.findFirst({
        where: eq(alunoTable.userId, id),
      });
      if (!aluno) {
        return { pending: true, reason: 'missing-student-entity' };
      }
      return { pending: false };
    }
    if (role === 'professor') {
      const professor = await db.query.professorTable.findFirst({
        where: eq(professorTable.userId, id),
      });
      if (!professor) {
        return { pending: true, reason: 'missing-professor-entity' };
      }
      return { pending: false };
    }
    return { pending: false };
  }),
});
