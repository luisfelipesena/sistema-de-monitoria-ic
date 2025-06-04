import { db } from '@/server/database';
import {
  departamentoTable,
  disciplinaTable,
  professorTable,
  projetoDisciplinaTable,
  projetoDocumentoTable,
  projetoTable,
  userTable,
} from '@/server/database/schema';
import {
  createAPIHandler,
  withRoleMiddleware,
} from '@/server/middleware/common';
import { logger } from '@/utils/logger';
import { json } from '@tanstack/react-start';
import { createAPIFileRoute } from '@tanstack/react-start/api';
import { and, eq, or, sql, isNull } from 'drizzle-orm';
import * as XLSX from 'xlsx';
import { z } from 'zod';
import { env } from '@/utils/env';

const log = logger.child({
  context: 'PedidosMonitoriaProgradAPI',
});

const pedidosParamsSchema = z.object({
  ano: z.string().transform(Number).optional(),
  semestre: z.enum(['SEMESTRE_1', 'SEMESTRE_2']).optional(),
  departamentoId: z.string().transform(Number).optional(),
});

export const APIRoute = createAPIFileRoute(
  '/api/relatorios/pedidos-monitoria-prograd',
)({
  GET: createAPIHandler(
    withRoleMiddleware(['admin'], async (ctx) => {
      try {
        const url = new URL(ctx.request.url);
        const queryParams = Object.fromEntries(url.searchParams);
        const params = pedidosParamsSchema.parse(queryParams);

        const currentYear = new Date().getFullYear();
        const currentMonth = new Date().getMonth(); // 0-11
        const currentSemester =
          currentMonth <= 5 ? 'SEMESTRE_1' : 'SEMESTRE_2'; // Jan-Jun: S1, Jul-Dez: S2

        const ano = params.ano || currentYear;
        const semestre = params.semestre || currentSemester;

        let projetosWhere = and(
          eq(projetoTable.ano, ano),
          eq(projetoTable.semestre, semestre),
          or( // Projetos submetidos pelo professor ou aguardando assinatura do admin
            eq(projetoTable.status, 'SUBMITTED'),
            eq(projetoTable.status, 'PENDING_ADMIN_SIGNATURE'),
            eq(projetoTable.status, 'PENDING_PROFESSOR_SIGNATURE') // Inclui projetos gerados por importação aguardando prof.
          ),
          isNull(projetoTable.deletedAt) // Corrigido para usar isNull
        );

        if (params.departamentoId) {
          projetosWhere = and(
            projetosWhere,
            eq(projetoTable.departamentoId, params.departamentoId),
          );
        }

        const projetos = await db.query.projetoTable.findMany({
          where: projetosWhere,
          with: {
            professorResponsavel: true,
            departamento: true,
            disciplinas: {
              with: {
                disciplina: true,
              },
            },
            professoresParticipantes: { // Para listar nomes em propostas coletivas
              with: {
                professor: true,
              }
            },
            documentos: { // Para buscar o link do PDF assinado pelo professor
              where: eq(projetoDocumentoTable.tipoDocumento, 'PROPOSTA_ASSINADA_PROFESSOR'),
              orderBy: (doc, { desc }) => [desc(doc.createdAt)],
              limit: 1,
            },
          },
          orderBy: (table, { asc }) => [asc(table.departamentoId), asc(table.titulo)]
        });

        const dadosPlanilha: any[] = [];
        const clientUrl = env.CLIENT_URL || 'http://localhost:3000';

        for (const projeto of projetos) {
          const disciplinasStr = projeto.disciplinas
            .map((pd) => `${pd.disciplina.codigo} - ${pd.disciplina.nome}`)
            .join('; ');
          
          let professoresParticipantesStr = '';
          if (projeto.tipoProposicao === 'COLETIVA' && projeto.professoresParticipantes.length > 0) {
            professoresParticipantesStr = projeto.professoresParticipantes
                                        .map(pp => pp.professor.nomeCompleto)
                                        .join('; ');
          }

          const docAssinadoProfessor = projeto.documentos && projeto.documentos[0];
          const linkDocAssinado = docAssinadoProfessor 
            ? `${clientUrl}/api/files/access/${docAssinadoProfessor.fileId}` // Ajustar rota se necessário
            : 'Documento não encontrado';

          dadosPlanilha.push({
            Departamento: projeto.departamento.nome,
            'Código Disciplina(s)': projeto.disciplinas.map(pd => pd.disciplina.codigo).join('; '),
            'Nome Disciplina(s)': disciplinasStr,
            'Professor Responsável': projeto.professorResponsavel.nomeCompleto,
            'Tipo Proposição': projeto.tipoProposicao,
            'Outros Professores (Coletiva)': professoresParticipantesStr,
            'Bolsas Solicitadas': projeto.bolsasSolicitadas,
            'Voluntários Solicitados': projeto.voluntariosSolicitados,
            'Link Projeto Assinado': linkDocAssinado,
            'Status Atual': projeto.status, // Para conferência
          });
        }

        if (dadosPlanilha.length === 0) {
            return json({ message: "Nenhum projeto encontrado para os filtros aplicados." }, { status: 200 });
        }

        const workbook = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(dadosPlanilha);
        XLSX.utils.book_append_sheet(workbook, ws, 'Pedidos de Monitoria');

        const excelBuffer = XLSX.write(workbook, {
          type: 'buffer',
          bookType: 'xlsx',
        });

        log.info(
          {
            ano,
            semestre,
            departamentoId: params.departamentoId,
            totalProjetos: projetos.length,
          },
          'Planilha de Pedidos de Monitoria PROGRAD gerada com sucesso',
        );

        const fileName = `pedidos-monitoria-prograd-${ano}-${semestre === 'SEMESTRE_1' ? '1' : '2'}${params.departamentoId ? `-dept${params.departamentoId}` : '-todos'}.xlsx`;

        return new Response(new Uint8Array(excelBuffer), {
          status: 200,
          headers: {
            'Content-Type':
              'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition': `attachment; filename="${fileName}"`,
          },
        });
      } catch (error) {
        if (error instanceof z.ZodError) {
            return json({ error: 'Parâmetros de requisição inválidos', details: error.errors }, { status: 400 });
        }
        log.error(error, 'Erro ao gerar planilha de Pedidos de Monitoria PROGRAD');
        return json({ error: 'Erro ao gerar planilha' }, { status: 500 });
      }
    }),
  ),
}); 