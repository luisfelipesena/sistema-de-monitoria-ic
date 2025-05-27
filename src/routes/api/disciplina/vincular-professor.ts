import { disciplinaProfessorVinculoSchema } from '@/routes/api/disciplina/-types';
import { db } from '@/server/database';
import {
  disciplinaProfessorResponsavelTable,
  professorTable,
} from '@/server/database/schema';
import {
  createAPIHandler,
  withRoleMiddleware,
} from '@/server/middleware/common';
import { logger } from '@/utils/logger';
import { json } from '@tanstack/react-start';
import { createAPIFileRoute } from '@tanstack/react-start/api';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';

const log = logger.child({
  context: 'DisciplinaProfessorVinculoAPI',
});

export const APIRoute = createAPIFileRoute(
  '/api/disciplina/vincular-professor',
)({
  POST: createAPIHandler(
    withRoleMiddleware(['admin', 'professor'], async (ctx) => {
      try {
        const body = await ctx.request.json();
        const validatedData = disciplinaProfessorVinculoSchema.parse(body);
        const { disciplinaId, professorId, ano, semestre } = validatedData;

        // Verificar se o usuário é admin ou o professor sendo vinculado
        if (ctx.state.user.role !== 'admin') {
          const professorUser = await db.query.professorTable.findFirst({
            where: eq(professorTable.id, professorId),
          });

          if (
            !professorUser ||
            professorUser.userId !== parseInt(ctx.state.user.userId)
          ) {
            return json(
              { error: 'Você não tem permissão para vincular este professor' },
              { status: 403 },
            );
          }
        }

        // Verificar se já existe um vínculo para essa disciplina/ano/semestre
        const existingVinculo =
          await db.query.disciplinaProfessorResponsavelTable.findFirst({
            where: and(
              eq(
                disciplinaProfessorResponsavelTable.disciplinaId,
                disciplinaId,
              ),
              eq(disciplinaProfessorResponsavelTable.ano, ano),
              eq(disciplinaProfessorResponsavelTable.semestre, semestre),
            ),
          });

        if (existingVinculo) {
          // Atualizar o vínculo existente
          const [updatedVinculo] = await db
            .update(disciplinaProfessorResponsavelTable)
            .set({
              professorId,
              updatedAt: new Date(),
            })
            .where(
              eq(disciplinaProfessorResponsavelTable.id, existingVinculo.id),
            )
            .returning();

          log.info(
            { vinculoId: updatedVinculo.id },
            'Vínculo professor-disciplina atualizado',
          );

          return json(updatedVinculo, { status: 200 });
        }

        // Criar novo vínculo
        const [newVinculo] = await db
          .insert(disciplinaProfessorResponsavelTable)
          .values({
            disciplinaId,
            professorId,
            ano,
            semestre,
          })
          .returning();

        log.info(
          { vinculoId: newVinculo.id },
          'Vínculo professor-disciplina criado',
        );

        return json(newVinculo, { status: 201 });
      } catch (error) {
        if (error instanceof z.ZodError) {
          return json(
            { error: 'Dados inválidos', details: error.errors },
            { status: 400 },
          );
        }

        log.error(error, 'Erro ao vincular professor à disciplina');
        return json(
          { error: 'Erro ao vincular professor à disciplina' },
          { status: 500 },
        );
      }
    }),
  ),

  DELETE: createAPIHandler(
    withRoleMiddleware(['admin'], async (ctx) => {
      try {
        const body = await ctx.request.json();
        const { disciplinaId, ano, semestre } = disciplinaProfessorVinculoSchema
          .partial()
          .parse(body);

        if (!disciplinaId || !ano || !semestre) {
          return json(
            {
              error: 'Parâmetros disciplinaId, ano e semestre são obrigatórios',
            },
            { status: 400 },
          );
        }

        const result = await db
          .delete(disciplinaProfessorResponsavelTable)
          .where(
            and(
              eq(
                disciplinaProfessorResponsavelTable.disciplinaId,
                disciplinaId,
              ),
              eq(disciplinaProfessorResponsavelTable.ano, ano),
              eq(disciplinaProfessorResponsavelTable.semestre, semestre),
            ),
          )
          .returning();

        if (!result.length) {
          return json({ error: 'Vínculo não encontrado' }, { status: 404 });
        }

        log.info(
          { disciplinaId, ano, semestre },
          'Vínculo professor-disciplina removido',
        );

        return json({ success: true }, { status: 200 });
      } catch (error) {
        if (error instanceof z.ZodError) {
          return json(
            { error: 'Dados inválidos', details: error.errors },
            { status: 400 },
          );
        }

        log.error(error, 'Erro ao remover vínculo professor-disciplina');
        return json(
          { error: 'Erro ao remover vínculo professor-disciplina' },
          { status: 500 },
        );
      }
    }),
  ),
});
