import { db } from '@/server/database';
import { editalTable, projetoTable, periodoInscricaoTable } from '@/server/database/schema';
import { EditalPdfData, generateEditalInternoHTML } from '@/server/lib/email-templates/pdf/edital-pdf';
import { createAPIHandler, withRoleMiddleware } from '@/server/middleware/common';
import { logger } from '@/utils/logger';
import { json } from '@tanstack/react-start';
import { createAPIFileRoute } from '@tanstack/react-start/api';
import { eq, and, isNull } from 'drizzle-orm';
import { z } from 'zod';
import minioClient, { bucketName } from '@/server/lib/minio';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const log = logger.child({
  context: 'EditalGenerateAPI',
});

const generateEditalSchema = z.object({
  periodoInscricaoId: z.number().int().positive(),
  numeroEdital: z.string().min(1),
  titulo: z.string().optional(),
  descricaoHtml: z.string().optional(),
});

export const APIRoute = createAPIFileRoute('/api/edital/generate')({
  POST: createAPIHandler(
    withRoleMiddleware(['admin'], async (ctx) => {
      try {
        const body = await ctx.request.json();
        const { periodoInscricaoId, numeroEdital, titulo, descricaoHtml } = generateEditalSchema.parse(body);
        const user = ctx.state.user;

        const periodoInscricao = await db.query.periodoInscricaoTable.findFirst({
          where: eq(periodoInscricaoTable.id, periodoInscricaoId),
        });

        if (!periodoInscricao) {
          return json({ error: 'Período de inscrição não encontrado' }, { status: 404 });
        }

        const existingEdital = await db.query.editalTable.findFirst({
          where: and(
            eq(editalTable.periodoInscricaoId, periodoInscricaoId),
            eq(editalTable.numeroEdital, numeroEdital)
          ),
        });

        if (existingEdital) {
          return json({ 
            error: `Já existe um edital com o número ${numeroEdital} para este período` 
          }, { status: 409 });
        }

        const projetosAprovados = await db.query.projetoTable.findMany({
          where: and(
            eq(projetoTable.ano, periodoInscricao.ano),
            eq(projetoTable.semestre, periodoInscricao.semestre),
            eq(projetoTable.status, 'APPROVED'),
            isNull(projetoTable.deletedAt)
          ),
          with: {
            professorResponsavel: true,
            departamento: true,
            disciplinas: { with: { disciplina: true } },
          },
        });

        const projetosComVagasFormatado: EditalPdfData['projetosComVagas'] = projetosAprovados.map(p => ({
          ...p,
          disciplinasNomes: p.disciplinas.map(pd => `${pd.disciplina.codigo} - ${pd.disciplina.nome}`).join(', '),
          vagasBolsistaDisponiveis: p.bolsasDisponibilizadas || 0,
          vagasVoluntarioDisponiveis: p.voluntariosSolicitados || 0,
        }));

        const [newEdital] = await db
          .insert(editalTable)
          .values({
            periodoInscricaoId,
            numeroEdital,
            titulo: titulo || 'Edital Interno de Seleção de Monitores',
            descricaoHtml,
            dataPublicacao: null,
            publicado: false,
            criadoPorUserId: parseInt(user.userId, 10),
          })
          .returning();

        const pdfData: EditalPdfData = {
          edital: {
            id: newEdital.id,
            numeroEdital: newEdital.numeroEdital,
            titulo: newEdital.titulo,
            descricaoHtml: newEdital.descricaoHtml,
            dataPublicacao: newEdital.dataPublicacao,
          },
          periodoInscricao,
          projetosComVagas: projetosComVagasFormatado,
          adminUser: {
            nomeCompleto: 'Coordenação de Monitoria',
            cargo: 'Comissão de Monitoria IC/UFBA',
          },
        };

        const htmlContent = generateEditalInternoHTML(pdfData);

        const fileName = `edital-${numeroEdital}-${periodoInscricao.ano}-${periodoInscricao.semestre}.html`;
        const fileId = `editais/html/${fileName}`;

        const htmlBuffer = Buffer.from(htmlContent, 'utf-8');
        await minioClient.putObject(bucketName, fileId, htmlBuffer, htmlBuffer.length, {
          'Content-Type': 'text/html; charset=utf-8',
          'original-filename': fileName,
        });

        await db
          .update(editalTable)
          .set({
            fileIdAssinado: fileId,
          })
          .where(eq(editalTable.id, newEdital.id));

        const editalCompleto = await db.query.editalTable.findFirst({
          where: eq(editalTable.id, newEdital.id),
          with: {
            periodoInscricao: true,
            criadoPor: {
              columns: {
                id: true,
                username: true,
                email: true,
              },
            },
          },
        });

        const editalComStatus = {
          ...editalCompleto!,
          periodoInscricao: editalCompleto!.periodoInscricao
            ? {
                ...editalCompleto!.periodoInscricao,
                status: 'FUTURO' as const,
                totalProjetos: projetosAprovados.length,
                totalInscricoes: 0,
              }
            : null,
        };

        log.info({ editalId: newEdital.id, periodoInscricaoId, totalProjetos: projetosAprovados.length }, 'Edital gerado com sucesso');

        return json({
          edital: editalComStatus,
          downloadUrl: `/api/edital/${newEdital.id}/generate-pdf`,
          totalProjetos: projetosAprovados.length,
        }, { status: 201 });

      } catch (error) {
        if (error instanceof z.ZodError) {
          return json({ error: 'Dados de entrada inválidos', details: error.errors }, { status: 400 });
        }
        log.error(error, 'Erro ao gerar edital');
        return json({ error: 'Erro interno do servidor' }, { status: 500 });
      }
    }),
  ),
}); 