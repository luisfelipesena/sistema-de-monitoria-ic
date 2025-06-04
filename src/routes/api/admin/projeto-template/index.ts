import { db } from '@/server/database';
import { projetoTemplateTable } from '@/server/database/schema';
import {
  createAPIHandler,
  withRoleMiddleware,
} from '@/server/middleware/common';
import { logger } from '@/utils/logger';
import { json } from '@tanstack/react-start';
import { createAPIFileRoute } from '@tanstack/react-start/api';
import { eq, desc } from 'drizzle-orm';
import { z } from 'zod';
import { insertProjetoTemplateSchema, ProjetoTemplateWithRelations } from './-types';

const log = logger.child({ context: 'ProjetoTemplateAPI' });

export const APIRoute = createAPIFileRoute('/api/admin/projeto-template')({
  GET: createAPIHandler(
    withRoleMiddleware(['admin'], async () => {
      try {
        const templates = await db.query.projetoTemplateTable.findMany({
          with: {
            disciplina: true, // Eager load disciplina
            criadoPor: { columns: { username: true, email: true } },
            ultimaAtualizacaoPor: { columns: { username: true, email: true } },
          },
          orderBy: [desc(projetoTemplateTable.updatedAt), desc(projetoTemplateTable.createdAt)],
        });
        return json(templates as ProjetoTemplateWithRelations[], { status: 200 });
      } catch (error) {
        log.error(error, 'Erro ao buscar templates de projeto');
        return json({ error: 'Erro ao buscar templates de projeto' }, { status: 500 });
      }
    }),
  ),
  POST: createAPIHandler(
    withRoleMiddleware(['admin'], async (ctx) => {
      try {
        const body = await ctx.request.json();
        const parsedInput = insertProjetoTemplateSchema.parse(body);
        const adminUserId = parseInt(ctx.state.user.userId, 10);

        // Check if template for this disciplinaId already exists
        const existingTemplate = await db.query.projetoTemplateTable.findFirst({
          where: eq(projetoTemplateTable.disciplinaId, parsedInput.disciplinaId),
        });

        if (existingTemplate) {
          return json(
            { error: 'Já existe um template para esta disciplina. Edite o existente.' },
            { status: 409 }, // Conflict
          );
        }

        const [newTemplate] = await db
          .insert(projetoTemplateTable)
          .values({
            ...parsedInput,
            criadoPorUserId: adminUserId,
            ultimaAtualizacaoUserId: adminUserId,
          })
          .returning();
        
        // Fetch the newly created template with relations for the response
        const result = await db.query.projetoTemplateTable.findFirst({
          where: eq(projetoTemplateTable.id, newTemplate.id),
           with: {
            disciplina: true,
            criadoPor: { columns: { username: true, email: true } },
            ultimaAtualizacaoPor: { columns: { username: true, email: true } },
          },
        });

        log.info({ templateId: newTemplate.id, adminUserId }, 'Template de projeto criado');
        return json(result as ProjetoTemplateWithRelations, { status: 201 });
      } catch (error) {
        if (error instanceof z.ZodError) {
          log.warn({ errors: error.errors }, 'Erro de validação ao criar template de projeto');
          return json({ error: 'Dados de entrada inválidos', details: error.errors }, { status: 400 });
        }
        log.error(error, 'Erro ao criar template de projeto');
        return json({ error: 'Erro ao criar template de projeto' }, { status: 500 });
      }
    }),
  ),
}); 