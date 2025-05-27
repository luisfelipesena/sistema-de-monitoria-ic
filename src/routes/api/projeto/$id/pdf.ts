import { db } from '@/server/database';
import {
  departamentoTable,
  disciplinaTable,
  professorTable,
  projetoDisciplinaTable,
  projetoTable,
} from '@/server/database/schema';
import {
  generateProjetoMonitoriaPDF,
  ProjetoMonitoriaData,
} from '@/server/lib/pdfTemplates';
import {
  createAPIHandler,
  withAuthMiddleware,
} from '@/server/middleware/common';
import { logger } from '@/utils/logger';
import { json } from '@tanstack/react-start';
import { createAPIFileRoute } from '@tanstack/react-start/api';
import { eq } from 'drizzle-orm';

const log = logger.child({
  context: 'ProjetoPDFAPI',
});

export const APIRoute = createAPIFileRoute('/api/projeto/$id/pdf')({
  GET: createAPIHandler(
    withAuthMiddleware(async (ctx) => {
      try {
        const projetoId = parseInt(ctx.params.id, 10);
        const userId = parseInt(ctx.state.user.userId, 10);
        const url = new URL(ctx.request.url);
        const download = url.searchParams.get('download') === 'true';

        if (isNaN(projetoId)) {
          return json({ error: 'ID do projeto inválido' }, { status: 400 });
        }

        // Buscar projeto com dados relacionados
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
              { error: 'Acesso não autorizado a este projeto' },
              { status: 403 },
            );
          }
        } else if (ctx.state.user.role !== 'admin') {
          return json({ error: 'Acesso não autorizado' }, { status: 403 });
        }

        // Buscar dados do professor responsável
        const professor = await db.query.professorTable.findFirst({
          where: eq(professorTable.id, projeto.professorResponsavelId),
        });

        if (!professor) {
          return json(
            { error: 'Professor responsável não encontrado' },
            { status: 404 },
          );
        }

        // Buscar dados do departamento
        const departamento = await db.query.departamentoTable.findFirst({
          where: eq(departamentoTable.id, projeto.departamentoId),
        });

        if (!departamento) {
          return json(
            { error: 'Departamento não encontrado' },
            { status: 404 },
          );
        }

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

        // Construir dados para o PDF
        const pdfData: ProjetoMonitoriaData = {
          titulo: projeto.titulo,
          descricao: projeto.descricao,
          departamentoId: projeto.departamentoId,
          ano: projeto.ano,
          semestre: projeto.semestre,
          tipoProposicao: projeto.tipoProposicao,
          bolsasSolicitadas: projeto.bolsasSolicitadas,
          voluntariosSolicitados: projeto.voluntariosSolicitados,
          cargaHorariaSemana: projeto.cargaHorariaSemana,
          numeroSemanas: projeto.numeroSemanas,
          publicoAlvo: projeto.publicoAlvo,
          estimativaPessoasBeneficiadas:
            projeto.estimativaPessoasBenificiadas || undefined,
          disciplinaIds: disciplinas.map((d) => d.id),
          professor: {
            nomeCompleto: professor.nomeCompleto,
            nomeSocial: professor.nomeSocial || undefined,
            genero: professor.genero,
            cpf: professor.cpf,
            siape: professor.matriculaSiape || '',
            regime: professor.regime,
            telefoneInstitucional: professor.telefoneInstitucional || undefined,
            celular: professor.telefone || undefined,
            emailInstitucional: professor.emailInstitucional,
          },
          departamento: {
            nome: departamento.nome,
            unidadeUniversitaria:
              departamento.unidadeUniversitaria || undefined,
          },
          disciplinas: disciplinas.map((d) => ({
            codigo: d.codigo,
            nome: d.nome,
          })),
          dataAprovacao:
            projeto.status === 'APPROVED'
              ? new Date().toLocaleDateString('pt-BR')
              : undefined,
        };

        // Gerar HTML do PDF
        const htmlContent = generateProjetoMonitoriaPDF(pdfData);

        if (download) {
          return new Response(htmlContent, {
            status: 200,
            headers: {
              'Content-Type': 'text/html; charset=utf-8',
              'Content-Disposition': `attachment; filename="projeto-monitoria-${projetoId}.html"`,
              'X-Download-PDF': 'true',
            },
          });
        }

        return new Response(htmlContent, {
          status: 200,
          headers: {
            'Content-Type': 'text/html; charset=utf-8',
            'Content-Disposition': `inline; filename="projeto-monitoria-${projetoId}.html"`,
          },
        });
      } catch (error) {
        log.error(error, 'Erro ao gerar PDF do projeto');
        return json({ error: 'Erro ao gerar PDF do projeto' }, { status: 500 });
      }
    }),
  ),
});
