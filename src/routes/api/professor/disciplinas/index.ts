import { db } from '@/server/database';
import {
  disciplinaProfessorResponsavelTable,
  professorTable,
} from '@/server/database/schema';
import {
  createAPIHandler,
  withAuthMiddleware,
  withRoleMiddleware,
} from '@/server/middleware/common';
import { getCurrentSemester } from '@/utils/get-current-semester';
import { json } from '@tanstack/react-start';
import { createAPIFileRoute } from '@tanstack/react-start/api';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';

const postSchema = z.object({
  disciplinaId: z.number(),
});

export const APIRoute = createAPIFileRoute('/api/professor/disciplinas')({
  GET: createAPIHandler(
    withRoleMiddleware(['professor', 'admin'], async (ctx) => {
      const { user } = ctx.state;
      const professor = await db.query.professorTable.findFirst({
        where: eq(professorTable.userId, parseInt(user.userId)),
      });

      if (!professor) {
        return json({ error: 'Professor not found' }, { status: 404 });
      }

      const { year, semester } = getCurrentSemester();

      const professorDisciplinas =
        await db.query.disciplinaProfessorResponsavelTable.findMany({
          where: and(
            eq(disciplinaProfessorResponsavelTable.professorId, professor.id),
            eq(disciplinaProfessorResponsavelTable.ano, year),
            eq(disciplinaProfessorResponsavelTable.semestre, semester)
          ),
          with: {
            disciplina: {
              with: {
                departamento: true,
              },
            },
          },
        });

      return json(professorDisciplinas);
    })
  ),
  POST: createAPIHandler(
    withRoleMiddleware(['professor', 'admin'], async (ctx) => {
      const { user } = ctx.state;
      const professor = await db.query.professorTable.findFirst({
        where: eq(professorTable.userId, parseInt(user.userId)),
      });

      if (!professor) {
        return json({ error: 'Professor not found' }, { status: 404 });
      }

      const { disciplinaId } = postSchema.parse(await ctx.request.json());
      const { year, semester } = getCurrentSemester();

      const result = await db
        .insert(disciplinaProfessorResponsavelTable)
        .values({
          professorId: professor.id,
          disciplinaId,
          ano: year,
          semestre: semester,
        })
        .returning();

      return json(result[0], { status: 201 });
    })
  ),
}); 