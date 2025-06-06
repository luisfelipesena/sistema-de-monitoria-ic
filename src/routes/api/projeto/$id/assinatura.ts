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
import { z } from 'zod';

const log = logger.child({
  context: 'AssinaturaProjetoAPI',
});

const assinaturaInputSchema = z.object({
  signatureImage: z.string(), // base64 data URL
});

export const APIRoute = createAPIFileRoute('/api/projeto/$id/assinatura')({
  POST: createAPIHandler(
    withRoleMiddleware(['professor'], async (ctx) => {
      const { id } = ctx.params;
      const projectId = parseInt(id, 10);

      try {
        const body = await ctx.request.json();
        const { signatureImage } = assinaturaInputSchema.parse(body);
        
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

        // TODO: Move signature to its own 'assinatura_documento' table as per analise_e_planejamento_futuro.md
        const [updatedProject] = await db
          .update(projetoTable)
          .set({ 
            assinaturaProfessor: signatureImage,
            updatedAt: new Date() 
          })
          .where(eq(projetoTable.id, projectId))
          .returning();

        log.info({ projectId }, 'Assinatura do projeto salva com sucesso');
        return json(updatedProject);
      } catch (error) {
        log.error(error, `Erro ao salvar assinatura do projeto ${projectId}`);
        return json({ error: 'Erro ao salvar assinatura' }, { status: 500 });
      }
    }),
  ),
}); 