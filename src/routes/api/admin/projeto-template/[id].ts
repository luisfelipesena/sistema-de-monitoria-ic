import { db } from '@/server/database';
import { projetoTemplateTable } from '@/server/database/schema';
import {
  createAPIHandler,
  withRoleMiddleware,
} from '@/server/middleware/common';
import { logger } from '@/utils/logger';
import { json } from '@tanstack/react-start';
import { createAPIFileRoute } from '@tanstack/react-start/api';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';
import { insertProjetoTemplateSchema, ProjetoTemplateWithRelations } from './-types';

const log = logger.child({ context: 'ProjetoTemplateByIdAPI' });

export const APIRoute = createAPIFileRoute('/api/admin/projeto-template/[id]')({
  GET: createAPIHandler(
    withRoleMiddleware(['admin'], async (ctx) => {
      try {
        const id = parseInt(ctx.params.id, 10);
        if (isNaN(id)) {
          return json({ error: 'ID do template inválido' }, { status: 400 });
        }

        const template = await db.query.projetoTemplateTable.findFirst({
          where: eq(projetoTemplateTable.id, id),
          with: {
            disciplina: true,
            criadoPor: { columns: { username: true, email: true } },
            ultimaAtualizacaoPor: { columns: { username: true, email: true } },
          },
        });

        if (!template) {
          return json({ error: 'Template de projeto não encontrado' }, { status: 404 });
        }
        return json(template as ProjetoTemplateWithRelations, { status: 200 });
      } catch (error) {
        log.error(error, 'Erro ao buscar template de projeto por ID');
        return json({ error: 'Erro ao buscar template de projeto' }, { status: 500 });
      }
    }),
  ),
  PUT: createAPIHandler(
    withRoleMiddleware(['admin'], async (ctx) => {
      try {
        const id = parseInt(ctx.params.id, 10);
        if (isNaN(id)) {
          return json({ error: 'ID do template inválido' }, { status: 400 });
        }

        const body = await ctx.request.json();
        // For PUT, all fields are optional for partial updates, but Zod needs explicit schema
        // We'll use .partial() here but ensure disciplinaId is not changed.
        const parsedInput = insertProjetoTemplateSchema.partial().parse(body);
        const adminUserId = parseInt(ctx.state.user.userId, 10);

        if (parsedInput.disciplinaId) {
          // Security: Prevent changing the disciplinaId of an existing template if it causes conflict
          // Or disallow changing it altogether. For now, let's assume disciplinaId cannot be changed on PUT.
          const currentTemplate = await db.query.projetoTemplateTable.findFirst({
            where: eq(projetoTemplateTable.id, id),
            columns: { disciplinaId: true }
          });
          if (currentTemplate && parsedInput.disciplinaId !== currentTemplate.disciplinaId) {
             return json({ error: 'Não é permitido alterar a disciplina de um template existente.' }, { status: 400 });
          }
        }
        
        const [updatedTemplate] = await db
          .update(projetoTemplateTable)
          .set({
            ...parsedInput,
            disciplinaId: undefined, // Explicitly prevent disciplinaId update via this spread
            ultimaAtualizacaoUserId: adminUserId,
            updatedAt: new Date(),
          })
          .where(eq(projetoTemplateTable.id, id))
          .returning();

        if (!updatedTemplate) {
          return json({ error: 'Template de projeto não encontrado para atualização' }, { status: 404 });
        }
        
        const result = await db.query.projetoTemplateTable.findFirst({
          where: eq(projetoTemplateTable.id, updatedTemplate.id),
           with: {
            disciplina: true,
            criadoPor: { columns: { username: true, email: true } },
            ultimaAtualizacaoPor: { columns: { username: true, email: true } },
          },
        });

        log.info({ templateId: updatedTemplate.id, adminUserId }, 'Template de projeto atualizado');
        return json(result as ProjetoTemplateWithRelations, { status: 200 });
      } catch (error) {
        if (error instanceof z.ZodError) {
          log.warn({ errors: error.errors }, 'Erro de validação ao atualizar template de projeto');
          return json({ error: 'Dados de entrada inválidos', details: error.errors }, { status: 400 });
        }
        log.error(error, 'Erro ao atualizar template de projeto');
        return json({ error: 'Erro ao atualizar template de projeto' }, { status: 500 });
      }
    }),
  ),
  DELETE: createAPIHandler(
    withRoleMiddleware(['admin'], async (ctx) => {
      try {
        const id = parseInt(ctx.params.id, 10);
        if (isNaN(id)) {
          return json({ error: 'ID do template inválido' }, { status: 400 });
        }
        const adminUserId = parseInt(ctx.state.user.userId, 10);

        const [deletedTemplate] = await db
          .delete(projetoTemplateTable)
          .where(eq(projetoTemplateTable.id, id))
          .returning();

        if (!deletedTemplate) {
          return json({ error: 'Template de projeto não encontrado para exclusão' }, { status: 404 });
        }

        log.info({ templateId: id, adminUserId }, 'Template de projeto excluído');
        return json({ message: 'Template de projeto excluído com sucesso' }, { status: 200 });
      } catch (error) {
        log.error(error, 'Erro ao excluir template de projeto');
        return json({ error: 'Erro ao excluir template de projeto' }, { status: 500 });
      }
    }),
  ),
}); 