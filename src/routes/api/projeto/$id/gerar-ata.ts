import { db } from '@/server/database';
import { inscricaoTable, projetoTable } from '@/server/database/schema';
import {
  createAPIHandler,
  withAuthMiddleware,
} from '@/server/middleware/common';
import { logger } from '@/utils/logger';
import { json } from '@tanstack/react-start';
import { createAPIFileRoute } from '@tanstack/react-start/api';
import { eq } from 'drizzle-orm';
import PDFDocument from 'pdfkit';
import { z } from 'zod';

const log = logger.child({
  context: 'GerarAtaAPI',
});

const gerarAtaParamsSchema = z.object({
  id: z.string().transform(Number),
});

export const APIRoute = createAPIFileRoute('/api/projeto/$id/gerar-ata')({
  GET: createAPIHandler(
    withAuthMiddleware(async (ctx) => {
      try {
        const { id: projetoId } = gerarAtaParamsSchema.parse(ctx.params);
        const { userId, role } = ctx.state.user;

        // Verificar se o usuário tem permissão (professor responsável ou admin)
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
        if (
          role !== 'admin' &&
          projeto.professorResponsavel.userId !== parseInt(userId)
        ) {
          return json(
            { error: 'Sem permissão para gerar ata deste projeto' },
            { status: 403 },
          );
        }

        // Buscar todas as inscrições do projeto com dados dos alunos
        const inscricoes = await db.query.inscricaoTable.findMany({
          where: eq(inscricaoTable.projetoId, projetoId),
          with: {
            aluno: {
              with: {
                curso: true,
              },
            },
          },
          orderBy: [inscricaoTable.status, inscricaoTable.createdAt],
        });

        // Validar se existem inscrições para gerar a ata
        if (inscricoes.length === 0) {
          return json(
            { error: 'Não é possível gerar ata sem candidatos inscritos no projeto' },
            { status: 400 },
          );
        }

        // Separar inscrições por status
        const selecionados = inscricoes.filter(
          (i) =>
            i.status === 'ACCEPTED_BOLSISTA' ||
            i.status === 'ACCEPTED_VOLUNTARIO' ||
            i.status === 'SELECTED_BOLSISTA' ||
            i.status === 'SELECTED_VOLUNTARIO',
        );
        const rejeitados = inscricoes.filter(
          (i) =>
            i.status === 'REJECTED_BY_PROFESSOR' ||
            i.status === 'REJECTED_BY_STUDENT',
        );
        const pendentes = inscricoes.filter((i) => i.status === 'SUBMITTED');

        // Gerar PDF da ata
        const doc = new PDFDocument({ margin: 50 });
        const chunks: Buffer[] = [];

        doc.on('data', (chunk: Buffer) => chunks.push(chunk));

        let pdfBuffer: Buffer;
        const pdfPromise = new Promise<Buffer>((resolve) => {
          doc.on('end', () => {
            pdfBuffer = Buffer.concat(chunks);
            resolve(pdfBuffer);
          });
        });

        // Cabeçalho da ata
        doc.fontSize(16).font('Helvetica-Bold');
        doc.text('UNIVERSIDADE FEDERAL DA BAHIA', { align: 'center' });
        doc.text('INSTITUTO DE COMPUTAÇÃO', { align: 'center' });
        doc.moveDown();

        doc.fontSize(14).font('Helvetica-Bold');
        doc.text('ATA DE SELEÇÃO DE MONITORES', { align: 'center' });
        doc.moveDown();

        // Informações do projeto
        doc.fontSize(12).font('Helvetica');
        doc.text(`Projeto: ${projeto.titulo}`);
        doc.text(`Departamento: ${projeto.departamento.nome}`);
        doc.text(
          `Professor Responsável: ${projeto.professorResponsavel.nomeCompleto}`,
        );
        doc.text(
          `Ano/Semestre: ${projeto.ano}.${projeto.semestre === 'SEMESTRE_1' ? '1' : '2'}`,
        );
        doc.text(`Data da Seleção: ${new Date().toLocaleDateString('pt-BR')}`);
        doc.moveDown();

        // Candidatos selecionados
        if (selecionados.length > 0) {
          doc.fontSize(12).font('Helvetica-Bold');
          doc.text('CANDIDATOS SELECIONADOS:');
          doc.font('Helvetica');

          selecionados.forEach((inscricao, index) => {
            doc.text(`${index + 1}. ${inscricao.aluno.nomeCompleto}`);
            doc.text(`   Matrícula: ${inscricao.aluno.matricula}`);
            doc.text(`   Curso: ${inscricao.aluno.curso.nome}`);
            doc.text(`   CR: ${inscricao.aluno.cr}`);
            doc.text(
              `   Tipo: ${inscricao.tipoVagaPretendida === 'BOLSISTA' ? 'Bolsista' : 'Voluntário'}`,
            );
            if (inscricao.feedbackProfessor) {
              doc.text(`   Observações: ${inscricao.feedbackProfessor}`);
            }
            doc.moveDown(0.5);
          });
        }

        // Candidatos não selecionados
        if (rejeitados.length > 0) {
          doc.moveDown();
          doc.fontSize(12).font('Helvetica-Bold');
          doc.text('CANDIDATOS NÃO SELECIONADOS:');
          doc.font('Helvetica');

          rejeitados.forEach((inscricao, index) => {
            doc.text(`${index + 1}. ${inscricao.aluno.nomeCompleto}`);
            doc.text(`   Matrícula: ${inscricao.aluno.matricula}`);
            doc.text(`   Curso: ${inscricao.aluno.curso.nome}`);
            doc.text(`   CR: ${inscricao.aluno.cr}`);
            if (inscricao.feedbackProfessor) {
              doc.text(`   Motivo: ${inscricao.feedbackProfessor}`);
            }
            doc.moveDown(0.5);
          });
        }

        // Candidatos pendentes (se houver)
        if (pendentes.length > 0) {
          doc.moveDown();
          doc.fontSize(12).font('Helvetica-Bold');
          doc.text('CANDIDATOS EM ANÁLISE:');
          doc.font('Helvetica');

          pendentes.forEach((inscricao, index) => {
            doc.text(`${index + 1}. ${inscricao.aluno.nomeCompleto}`);
            doc.text(`   Matrícula: ${inscricao.aluno.matricula}`);
            doc.text(`   Curso: ${inscricao.aluno.curso.nome}`);
            doc.text(`   CR: ${inscricao.aluno.cr}`);
            doc.moveDown(0.5);
          });
        }

        // Assinatura
        doc.moveDown();
        doc.moveDown();
        doc.text('_'.repeat(50));
        doc.text(`Prof. ${projeto.professorResponsavel.nomeCompleto}`);
        doc.text('Professor Responsável');

        doc.end();

        const pdfData = await pdfPromise;

        log.info(
          {
            projetoId,
            userId,
            totalInscricoes: inscricoes.length,
            selecionados: selecionados.length,
            rejeitados: rejeitados.length,
          },
          'Ata de seleção gerada com sucesso',
        );

        return new Response(new Uint8Array(pdfData), {
          status: 200,
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="ata-selecao-${projeto.titulo.replace(/[^a-zA-Z0-9]/g, '-')}.pdf"`,
          },
        });
      } catch (error) {
        log.error(error, 'Erro ao gerar ata de seleção');
        return json({ error: 'Erro ao gerar ata de seleção' }, { status: 500 });
      }
    }),
  ),
});
