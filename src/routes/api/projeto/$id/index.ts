import { projetoInputSchema } from '@/routes/api/projeto/-types';
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

const log = logger.child({
  context: 'ProjetoDetailAPI',
});

export const APIRoute = createAPIFileRoute('/api/projeto/$id')({
  GET: createAPIHandler(
    withAuthMiddleware(async (ctx) => {
      try {
        const projetoId = parseInt(ctx.params.id, 10);
        const userId = parseInt(ctx.state.user.userId, 10);

        if (isNaN(projetoId)) {
          return json({ error: 'ID do projeto inválido' }, { status: 400 });
        }

        const projeto = await db.query.projetoTable.findFirst({
          where: eq(projetoTable.id, projetoId),
          with: {
            professorResponsavel: true,
            departamento: true,
            disciplinas: { with: { disciplina: true } },
            professoresParticipantes: { with: { professor: true } },
            atividades: true,
          },
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
              { error: 'Acesso não autorizado a este projeto' },
              { status: 403 },
            );
          }
        } else if (ctx.state.user.role !== 'admin') {
          return json({ error: 'Acesso não autorizado' }, { status: 403 });
        }

        return json(projeto);
      } catch (error) {
        log.error(error, 'Erro ao buscar projeto');
        return json({ error: 'Erro ao buscar projeto' }, { status: 500 });
      }
    }),
  ),

  PUT: createAPIHandler(
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
              { error: 'Apenas o professor responsável pode editar o projeto' },
              { status: 403 },
            );
          }

          if (projeto.status !== 'DRAFT' && projeto.status !== 'SUBMITTED') {
            return json(
              {
                error: `Projetos com status ${projeto.status} não podem ser editados.`,
              },
              { status: 400 },
            );
          }
        }

        const body = await ctx.request.json();
        const validatedData = projetoInputSchema.parse(body);

        const {
          disciplinaIds,
          professoresParticipantes,
          atividades,
          ...directProjetoData
        } = validatedData;

        const updatedProjeto = await db.transaction(async (tx) => {
          const [updatedDirectFields] = await tx
            .update(projetoTable)
            .set({
              ...directProjetoData,
              updatedAt: new Date(),
            })
            .where(eq(projetoTable.id, projetoId))
            .returning();

          if (!updatedDirectFields) {
            throw new Error('Falha ao atualizar dados diretos do projeto.');
          }

          await tx
            .delete(projetoDisciplinaTable)
            .where(eq(projetoDisciplinaTable.projetoId, projetoId));
          if (disciplinaIds && disciplinaIds.length > 0) {
            const disciplinaValues = disciplinaIds.map(
              (disciplinaId: number) => ({
                projetoId: projetoId,
                disciplinaId,
              }),
            );
            await tx.insert(projetoDisciplinaTable).values(disciplinaValues);
          }

          await tx
            .delete(projetoProfessorParticipanteTable)
            .where(eq(projetoProfessorParticipanteTable.projetoId, projetoId));
          if (professoresParticipantes && professoresParticipantes.length > 0) {
            const participanteValues = professoresParticipantes.map(
              (professorId: number) => ({
                projetoId: projetoId,
                professorId,
              }),
            );
            await tx
              .insert(projetoProfessorParticipanteTable)
              .values(participanteValues);
          }

          await tx
            .delete(atividadeProjetoTable)
            .where(eq(atividadeProjetoTable.projetoId, projetoId));
          if (atividades && atividades.length > 0) {
            const atividadeValues = atividades.map((descricao: string) => ({
              projetoId: projetoId,
              descricao,
            }));
            await tx.insert(atividadeProjetoTable).values(atividadeValues);
          }

          return updatedDirectFields;
        });

        log.info({ projetoId }, 'Projeto atualizado com sucesso com relações.');
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
        log.error(error, 'Erro ao atualizar projeto com relações');
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
