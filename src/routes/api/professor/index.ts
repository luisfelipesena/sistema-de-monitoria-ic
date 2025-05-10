import { db } from '@/server/database';
import { insertProfessorTableSchema, professorTable, selectProfessorTableSchema } from '@/server/database/schema';
import { createAPIHandler, withAuthMiddleware } from '@/server/middleware/common';
import { logger } from '@/utils/logger';
import { json } from '@tanstack/react-start';
import { createAPIFileRoute } from '@tanstack/react-start/api';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

// Schema for professor response and input
export const professorResponseSchema = selectProfessorTableSchema;

export type ProfessorResponse = z.infer<typeof professorResponseSchema>;
export type ProfessorInput = z.infer<typeof insertProfessorTableSchema>;

const log = logger.child({
  context: 'ProfessorAPI',
});

export const APIRoute = createAPIFileRoute('/api/professor')({
  GET: createAPIHandler(
    withAuthMiddleware(async (ctx) => {
      try {
        const { userId, role } = ctx.state.user;
        const userIdNumber = parseInt(userId, 10);

        log.info({ userId, role }, 'Buscar dados do professor');

        const professor = await db.query.professorTable.findFirst({
          where: eq(professorTable.userId, userIdNumber),
        });

        if (!professor) {
          return json({ error: 'Professor não encontrado' }, { status: 404 });
        }

        const validatedProfessor = professorResponseSchema.parse(professor);
        return json(validatedProfessor);
      } catch (error) {
        log.error(error, 'Erro ao buscar professor');
        return json(
          { error: 'Erro ao buscar dados do professor' },
          { status: 500 }
        );
      }
    })
  ),

  POST: createAPIHandler(
    withAuthMiddleware(async (ctx) => {
      try {
        const { userId } = ctx.state.user;
        const userIdNumber = parseInt(userId, 10);
        const body = await ctx.request.json();

        const validatedInput = insertProfessorTableSchema.parse(body);

        const professor = await db.query.professorTable.findFirst({
          where: eq(professorTable.userId, userIdNumber),
        });

        let result;

        if (!professor) {
          result = await db
            .insert(professorTable)
            .values({
              ...validatedInput,
              userId: userIdNumber,
            })
            .returning();
        } else {
          result = await db
            .update(professorTable)
            .set(validatedInput)
            .where(eq(professorTable.id, professor.id))
            .returning();
        }

        const validatedProfessor = professorResponseSchema.parse(result[0]);
        return json(validatedProfessor, { status: 201 });
      } catch (error) {
        log.error(error, 'Erro ao salvar professor');

        if (error instanceof z.ZodError) {
          return json(
            {
              error: 'Dados inválidos',
              details: error.errors
            },
            { status: 400 }
          );
        }

        return json(
          { error: 'Erro ao salvar dados do professor' },
          { status: 500 }
        );
      }
    })
  ),
}); 