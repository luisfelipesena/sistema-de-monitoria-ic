import {
  editalInputSchema,
  editalResponseSchema,
  editalListItemSchema
} from '@/routes/api/edital/-types';
import { db } from '@/server/database';
import { editalTable } from '@/server/database/schema';
import {
  createAPIHandler,
  withAuthMiddleware,
  withRoleMiddleware,
} from '@/server/middleware/common';
import { logger } from '@/utils/logger';
import { json } from '@tanstack/react-start';
import { createAPIFileRoute } from '@tanstack/react-start/api';
import { eq, and, not } from 'drizzle-orm';
import { z } from 'zod';

const log = logger.child({
  context: 'EditalDetailAPI',
});

const paramsSchema = z.object({
  id: z.string().transform(Number),
});

export const APIRoute = createAPIFileRoute('/api/edital/[id]')({
  GET: createAPIHandler(
    withAuthMiddleware(async (ctx) => {
      try {
        const { id: editalId } = paramsSchema.parse(ctx.params);

        const edital = await db.query.editalTable.findFirst({
          where: eq(editalTable.id, editalId),
          with: {
            periodoInscricao: true,
            criadoPor: { columns: { id: true, username: true, email: true } },
          },
        });

        if (!edital) {
          return json({ error: 'Edital não encontrado' }, { status: 404 });
        }
        
        // Calcular status do período de inscrição associado
        let statusPeriodo: 'ATIVO' | 'FUTURO' | 'FINALIZADO' = 'FINALIZADO';
        if (edital.periodoInscricao) {
            const now = new Date();
            const inicio = new Date(edital.periodoInscricao.dataInicio);
            const fim = new Date(edital.periodoInscricao.dataFim);
            if (now >= inicio && now <= fim) {
                statusPeriodo = 'ATIVO';
            } else if (now < inicio) {
                statusPeriodo = 'FUTURO';
            }
        }
        const editalComStatusPeriodo = {
            ...edital,
            periodoInscricao: edital.periodoInscricao 
                ? { ...edital.periodoInscricao, status: statusPeriodo }
                : undefined,
        };

        const validatedData = editalListItemSchema.parse(editalComStatusPeriodo);
        return json(validatedData, { status: 200 });

      } catch (error) {
        if (error instanceof z.ZodError && error.message.includes('params')) {
          return json({ error: 'ID do edital inválido' }, { status: 400 });
        }
        log.error(error, 'Erro ao buscar detalhes do edital');
        return json({ error: 'Erro ao buscar edital' }, { status: 500 });
      }
    }),
  ),

  PUT: createAPIHandler(
    withRoleMiddleware(['admin'], async (ctx) => {
      try {
        const { id: editalId } = paramsSchema.parse(ctx.params);
        const adminUserId = parseInt(ctx.state.user.userId, 10);

        const editalExistente = await db.query.editalTable.findFirst({
          where: eq(editalTable.id, editalId),
        });

        if (!editalExistente) {
          return json({ error: 'Edital não encontrado para atualização' }, { status: 404 });
        }

        // Um edital publicado não pode ter seus dados principais alterados (número, período).
        // Apenas descrição ou título talvez. Se precisar alterar dados críticos, deve-se criar um novo.
        if (editalExistente.publicado) {
             // Permitir apenas alteração de descrição ou título se necessário.
             // Por simplicidade, vamos bloquear qualquer alteração em edital publicado por enquanto.
             // Ou criar um schema específico para update de edital publicado.
            const updatePublishedSchema = editalInputSchema.pick({ titulo: true, descricaoHtml: true });
            const body = await ctx.request.json();
            const validatedInput = updatePublishedSchema.parse(body);
            
            const [updatedEdital] = await db
                .update(editalTable)
                .set({
                    ...validatedInput,
                    updatedAt: new Date(),
                })
                .where(eq(editalTable.id, editalId))
                .returning();
            log.info({ editalId, adminUserId }, 'Edital publicado atualizado (apenas título/descrição)');
            return json(editalResponseSchema.parse(updatedEdital), { status: 200 });
        }

        // Para editais não publicados, permite alteração mais completa.
        const body = await ctx.request.json();
        const validatedInput = editalInputSchema.parse(body);

        // Verificar se o novo número do edital (se alterado) já existe para outro edital
        if (validatedInput.numeroEdital && validatedInput.numeroEdital !== editalExistente.numeroEdital) {
            const numeroEditalConflito = await db.query.editalTable.findFirst({
                where: and(
                    eq(editalTable.numeroEdital, validatedInput.numeroEdital),
                    not(eq(editalTable.id, editalId))
                )
            });
            if (numeroEditalConflito) {
                return json({ error: 'Este número de edital já está em uso por outro edital.' }, { status: 409 });
            }
        }
        // Verificar se o novo periodoInscricaoId (se alterado) já tem edital
        if (validatedInput.periodoInscricaoId && validatedInput.periodoInscricaoId !== editalExistente.periodoInscricaoId) {
            const periodoConflito = await db.query.editalTable.findFirst({
                where: and(
                    eq(editalTable.periodoInscricaoId, validatedInput.periodoInscricaoId),
                    not(eq(editalTable.id, editalId))
                )
            });
             if (periodoConflito) {
                return json({ error: 'Já existe um edital para o novo período de inscrição selecionado.' }, { status: 409 });
            }
        }

        const [updatedEdital] = await db
          .update(editalTable)
          .set({
            ...validatedInput,
            // criadoPorUserId não deve ser atualizado aqui, apenas updatedAt
            updatedAt: new Date(),
          })
          .where(eq(editalTable.id, editalId))
          .returning();

        log.info({ editalId, adminUserId }, 'Edital atualizado com sucesso');
        return json(editalResponseSchema.parse(updatedEdital), { status: 200 });

      } catch (error) {
        if (error instanceof z.ZodError) {
          return json(
            { error: 'Dados de entrada inválidos para atualização', details: error.errors },
            { status: 400 },
          );
        }
        log.error(error, 'Erro ao atualizar edital');
        return json({ error: 'Erro ao atualizar edital' }, { status: 500 });
      }
    }),
  ),

  DELETE: createAPIHandler(
    withRoleMiddleware(['admin'], async (ctx) => {
      try {
        const { id: editalId } = paramsSchema.parse(ctx.params);
        const adminUserId = parseInt(ctx.state.user.userId, 10);

        const edital = await db.query.editalTable.findFirst({
          where: eq(editalTable.id, editalId),
        });

        if (!edital) {
          return json({ error: 'Edital não encontrado para exclusão' }, { status: 404 });
        }

        // Regra: Não permitir exclusão de edital publicado.
        if (edital.publicado) {
          return json(
            { error: 'Não é possível excluir um edital que já foi publicado.' },
            { status: 400 },
          );
        }

        // Adicionar verificação de outras dependências se necessário (ex: inscrições vinculadas ao período)

        await db.delete(editalTable).where(eq(editalTable.id, editalId));

        log.info({ editalId, adminUserId }, 'Edital excluído com sucesso');
        return json({ success: true, message: 'Edital excluído com sucesso' }, { status: 200 });

      } catch (error) {
         if (error instanceof z.ZodError && error.message.includes('params')) {
          return json({ error: 'ID do edital inválido para exclusão' }, { status: 400 });
        }
        log.error(error, 'Erro ao excluir edital');
        return json({ error: 'Erro ao excluir edital' }, { status: 500 });
      }
    }),
  ),
}); 