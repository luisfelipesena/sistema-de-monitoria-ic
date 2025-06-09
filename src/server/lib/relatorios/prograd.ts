import { db } from '@/server/database';
import * as schema from '@/server/database/schema';
import { and, eq, inArray, isNull, or } from 'drizzle-orm';
import * as XLSX from 'xlsx';
import { env } from '@/utils/env';

class ProgradReportService {
  private async getPedidosMonitoriaData(ano: number, semestre: (typeof schema.semestreEnum.enumValues)[number], departamentoId?: number) {
    let where = and(
      eq(schema.projetoTable.ano, ano),
      eq(schema.projetoTable.semestre, semestre),
      or(
        eq(schema.projetoTable.status, 'SUBMITTED'),
        eq(schema.projetoTable.status, 'PENDING_ADMIN_SIGNATURE'),
        eq(schema.projetoTable.status, 'PENDING_PROFESSOR_SIGNATURE')
      ),
      isNull(schema.projetoTable.deletedAt)
    );

    if (departamentoId) {
      where = and(where, eq(schema.projetoTable.departamentoId, departamentoId));
    }

    const projetos = await db.query.projetoTable.findMany({
      where,
      with: {
        professorResponsavel: true,
        departamento: true,
        disciplinas: { with: { disciplina: true } },
        professoresParticipantes: { with: { professor: true } },
        documentos: {
          where: eq(schema.projetoDocumentoTable.tipoDocumento, 'PROPOSTA_ASSINADA_PROFESSOR'),
          orderBy: (doc, { desc }) => [desc(doc.createdAt)],
          limit: 1,
        },
      },
      orderBy: (table, { asc }) => [asc(table.departamentoId), asc(table.titulo)]
    });

    if (projetos.length === 0) {
      throw new Error('Nenhum projeto encontrado para os filtros aplicados.');
    }

    const clientUrl = env.CLIENT_URL || 'http://localhost:3000';
    return projetos.map(projeto => {
      const docAssinadoProfessor = projeto.documentos?.[0];
      const linkDocAssinado = docAssinadoProfessor
        ? `${clientUrl}/api/public/documents/${docAssinadoProfessor.fileId}`
        : 'Documento assinado pelo professor não encontrado';
      
      return {
        'Departamento': projeto.departamento.nome,
        'Código Disciplina(s)': projeto.disciplinas.map(pd => pd.disciplina.codigo).join('; '),
        'Nome Disciplina(s)': projeto.disciplinas.map(pd => `${pd.disciplina.codigo} - ${pd.disciplina.nome}`).join('; '),
        'Professor Responsável': projeto.professorResponsavel.nomeCompleto,
        'Tipo Proposição': projeto.tipoProposicao,
        'Outros Professores (Coletiva)': projeto.professoresParticipantes.map(pp => pp.professor.nomeCompleto).join('; '),
        'Bolsas Solicitadas': projeto.bolsasSolicitadas,
        'Voluntários Solicitados': projeto.voluntariosSolicitados,
        'Link Projeto Assinado': linkDocAssinado,
        'Status Atual': projeto.status,
      };
    });
  }
  
  public async generatePedidosMonitoriaReport(ano: number, semestre: (typeof schema.semestreEnum.enumValues)[number], departamentoId?: number): Promise<Buffer> {
    const data = await this.getPedidosMonitoriaData(ano, semestre, departamentoId);
    const workbook = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(workbook, ws, 'Pedidos de Monitoria');
    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  }
}

export const progradReportService = new ProgradReportService(); 