import { db } from '@/server/database';
import { editalTable, projetoTable, periodoInscricaoTable } from '@/server/database/schema';
import { EditalTemplate } from '@/server/lib/pdfTemplates/edital';
import { createAPIHandler, withRoleMiddleware } from '@/server/middleware/common';
import { logger } from '@/utils/logger';
import { json } from '@tanstack/react-start';
import { createAPIFileRoute } from '@tanstack/react-start/api';
import { renderToBuffer } from '@react-pdf/renderer';
import { eq, and } from 'drizzle-orm';
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
        const { user } = ctx.state;

        const periodoInscricao = await db.query.periodoInscricaoTable.findFirst({
          where: eq(periodoInscricaoTable.id, periodoInscricaoId),
        });

        if (!periodoInscricao) {
          return json({ error: 'Período de inscrição não encontrado' }, { status: 404 });
        }

        const existingEdital = await db.query.editalTable.findFirst({
          where: eq(editalTable.periodoInscricaoId, periodoInscricaoId),
        });

        if (existingEdital) {
          return json({ error: 'Já existe um edital para este período de inscrição' }, { status: 400 });
        }

        const projetosAprovados = await db.query.projetoTable.findMany({
          where: and(
            eq(projetoTable.ano, periodoInscricao.ano),
            eq(projetoTable.semestre, periodoInscricao.semestre),
            eq(projetoTable.status, 'APPROVED')
          ),
          with: {
            departamento: true,
            professorResponsavel: true,
            disciplinas: {
              with: { disciplina: true }
            }
          }
        });

        if (projetosAprovados.length === 0) {
          return json({ error: 'Nenhum projeto aprovado encontrado para este período' }, { status: 400 });
        }

        const projetosData = projetosAprovados.map(projeto => ({
          titulo: projeto.titulo,
          departamento: projeto.departamento.nome,
          professorResponsavel: projeto.professorResponsavel.nomeCompleto,
          disciplinas: projeto.disciplinas.map(pd => `${pd.disciplina.codigo} - ${pd.disciplina.nome}`).join(', '),
          bolsasDisponibilizadas: projeto.bolsasDisponibilizadas || 0,
          voluntariosSolicitados: projeto.voluntariosSolicitados,
        }));

        const editalData = {
          numeroEdital,
          ano: periodoInscricao.ano,
          semestre: periodoInscricao.semestre,
          dataInicioInscricao: format(periodoInscricao.dataInicio, "dd 'de' MMMM 'de' yyyy", { locale: ptBR }),
          dataFimInscricao: format(periodoInscricao.dataFim, "dd 'de' MMMM 'de' yyyy", { locale: ptBR }),
          titulo: titulo || 'Edital Interno de Seleção de Monitores',
          descricaoHtml: descricaoHtml || 'Os casos omissos neste edital serão resolvidos pela Coordenação de Ensino de Graduação.',
          projetos: projetosData,
        };

        const pdfBuffer = await renderToBuffer(EditalTemplate({ data: editalData }));
        
        const fileName = `edital-${numeroEdital}-${periodoInscricao.ano}-${periodoInscricao.semestre}.pdf`;
        const fileId = `editais/${fileName}`;

        await minioClient.putObject(bucketName, fileId, Buffer.from(pdfBuffer), pdfBuffer.length, {
          'Content-Type': 'application/pdf',
          'original-filename': fileName,
        });

        const [newEdital] = await db
          .insert(editalTable)
          .values({
            periodoInscricaoId,
            numeroEdital,
            titulo: titulo || 'Edital Interno de Seleção de Monitores',
            descricaoHtml,
            fileIdAssinado: fileId,
            dataPublicacao: null, // Será definido quando publicar
            publicado: false, // Começa como rascunho
            criadoPorUserId: parseInt(user.userId, 10),
          })
          .returning();

        // Buscar o edital recém-criado com relações para resposta completa
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

        // Adicionar status do período para compatibilidade
        const editalComStatus = {
          ...editalCompleto!,
          periodoInscricao: editalCompleto!.periodoInscricao
            ? {
                ...editalCompleto!.periodoInscricao,
                status: 'FUTURO' as const, // Assumir futuro para novos editais
                totalProjetos: projetosAprovados.length,
                totalInscricoes: 0, // Novo edital não tem inscrições ainda
              }
            : null,
        };

        log.info({ editalId: newEdital.id, periodoInscricaoId, totalProjetos: projetosAprovados.length }, 'Edital gerado com sucesso');

        return json({
          edital: editalComStatus,
          downloadUrl: `/api/public/documents/${fileId}`,
          totalProjetos: projetosAprovados.length,
        }, { status: 201 });

      } catch (error) {
        log.error(error, 'Erro ao gerar edital');
        if (error instanceof z.ZodError) {
          return json({ error: 'Dados inválidos', details: error.format() }, { status: 400 });
        }
        return json({ error: 'Erro interno ao gerar edital' }, { status: 500 });
      }
    }),
  ),
}); 