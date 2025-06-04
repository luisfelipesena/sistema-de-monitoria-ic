import { db } from '@/server/database';
import {
  projetoTable,
  assinaturaDocumentoTable,
  tipoAssinaturaEnum,
} from '@/server/database/schema';
import {
  generateProjetoMonitoriaPDF,
  ProjetoMonitoriaData,
} from '@/server/lib/email-templates/pdf/projeto-monitoria-pdf';
import {
  createAPIHandler,
  withAuthMiddleware,
} from '@/server/middleware/common';
import { logger } from '@/utils/logger';
import { json } from '@tanstack/react-start';
import { createAPIFileRoute } from '@tanstack/react-start/api';
import { and, eq } from 'drizzle-orm';
import puppeteer from 'puppeteer';

const log = logger.child({
  context: 'ProjetoPDFAPI',
});

export const APIRoute = createAPIFileRoute('/api/projeto/$id/pdf')({
  GET: createAPIHandler(
    withAuthMiddleware(async (ctx) => {
      try {
        const projetoId = parseInt(ctx.params.id, 10);
        const userNumericId = ctx.state.user?.userId ? parseInt(ctx.state.user.userId, 10) : undefined;

        if (isNaN(projetoId)) {
          return json({ error: 'ID do projeto inválido' }, { status: 400 });
        }
        if (!userNumericId || isNaN(userNumericId)) {
          return json({ error: 'Usuário inválido'}, { status: 401 });
        }

        const projeto = await db.query.projetoTable.findFirst({
          where: eq(projetoTable.id, projetoId),
          with: {
            professorResponsavel: true,
            departamento: true,
            disciplinas: { with: { disciplina: true } },
            atividades: true,
          },
        });

        if (!projeto) {
          return json({ error: 'Projeto não encontrado' }, { status: 404 });
        }

        if (ctx.state.user.role === 'professor') {
          if (projeto.professorResponsavelId !== userNumericId) {
            return json(
              { error: 'Acesso não autorizado a este projeto' },
              { status: 403 },
            );
          }
        } else if (ctx.state.user.role !== 'admin') {
          return json({ error: 'Acesso não autorizado' }, { status: 403 });
        }

        let assinaturaProfessorBase64: string | undefined = undefined;
        const signatureRecord = await db.query.assinaturaDocumentoTable.findFirst({
          where: and(
            eq(assinaturaDocumentoTable.projetoId, projetoId),
            eq(assinaturaDocumentoTable.tipoAssinatura, tipoAssinaturaEnum.enumValues[0] /* PROJETO_PROFESSOR_RESPONSAVEL */)
          ),
          orderBy: (fields, operators) => [operators.desc(fields.createdAt)],
        });

        if (signatureRecord) {
          assinaturaProfessorBase64 = signatureRecord.assinaturaData;
        }

        const professor = projeto.professorResponsavel;
        const departamento = projeto.departamento;
        const disciplinasRel = projeto.disciplinas;
        const atividadesRel = projeto.atividades;

        if (!professor || !departamento ) {
             log.error('Dados relacionados ao projeto (professor/departamento) não encontrados após eager loading.', { projetoId });
             return json({ error: 'Dados essenciais do projeto ausentes.' }, { status: 500});
        }

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
          estimativaPessoasBeneficiadas: projeto.estimativaPessoasBenificiadas || undefined,
          professor: {
            nomeCompleto: professor.nomeCompleto,
            nomeSocial: professor.nomeSocial || undefined,
            genero: professor.genero as string,
            cpf: professor.cpf,
            siape: professor.matriculaSiape || '',
            regime: professor.regime as string,
            telefoneInstitucional: professor.telefoneInstitucional || undefined,
            celular: professor.telefone || undefined,
            emailInstitucional: professor.emailInstitucional,
          },
          departamento: {
            nome: departamento.nome,
            unidadeUniversitaria: departamento.unidadeUniversitaria || undefined,
          },
          disciplinas: disciplinasRel.map((pd) => ({
            codigo: pd.disciplina.codigo,
            nome: pd.disciplina.nome,
          })),
          atividades: atividadesRel.map(a => ({
            id: a.id,
            descricao: a.descricao
          })),
          dataAprovacao: projeto.status === 'APPROVED' ? new Date().toLocaleDateString('pt-BR') : undefined,
          assinaturaProfessorBase64,
        };

        const htmlContent = generateProjetoMonitoriaPDF(pdfData);

        const browser = await puppeteer.launch({ 
            headless: true, 
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();
        await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
        const pdfBuffer = await page.pdf({
          format: 'A4',
          printBackground: true,
          margin: { top: '20mm', right: '20mm', bottom: '20mm', left: '20mm' },
        });
        await browser.close();

        return new Response(pdfBuffer as any, {
          status: 200,
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `inline; filename="projeto-monitoria-${projetoId}.pdf"`,
          },
        });
      } catch (error) {
        log.error(error, 'Erro ao gerar PDF do projeto');
        return json({ error: 'Erro ao gerar PDF do projeto' }, { status: 500 });
      }
    }),
  ),
});
