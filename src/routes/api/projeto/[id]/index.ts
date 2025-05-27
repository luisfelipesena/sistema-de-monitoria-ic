import { projetoInputSchema } from '@/routes/api/projeto/-types';
import { db } from '@/server/database';
import {
  inscricaoTable,
  professorTable,
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

export const APIRoute = createAPIFileRoute('/api/projeto/[id]')({
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
          },
        });

        if (!projeto) {
          return json({ error: 'Projeto não encontrado' }, { status: 404 });
        }

        // Verificar permissões
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

        // Verificar permissões
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

          // Professor só pode editar projetos em DRAFT
          if (projeto.status !== 'DRAFT') {
            return json(
              { error: 'Apenas projetos em rascunho podem ser editados' },
              { status: 400 },
            );
          }
        }

        const body = await ctx.request.json();
        const validatedData = projetoInputSchema.parse(body);

        const [projetoAtualizado] = await db
          .update(projetoTable)
          .set({
            ...validatedData,
            updatedAt: new Date(),
          })
          .where(eq(projetoTable.id, projetoId))
          .returning();

        log.info({ projetoId }, 'Projeto atualizado');
        return json(projetoAtualizado);
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

        // Verificar permissões
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

          // Professor só pode deletar projetos em DRAFT
          if (projeto.status !== 'DRAFT') {
            return json(
              { error: 'Apenas projetos em rascunho podem ser deletados' },
              { status: 400 },
            );
          }
        }

        // Verificar se há inscrições associadas (apenas admin pode deletar neste caso)
        if (projeto.status !== 'DRAFT') {
          const inscricoesAssociadas = await db.query.inscricaoTable.findFirst({
            where: eq(inscricaoTable.projetoId, projetoId),
          });

          if (inscricoesAssociadas && ctx.state.user.role !== 'admin') {
            return json(
              {
                error:
                  'Não é possível deletar projeto com inscrições associadas',
              },
              { status: 400 },
            );
          }
        }

        await db.delete(projetoTable).where(eq(projetoTable.id, projetoId));

        log.info({ projetoId }, 'Projeto deletado');
        return json({ success: true, message: 'Projeto deletado com sucesso' });
      } catch (error) {
        log.error(error, 'Erro ao deletar projeto');
        return json({ error: 'Erro ao deletar projeto' }, { status: 500 });
      }
    }),
  ),
});
