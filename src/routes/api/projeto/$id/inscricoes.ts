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
  context: 'ProjetoInscricoesAPI',
});

export const APIRoute = createAPIFileRoute('/api/projeto/$id/inscricoes')({
  GET: createAPIHandler(
    withAuthMiddleware(async (ctx) => {
      try {
        const projetoId = parseInt(ctx.params.id, 10);
        const userId = parseInt(ctx.state.user.userId, 10);

        if (isNaN(projetoId)) {
          return json({ error: 'ID do projeto inválido' }, { status: 400 });
        }

        // Verificar se o projeto existe
        const projeto = await db.query.projetoTable.findFirst({
          where: eq(projetoTable.id, projetoId),
        });

        if (!projeto) {
          return json({ error: 'Projeto não encontrado' }, { status: 404 });
        }

        // Verificar permissões
        if (ctx.state.user.role === 'professor') {
          // Professor só pode ver inscrições dos seus projetos
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

        // Buscar inscrições do projeto
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
          .where(eq(inscricaoTable.projetoId, projetoId))
          .orderBy(inscricaoTable.createdAt);

        // Buscar disciplinas do projeto
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
          .where(eq(projetoDisciplinaTable.projetoId, projetoId));

        // Formatar dados
        const inscricoesFormatadas = inscricoes.map((inscricao) => ({
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
        }));

        const validatedInscricoes = z
          .array(inscricaoComDetalhesSchema)
          .parse(inscricoesFormatadas);

        log.info(
          { count: validatedInscricoes.length, projetoId },
          'Inscrições do projeto recuperadas com sucesso',
        );

        return json(validatedInscricoes, { status: 200 });
      } catch (error) {
        log.error(error, 'Erro ao buscar inscrições do projeto');
        return json(
          { error: 'Erro ao buscar inscrições do projeto' },
          { status: 500 },
        );
      }
    }),
  ),
});
