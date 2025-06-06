import { projetoInputSchema, projetoAllocationsInputSchema } from '@/routes/api/projeto/-types';
import { db } from '@/server/database';
import {
  atividadeProjetoTable,
  professorTable,
  projetoDisciplinaTable,
  projetoProfessorParticipanteTable,
  projetoTable,
} from '@/server/database/schema';
import {
  createAPIHandler,
  withAuthMiddleware,
  withRoleMiddleware,
} from '@/server/middleware/common';
import { logger } from '@/utils/logger';
import { json } from '@tanstack/react-start';
import { createAPIFileRoute } from '@tanstack/react-start/api';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import {
  projetoDetalhesSchema,
  projetoListItemSchema,
} from '@/routes/api/projeto/-types';

const log = logger.child({
  context: 'ProjetoDetailAPI',
});

export const APIRoute = createAPIFileRoute('/api/projeto/$id')({
  GET: createAPIHandler(
    withAuthMiddleware(async (ctx) => {
      try {
        const id = parseInt(ctx.params.id);
        if (isNaN(id)) {
          return json({ error: 'ID inválido' }, { status: 400 });
        }

        const projeto = await db.query.projetoTable.findFirst({
          where: eq(projetoTable.id, id),
          with: {
            departamento: true,
            professorResponsavel: {
              with: {
                user: {
                  columns: {
                    id: true,
                  },
                },
              },
            },
            disciplinas: {
              with: {
                disciplina: true,
              },
            },
            professoresParticipantes: {
              with: {
                professor: true,
              },
            },
            atividades: true,
          },
        });

        if (!projeto) {
          return json({ error: 'Projeto não encontrado' }, { status: 404 });
        }
        
        const validatedProjeto = projetoDetalhesSchema.parse(projeto);

        return json(validatedProjeto);
      } catch (error) {
        log.error({ error }, 'Erro ao buscar projeto');
        return json({ error: 'Erro ao buscar projeto' }, { status: 500 });
      }
    }),
  ),

  PUT: createAPIHandler(
    withRoleMiddleware(['professor', 'admin'], async (ctx) => {
      try {
        const projetoId = parseInt(ctx.params.id, 10);
        const userRole = ctx.state.user.role;
        const userId = parseInt(ctx.state.user.userId, 10);

        if (isNaN(projetoId)) {
          return json({ error: 'ID do projeto inválido' }, { status: 400 });
        }

        const projeto = await db.query.projetoTable.findFirst({
          where: eq(projetoTable.id, projetoId),
        });

        if (!projeto) {
          return json({ error: 'Projeto não encontrado' }, { status: 404 });
        }

        const body = await ctx.request.json();
        let updatedFields: Partial<typeof projetoTable.$inferInsert> = {};
        let updateRelations = false;

        if (userRole === 'professor') {
          const professor = await db.query.professorTable.findFirst({
            where: eq(professorTable.userId, userId),
          });

          if (!professor || projeto.professorResponsavelId !== professor.id) {
            return json(
              { error: 'Apenas o professor responsável pode editar o projeto' },
              { status: 403 },
            );
          }

          if (projeto.status !== 'DRAFT' && projeto.status !== 'PENDING_PROFESSOR_SIGNATURE') {
            return json(
              {
                error: `Projetos com status ${projeto.status} não podem ser editados pelo professor.`,
              },
              { status: 400 },
            );
          }
          const validatedData = projetoInputSchema.parse(body);
          const {
            disciplinaIds,
            professoresParticipantes,
            atividades,
            ...directProjetoData
          } = validatedData;
          updatedFields = directProjetoData;
          updateRelations = true;

        } else if (userRole === 'admin') {
          if (projeto.status === 'SUBMITTED' || projeto.status === 'PENDING_ADMIN_SIGNATURE' || projeto.status === 'APPROVED') {
            const validatedData = projetoAllocationsInputSchema.parse(body);
            if (validatedData.bolsasDisponibilizadas !== undefined) {
              if (validatedData.bolsasDisponibilizadas > projeto.bolsasSolicitadas) {
                return json(
                  { error: 'Não é possível disponibilizar mais bolsas do que o solicitado pelo professor.' },
                  { status: 400 }
                );
              }
            }
            updatedFields = validatedData;
          } else {
            return json(
              { error: `Administradores podem editar alocações apenas em projetos SUBMITTED, PENDING_ADMIN_SIGNATURE ou APPROVED. Status atual: ${projeto.status}` },
              { status: 400 },
            );
          }
        }

        if (Object.keys(updatedFields).length === 0 && !updateRelations) {
          return json({ error: 'Nenhum dado válido para atualização fornecido' }, { status: 400 });
        }

        const finalUpdatedFields = {
          ...updatedFields,
          updatedAt: new Date(),
        };

        await db.transaction(async (tx) => {
          await tx
            .update(projetoTable)
            .set(finalUpdatedFields)
            .where(eq(projetoTable.id, projetoId));

          if (updateRelations && userRole === 'professor') {
            const validatedData = projetoInputSchema.parse(body);
            const { disciplinaIds, professoresParticipantes, atividades } = validatedData;

            await tx
              .delete(projetoDisciplinaTable)
              .where(eq(projetoDisciplinaTable.projetoId, projetoId));
            if (disciplinaIds && disciplinaIds.length > 0) {
              await tx.insert(projetoDisciplinaTable).values(
                disciplinaIds.map((disciplinaId: number) => ({
                  projetoId: projetoId,
                  disciplinaId,
                })),
              );
            }

            await tx
              .delete(projetoProfessorParticipanteTable)
              .where(eq(projetoProfessorParticipanteTable.projetoId, projetoId));
            if (professoresParticipantes && professoresParticipantes.length > 0) {
              await tx.insert(projetoProfessorParticipanteTable).values(
                professoresParticipantes.map((professorId: number) => ({
                  projetoId: projetoId,
                  professorId,
                })),
              );
            }

            await tx
              .delete(atividadeProjetoTable)
              .where(eq(atividadeProjetoTable.projetoId, projetoId));
            if (atividades && atividades.length > 0) {
              await tx.insert(atividadeProjetoTable).values(
                atividades.map((descricao: string) => ({
                  projetoId: projetoId,
                  descricao,
                })),
              );
            }
          }
        });

        log.info({ projetoId, userRole }, 'Projeto atualizado com sucesso.');
        const projetoCompleto = await db.query.projetoTable.findFirst({
          where: eq(projetoTable.id, projetoId),
          with: {
            professorResponsavel: true,
            departamento: true,
            disciplinas: { with: { disciplina: true } },
            professoresParticipantes: { with: { professor: true } },
            atividades: true,
          },
        });

        return json(projetoCompleto);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return json(
            { error: 'Dados inválidos', details: error.errors },
            { status: 400 },
          );
        }
        log.error(error, 'Erro ao atualizar projeto');
        return json({ error: 'Erro ao atualizar projeto' }, { status: 500 });
      }
    }),
  ),

  DELETE: createAPIHandler(
    withRoleMiddleware(['professor', 'admin'], async (ctx) => {
      try {
        const projetoId = parseInt(ctx.params.id, 10);
        const userId = parseInt(ctx.state.user.userId, 10);

        if (isNaN(projetoId)) {
          return json({ error: 'ID do projeto inválido' }, { status: 400 });
        }

        const projeto = await db.query.projetoTable.findFirst({
          where: eq(projetoTable.id, projetoId),
        });

        if (!projeto) {
          return json({ error: 'Projeto não encontrado' }, { status: 404 });
        }

        if (ctx.state.user.role === 'professor') {
          const professor = await db.query.professorTable.findFirst({
            where: eq(professorTable.userId, userId),
          });

          if (!professor || projeto.professorResponsavelId !== professor.id) {
            return json(
              {
                error: 'Apenas o professor responsável pode deletar o projeto',
              },
              { status: 403 },
            );
          }

          if (projeto.status !== 'DRAFT') {
            return json(
              { error: 'Apenas projetos em rascunho podem ser deletados' },
              { status: 400 },
            );
          }
        }

        await db.transaction(async (tx) => {
          await tx
            .delete(projetoDisciplinaTable)
            .where(eq(projetoDisciplinaTable.projetoId, projetoId));
          await tx
            .delete(projetoProfessorParticipanteTable)
            .where(eq(projetoProfessorParticipanteTable.projetoId, projetoId));
          await tx
            .delete(atividadeProjetoTable)
            .where(eq(atividadeProjetoTable.projetoId, projetoId));
          await tx.delete(projetoTable).where(eq(projetoTable.id, projetoId));
        });

        log.info(
          { projetoId },
          'Projeto deletado com sucesso e relações limpas.',
        );
        return json({ success: true, message: 'Projeto deletado com sucesso' });
      } catch (error) {
        log.error(error, 'Erro ao deletar projeto com relações');
        return json({ error: 'Erro ao deletar projeto' }, { status: 500 });
      }
    }),
  ),
});
