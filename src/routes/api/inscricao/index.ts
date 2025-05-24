import { inscricaoComDetalhesSchema } from '@/routes/api/inscricao/-types';
import { db } from '@/server/database';
import {
  alunoTable,
  disciplinaTable,
  inscricaoTable,
  professorTable,
  projetoDisciplinaTable,
  projetoTable,
} from '@/server/database/schema';
import {
  createAPIHandler,
  withAuthMiddleware,
} from '@/server/middleware/common';
import { logger } from '@/utils/logger';
import { json } from '@tanstack/react-start';
import { createAPIFileRoute } from '@tanstack/react-start/api';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const log = logger.child({
  context: 'InscricaoAPI',
});

export const APIRoute = createAPIFileRoute('/api/inscricao')({
  GET: createAPIHandler(
    withAuthMiddleware(async (ctx) => {
      try {
        const userId = parseInt(ctx.state.user.userId, 10);

        // Primeiro buscar o aluno
        const aluno = await db.query.alunoTable.findFirst({
          where: eq(alunoTable.userId, userId),
        });

        if (!aluno) {
          return json([], { status: 200 });
        }

        // Buscar inscrições com dados relacionados
        const inscricoes = await db
          .select({
            id: inscricaoTable.id,
            periodoInscricaoId: inscricaoTable.periodoInscricaoId,
            projetoId: inscricaoTable.projetoId,
            alunoId: inscricaoTable.alunoId,
            tipoVagaPretendida: inscricaoTable.tipoVagaPretendida,
            status: inscricaoTable.status,
            feedbackProfessor: inscricaoTable.feedbackProfessor,
            createdAt: inscricaoTable.createdAt,
            updatedAt: inscricaoTable.updatedAt,
            // Dados do projeto
            projetoTitulo: projetoTable.titulo,
            projetoDepartamentoId: projetoTable.departamentoId,
            projetoAno: projetoTable.ano,
            projetoSemestre: projetoTable.semestre,
            projetoStatus: projetoTable.status,
            // Dados do professor responsável
            professorId: professorTable.id,
            professorNome: professorTable.nomeCompleto,
            professorEmail: professorTable.emailInstitucional,
            // Dados do aluno
            alunoNome: alunoTable.nomeCompleto,
            alunoEmail: alunoTable.emailInstitucional,
            alunoMatricula: alunoTable.matricula,
            alunoCr: alunoTable.cr,
          })
          .from(inscricaoTable)
          .innerJoin(
            projetoTable,
            eq(inscricaoTable.projetoId, projetoTable.id),
          )
          .innerJoin(
            professorTable,
            eq(projetoTable.professorResponsavelId, professorTable.id),
          )
          .innerJoin(alunoTable, eq(inscricaoTable.alunoId, alunoTable.id))
          .where(eq(inscricaoTable.alunoId, aluno.id))
          .orderBy(inscricaoTable.createdAt);

        // Buscar disciplinas para cada projeto
        const inscricoesComDisciplinas = await Promise.all(
          inscricoes.map(async (inscricao) => {
            const disciplinas = await db
              .select({
                id: disciplinaTable.id,
                nome: disciplinaTable.nome,
                codigo: disciplinaTable.codigo,
              })
              .from(disciplinaTable)
              .innerJoin(
                projetoDisciplinaTable,
                eq(disciplinaTable.id, projetoDisciplinaTable.disciplinaId),
              )
              .where(eq(projetoDisciplinaTable.projetoId, inscricao.projetoId));

            return {
              id: inscricao.id,
              periodoInscricaoId: inscricao.periodoInscricaoId,
              projetoId: inscricao.projetoId,
              alunoId: inscricao.alunoId,
              tipoVagaPretendida: inscricao.tipoVagaPretendida,
              status: inscricao.status,
              feedbackProfessor: inscricao.feedbackProfessor,
              createdAt: inscricao.createdAt,
              updatedAt: inscricao.updatedAt,
              projeto: {
                id: inscricao.projetoId,
                titulo: inscricao.projetoTitulo,
                departamentoId: inscricao.projetoDepartamentoId,
                ano: inscricao.projetoAno,
                semestre: inscricao.projetoSemestre,
                status: inscricao.projetoStatus,
                professorResponsavel: {
                  id: inscricao.professorId,
                  nomeCompleto: inscricao.professorNome,
                  emailInstitucional: inscricao.professorEmail,
                },
              },
              aluno: {
                id: inscricao.alunoId,
                nomeCompleto: inscricao.alunoNome,
                emailInstitucional: inscricao.alunoEmail,
                matricula: inscricao.alunoMatricula,
                cr: inscricao.alunoCr,
              },
              disciplinas,
            };
          }),
        );

        const validatedInscricoes = z
          .array(inscricaoComDetalhesSchema)
          .parse(inscricoesComDisciplinas);

        log.info(
          { count: validatedInscricoes.length, alunoId: aluno.id },
          'Inscrições recuperadas com sucesso',
        );

        return json(validatedInscricoes, { status: 200 });
      } catch (error) {
        log.error(error, 'Erro ao buscar inscrições');
        return json({ error: 'Erro ao buscar inscrições' }, { status: 500 });
      }
    }),
  ),
});
