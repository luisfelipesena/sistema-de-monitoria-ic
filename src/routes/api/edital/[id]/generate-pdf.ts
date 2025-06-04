import { db } from '@/server/database';
import {
  editalTable,
  projetoTable,
  userTable,
} from '@/server/database/schema';
import { EditalPdfData, generateEditalInternoHTML } from '@/server/lib/email-templates/pdf/edital-pdf';

import {
  createAPIHandler,
  withAuthMiddleware,
} from '@/server/middleware/common';
import { logger } from '@/utils/logger';
import { json } from '@tanstack/react-start';
import { createAPIFileRoute } from '@tanstack/react-start/api';
import { and, eq, isNull } from 'drizzle-orm';
import { z } from 'zod';

const log = logger.child({
  context: 'EditalGeneratePdfAPI',
});

const paramsSchema = z.object({
  id: z.string().transform(Number),
});

export const APIRoute = createAPIFileRoute('/api/edital/[id]/generate-pdf')({
  GET: createAPIHandler(
    withAuthMiddleware(async (ctx) => {
      try {
        const { id: editalId } = paramsSchema.parse(ctx.params);

        const edital = await db.query.editalTable.findFirst({
          where: eq(editalTable.id, editalId),
          with: {
            periodoInscricao: true,
            criadoPor: true,
          },
        });

        if (!edital || !edital.periodoInscricao) {
          return json(
            { error: 'Edital ou período de inscrição associado não encontrado' },
            { status: 404 },
          );
        }
        
        if (ctx.state.user.role !== 'admin' && !edital.publicado) {
            return json({ error: 'Este edital ainda não foi publicado.'}, { status: 403 });
        }

        const projetosDoPeriodo = await db.query.projetoTable.findMany({
          where: and(
            eq(projetoTable.ano, edital.periodoInscricao.ano),
            eq(projetoTable.semestre, edital.periodoInscricao.semestre),
            eq(projetoTable.status, 'APPROVED'),
            isNull(projetoTable.deletedAt)
          ),
          with: {
            professorResponsavel: true,
            departamento: true,
            disciplinas: { with: { disciplina: true } },
          },
        });

        const projetosComVagasFormatado: EditalPdfData['projetosComVagas'] = projetosDoPeriodo.map(p => ({
          ...p,
          disciplinasNomes: p.disciplinas.map(pd => pd.disciplina.nome).join(', '),
          vagasBolsistaDisponiveis: p.bolsasDisponibilizadas || 0,
          vagasVoluntarioDisponiveis: p.voluntariosSolicitados || 0, 
        }));
        
        const adminAssinatura = await db.query.userTable.findFirst({
            where: eq(userTable.id, edital.criadoPorUserId)
        });

        const pdfData: EditalPdfData = {
          edital: {
            id: edital.id,
            numeroEdital: edital.numeroEdital,
            titulo: edital.titulo,
            descricaoHtml: edital.descricaoHtml,
            dataPublicacao: edital.dataPublicacao,
          },
          periodoInscricao: edital.periodoInscricao,
          projetosComVagas: projetosComVagasFormatado,
          adminUser: {
            nomeCompleto: adminAssinatura?.username || edital.criadoPor?.username || 'Coordenação de Monitoria',
            cargo: 'Comissão de Monitoria IC/UFBA',
          },
        };

        const htmlContent = generateEditalInternoHTML(pdfData);

        return new Response(htmlContent, {
          status: 200,
          headers: {
            'Content-Type': 'text/html; charset=utf-8',
          },
        });

      } catch (error) {
        if (error instanceof z.ZodError && error.message.includes('params')) {
          return json({ error: 'ID do edital inválido' }, { status: 400 });
        }
        log.error(error, 'Erro ao gerar PDF do edital');
        return json({ error: 'Erro ao gerar PDF do edital' }, { status: 500 });
      }
    }),
  ),
}); 