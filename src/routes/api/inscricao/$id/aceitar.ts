import { db } from '@/server/database';
import {
  alunoTable,
  inscricaoTable,
  projetoTable,
  vagaTable,
} from '@/server/database/schema';
import {
  createAPIHandler,
  withAuthMiddleware,
} from '@/server/middleware/common';
import { logger } from '@/utils/logger';
import { json } from '@tanstack/react-start';
import { createAPIFileRoute } from '@tanstack/react-start/api';
import { and, eq } from 'drizzle-orm';

const log = logger.child({
  context: 'InscricaoAceitarAPI',
});

export const APIRoute = createAPIFileRoute('/api/inscricao/$id/aceitar')({
  POST: createAPIHandler(
    withAuthMiddleware(async (ctx) => {
      try {
        const inscricaoId = parseInt(ctx.params.id, 10);
        const userId = parseInt(ctx.state.user.userId, 10);

        if (isNaN(inscricaoId)) {
          return json({ error: 'ID da inscrição inválido' }, { status: 400 });
        }

        // Buscar o aluno
        const aluno = await db.query.alunoTable.findFirst({
          where: eq(alunoTable.userId, userId),
        });

        if (!aluno) {
          return json(
            { error: 'Perfil de aluno não encontrado' },
            { status: 404 },
          );
        }

        // Buscar a inscrição
        const inscricao = await db.query.inscricaoTable.findFirst({
          where: and(
            eq(inscricaoTable.id, inscricaoId),
            eq(inscricaoTable.alunoId, aluno.id),
          ),
        });

        if (!inscricao) {
          return json({ error: 'Inscrição não encontrada' }, { status: 404 });
        }

        // Verificar se a inscrição está no status correto para aceitar
        if (
          inscricao.status !== 'SELECTED_BOLSISTA' &&
          inscricao.status !== 'SELECTED_VOLUNTARIO'
        ) {
          return json(
            { error: 'Esta inscrição não pode ser aceita no momento' },
            { status: 400 },
          );
        }

        // Se for bolsista, verificar se já tem bolsa ativa
        if (inscricao.status === 'SELECTED_BOLSISTA') {
          const bolsaAtiva = await db.query.vagaTable.findFirst({
            where: and(
              eq(vagaTable.alunoId, aluno.id),
              eq(vagaTable.tipo, 'BOLSISTA'),
            ),
          });

          if (bolsaAtiva) {
            return json(
              {
                error:
                  'Você já possui uma bolsa de monitoria ativa. Só é permitida uma bolsa por vez.',
              },
              { status: 400 },
            );
          }
        }

        // Buscar dados do projeto
        const projeto = await db.query.projetoTable.findFirst({
          where: eq(projetoTable.id, inscricao.projetoId),
        });

        if (!projeto) {
          return json({ error: 'Projeto não encontrado' }, { status: 404 });
        }

        // Definir novo status e tipo de vaga
        const novoStatus =
          inscricao.status === 'SELECTED_BOLSISTA'
            ? 'ACCEPTED_BOLSISTA'
            : 'ACCEPTED_VOLUNTARIO';
        const tipoVaga =
          inscricao.status === 'SELECTED_BOLSISTA' ? 'BOLSISTA' : 'VOLUNTARIO';

        // Atualizar status da inscrição
        const [inscricaoAtualizada] = await db
          .update(inscricaoTable)
          .set({
            status: novoStatus,
            updatedAt: new Date(),
          })
          .where(eq(inscricaoTable.id, inscricaoId))
          .returning();

        // Criar registro na tabela de vagas
        const [novaVaga] = await db
          .insert(vagaTable)
          .values({
            alunoId: aluno.id,
            projetoId: inscricao.projetoId,
            inscricaoId: inscricao.id,
            tipo: tipoVaga,
            dataInicio: new Date(),
          })
          .returning();

        log.info(
          { inscricaoId, vagaId: novaVaga.id, tipo: tipoVaga },
          'Inscrição aceita e vaga criada',
        );

        return json(
          {
            success: true,
            message: 'Monitoria aceita com sucesso!',
            inscricao: inscricaoAtualizada,
            vaga: novaVaga,
          },
          { status: 200 },
        );
      } catch (error) {
        log.error(error, 'Erro ao aceitar inscrição');
        return json({ error: 'Erro ao aceitar inscrição' }, { status: 500 });
      }
    }),
  ),
});
