import { db } from '@/server/database';
import { professorTable, projetoTable } from '@/server/database/schema';
import {
  createAPIHandler,
  withAuthMiddleware,
  withRoleMiddleware,
} from '@/server/middleware/common';
import { logger } from '@/utils/logger';
import { json } from '@tanstack/react-start';
import { createAPIFileRoute } from '@tanstack/react-start/api';
import { and, eq } from 'drizzle-orm';

const log = logger.child({
  context: 'SubmitProjetoAPI',
});

export const APIRoute = createAPIFileRoute('/api/projeto/$id/submit')({
  POST: createAPIHandler(
    withRoleMiddleware(['professor'], async (ctx) => {
      const { id } = ctx.params;
      const projectId = parseInt(id, 10);

      try {
        const professor = await db.query.professorTable.findFirst({
          where: eq(
            professorTable.userId,
            parseInt(ctx.state.user.userId, 10),
          ),
        });

        if (!professor) {
          return json({ error: 'Perfil de professor não encontrado' }, { status: 404 });
        }

        const project = await db.query.projetoTable.findFirst({
          where: and(
            eq(projetoTable.id, projectId),
            eq(projetoTable.professorResponsavelId, professor.id),
          ),
        });

        if (!project) {
          return json(
            { error: 'Projeto não encontrado ou você não é o responsável' },
            { status: 404 },
          );
        }

        if (project.status !== 'DRAFT') {
          return json(
            { error: 'Este projeto não pode ser submetido pois não é um rascunho.' },
            { status: 400 },
          );
        }

        const [updatedProject] = await db
          .update(projetoTable)
          .set({ status: 'SUBMITTED', updatedAt: new Date() })
          .where(eq(projetoTable.id, projectId))
          .returning();

        log.info({ projectId }, 'Projeto submetido com sucesso');
        return json(updatedProject);
      } catch (error) {
        log.error(error, `Erro ao submeter projeto ${projectId}`);
        return json({ error: 'Erro ao submeter projeto' }, { status: 500 });
      }
    }),
  ),
});
