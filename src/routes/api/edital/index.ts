import {
  editalInputSchema,
  editalListItemSchema,
} from '@/routes/api/edital/-types';
import { db } from '@/server/database';
import { editalTable, periodoInscricaoTable } from '@/server/database/schema';
import {
  createAPIHandler,
  withAuthMiddleware,
  withRoleMiddleware,
} from '@/server/middleware/common';
import { logger } from '@/utils/logger';
import { json } from '@tanstack/react-start';
import { createAPIFileRoute } from '@tanstack/react-start/api';
import { eq, sql } from 'drizzle-orm';
import { z } from 'zod';

const log = logger.child({
  context: 'EditalAPI',
});

export const APIRoute = createAPIFileRoute('/api/edital')({
  GET: createAPIHandler(
    withAuthMiddleware(async (ctx) => {
      try {
        log.info('Iniciando busca de editais');
        
        const editaisComPeriodo = await db.query.editalTable.findMany({
          with: {
            periodoInscricao: true,
            criadoPor: {
              columns: {
                id: true,
                username: true,
                email: true,
              },
            },
          },
          orderBy: (table, { desc }) => [
            desc(table.createdAt),
          ],
        });
        
        log.info({ count: editaisComPeriodo.length }, 'Editais encontrados no banco');
        
        // Calcular status para cada período de inscrição associado
        const now = new Date();
        const resultadoFinal = editaisComPeriodo.map(edital => {
          let statusPeriodo: 'ATIVO' | 'FUTURO' | 'FINALIZADO' = 'FINALIZADO';
          if (edital.periodoInscricao) {
            try {
              const inicio = new Date(edital.periodoInscricao.dataInicio);
              const fim = new Date(edital.periodoInscricao.dataFim);
              
              // Verificar se as datas são válidas
              if (!isNaN(inicio.getTime()) && !isNaN(fim.getTime())) {
                if (now >= inicio && now <= fim) {
                  statusPeriodo = 'ATIVO';
                } else if (now < inicio) {
                  statusPeriodo = 'FUTURO';
                }
              }
            } catch (error) {
              log.warn({ editalId: edital.id, error }, 'Erro ao calcular status do período');
            }
          }
          return {
            ...edital,
            periodoInscricao: edital.periodoInscricao 
              ? { 
                  ...edital.periodoInscricao, 
                  status: statusPeriodo,
                  totalProjetos: 0, // TODO: calcular quando necessário
                  totalInscricoes: 0, // TODO: calcular quando necessário
                }
              : null,
          };
        });

        log.info({ count: resultadoFinal.length }, 'Processando validação dos editais');
        
        const validatedData = z.array(editalListItemSchema).parse(resultadoFinal);
        
        log.info({ validatedCount: validatedData.length }, 'Editais validados com sucesso');
        return json(validatedData, { status: 200 });
        
      } catch (error) {
        if (error instanceof z.ZodError) {
          log.error({ zodError: error.errors }, 'Erro de validação de schema');
          return json({ 
            error: 'Erro de validação dos dados dos editais',
            details: error.errors 
          }, { status: 500 });
        }
        
        log.error(error, 'Erro ao listar editais');
        return json({ error: 'Erro interno ao listar editais' }, { status: 500 });
      }
    }),
  ),

  POST: createAPIHandler(
    withRoleMiddleware(['admin'], async (ctx) => {
      try {
        const adminUserId = parseInt(ctx.state.user.userId, 10);
        const body = await ctx.request.json();
        const validatedInput = editalInputSchema.parse(body);

        // Verificar se já existe um edital para o período de inscrição selecionado
        const editalExistente = await db.query.editalTable.findFirst({
          where: eq(editalTable.periodoInscricaoId, validatedInput.periodoInscricaoId),
        });
        if (editalExistente) {
          return json(
            { error: 'Já existe um edital cadastrado para este período de inscrição.' },
            { status: 409 }, // Conflict
          );
        }

        // Verificar se o número do edital já existe
        const numeroEditalExistente = await db.query.editalTable.findFirst({
            where: eq(editalTable.numeroEdital, validatedInput.numeroEdital),
        });
        if (numeroEditalExistente) {
            return json(
                { error: 'Este número de edital já está em uso.' },
                { status: 409 }, // Conflict
            );
        }

        const [novoEdital] = await db
          .insert(editalTable)
          .values({
            ...validatedInput,
            criadoPorUserId: adminUserId,
            publicado: false, // Edital começa como não publicado
          })
          .returning();
        
        // Buscar o edital recém-criado com os dados do período para retornar uma resposta completa
        const editalCriadoComPeriodo = await db.query.editalTable.findFirst({
            where: eq(editalTable.id, novoEdital.id),
            with: {
                periodoInscricao: true,
                criadoPor: {
                    columns: {
                        id: true,
                        username: true,
                        email: true,
                    }
                }
            }
        });

        const validatedResponse = editalListItemSchema.parse(editalCriadoComPeriodo);
        log.info({ editalId: validatedResponse.id, adminUserId }, 'Novo edital criado com sucesso');
        return json(validatedResponse, { status: 201 });

      } catch (error) {
        if (error instanceof z.ZodError) {
          return json(
            { error: 'Dados de entrada inválidos', details: error.errors },
            { status: 400 },
          );
        }
        log.error(error, 'Erro ao criar novo edital');
        return json({ error: 'Erro ao criar edital' }, { status: 500 });
      }
    }),
  ),
}); 