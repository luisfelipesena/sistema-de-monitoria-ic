import { db } from '@/server/database';
import { vagaTable } from '@/server/database/schema';
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
  context: 'TermoCompromissoAPI',
});

const termoParamsSchema = z.object({
  id: z.string().transform(Number),
});

export const APIRoute = createAPIFileRoute('/api/vaga/$id/termo-compromisso')({
  GET: createAPIHandler(
    withAuthMiddleware(async (ctx) => {
      try {
        const { id: vagaId } = termoParamsSchema.parse(ctx.params);
        const { userId, role } = ctx.state.user;

        // Buscar a vaga com todos os relacionamentos
        const vaga = await db.query.vagaTable.findFirst({
          where: eq(vagaTable.id, vagaId),
          with: {
            aluno: {
              with: {
                curso: true,
              },
            },
            projeto: {
              with: {
                professorResponsavel: true,
                departamento: true,
                disciplinas: {
                  with: {
                    disciplina: true,
                  },
                },
              },
            },
          },
        });

        if (!vaga) {
          return json({ error: 'Vaga não encontrada' }, { status: 404 });
        }

        // Verificar permissões - só o próprio aluno, professor responsável ou admin pode gerar
        const canAccess =
          role === 'admin' ||
          vaga.aluno.userId === parseInt(userId) ||
          vaga.projeto.professorResponsavel.userId === parseInt(userId);

        if (!canAccess) {
          return json(
            { error: 'Sem permissão para acessar este termo' },
            { status: 403 },
          );
        }

        // Gerar PDF do termo de compromisso
        const doc = new PDFDocument({ margin: 60 });
        const chunks: Buffer[] = [];

        doc.on('data', (chunk: Buffer) => chunks.push(chunk));

        const pdfPromise = new Promise<Buffer>((resolve) => {
          doc.on('end', () => {
            resolve(Buffer.concat(chunks));
          });
        });

        // Cabeçalho
        doc.fontSize(14).font('Helvetica-Bold');
        doc.text('UNIVERSIDADE FEDERAL DA BAHIA', { align: 'center' });
        doc.text('INSTITUTO DE COMPUTAÇÃO', { align: 'center' });
        doc.moveDown();

        doc.fontSize(12).font('Helvetica-Bold');
        doc.text('TERMO DE COMPROMISSO DO MONITOR', { align: 'center' });
        doc.moveDown();

        // Informações do monitor
        doc.fontSize(10).font('Helvetica');
        doc.text(`Nome: ${vaga.aluno.nomeCompleto}`);
        doc.text(`Matrícula: ${vaga.aluno.matricula}`);
        doc.text(`CPF: ${vaga.aluno.cpf}`);
        doc.text(`Email: ${vaga.aluno.emailInstitucional}`);
        doc.text(`Curso: ${vaga.aluno.curso.nome}`);
        doc.text(`CR: ${vaga.aluno.cr}`);
        doc.moveDown();

        // Informações do projeto
        doc.text(`Projeto de Monitoria: ${vaga.projeto.titulo}`);
        doc.text(`Departamento: ${vaga.projeto.departamento.nome}`);
        doc.text(
          `Professor Responsável: ${vaga.projeto.professorResponsavel.nomeCompleto}`,
        );

        const disciplinas = vaga.projeto.disciplinas
          .map((pd) => `${pd.disciplina.codigo} - ${pd.disciplina.nome}`)
          .join(', ');
        doc.text(`Disciplina(s): ${disciplinas}`);

        doc.text(
          `Tipo de Monitoria: ${vaga.tipo === 'BOLSISTA' ? 'Bolsista' : 'Voluntária'}`,
        );
        doc.text(
          `Carga Horária Semanal: ${vaga.projeto.cargaHorariaSemana} horas`,
        );
        doc.text(
          `Período: ${vaga.projeto.ano}.${vaga.projeto.semestre === 'SEMESTRE_1' ? '1' : '2'}`,
        );

        if (vaga.dataInicio && vaga.dataFim) {
          doc.text(
            `Vigência: ${vaga.dataInicio.toLocaleDateString('pt-BR')} a ${vaga.dataFim.toLocaleDateString('pt-BR')}`,
          );
        }
        doc.moveDown();

        // Texto do termo
        doc.fontSize(10).font('Helvetica');
        doc.text(
          'Por meio deste instrumento, eu, acima qualificado(a), assumo o compromisso de exercer as atividades de monitoria acadêmica nas condições estabelecidas a seguir:',
          { align: 'justify' },
        );
        doc.moveDown();

        const clausulas = [
          '1. DEVERES DO MONITOR:',
          '   a) Auxiliar o professor responsável nas atividades didáticas da disciplina;',
          '   b) Comparecer pontualmente às atividades programadas;',
          '   c) Cumprir a carga horária semanal estabelecida;',
          '   d) Apresentar relatórios de atividades quando solicitado;',
          '   e) Manter conduta ética e responsável;',
          '   f) Não ministrar aulas ou aplicar avaliações sem a supervisão do professor.',
          '',
          '2. DIREITOS DO MONITOR:',
          '   a) Receber orientação adequada do professor responsável;',
          '   b) Ter acesso aos materiais didáticos necessários;',
          '   c) Participar de atividades de capacitação quando oferecidas;',
          '   d) Receber certificado de participação ao final do período.',
        ];

        if (vaga.tipo === 'BOLSISTA') {
          clausulas.push(
            '   e) Receber auxílio financeiro conforme regulamentação vigente.',
          );
        }

        clausulas.push('');
        clausulas.push('3. PENALIDADES:');
        clausulas.push(
          'O descumprimento das obrigações estabelecidas neste termo poderá resultar no desligamento do programa de monitoria.',
        );
        clausulas.push('');
        clausulas.push('4. VIGÊNCIA:');
        clausulas.push(
          'Este termo tem vigência durante o período letivo especificado, podendo ser renovado mediante avaliação de desempenho.',
        );

        clausulas.forEach((clausula) => {
          doc.text(clausula, { align: 'justify' });
          if (clausula.startsWith('   ')) {
            doc.moveDown(0.3);
          } else {
            doc.moveDown(0.5);
          }
        });

        doc.moveDown();
        doc.text(
          'Por estar de acordo com os termos estabelecidos, firmo o presente compromisso.',
          { align: 'justify' },
        );
        doc.moveDown();

        // Data e local
        doc.text(`Salvador, ${new Date().toLocaleDateString('pt-BR')}`);
        doc.moveDown();
        doc.moveDown();

        // Assinaturas
        doc.text('_'.repeat(40), { align: 'center' });
        doc.text(vaga.aluno.nomeCompleto, { align: 'center' });
        doc.text('Monitor(a)', { align: 'center' });
        doc.moveDown();

        doc.text('_'.repeat(40), { align: 'center' });
        doc.text(vaga.projeto.professorResponsavel.nomeCompleto, {
          align: 'center',
        });
        doc.text('Professor(a) Responsável', { align: 'center' });

        doc.end();

        const pdfData = await pdfPromise;

        log.info(
          {
            vagaId,
            userId,
            alunoId: vaga.aluno.id,
            projetoId: vaga.projeto.id,
            tipo: vaga.tipo,
          },
          'Termo de compromisso gerado com sucesso',
        );

        return new Response(new Uint8Array(pdfData), {
          status: 200,
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="termo-compromisso-${vaga.aluno.matricula}-${vaga.projeto.id}.pdf"`,
          },
        });
      } catch (error) {
        log.error(error, 'Erro ao gerar termo de compromisso');
        return json(
          { error: 'Erro ao gerar termo de compromisso' },
          { status: 500 },
        );
      }
    }),
  ),
});
