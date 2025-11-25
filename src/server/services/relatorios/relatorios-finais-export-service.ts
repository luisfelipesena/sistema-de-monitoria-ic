import type { db } from '@/server/db'
import {
  alunoTable,
  departamentoTable,
  inscricaoTable,
  professorTable,
  projetoTable,
  relatorioFinalDisciplinaTable,
  relatorioFinalMonitorTable,
  userTable,
  vagaTable,
} from '@/server/db/schema'
import { relatoriosEmailService } from '@/server/lib/email/relatorios-emails'
import { APPROVED, SEMESTRE_LABELS, type Semestre, extractNotaFromRelatorioConteudo } from '@/types'
import { env } from '@/utils/env'
import { logger } from '@/utils/logger'
import { and, count, eq, sql } from 'drizzle-orm'
import * as XLSX from 'xlsx'

type Database = typeof db

const log = logger.child({ context: 'RelatoriosFinaisExportService' })
const clientUrl = env.CLIENT_URL || 'http://localhost:3000'

export function createRelatoriosFinaisExportService(database: Database) {
  return {
    async gerarTextoAta(ano: number, semestre: Semestre): Promise<string> {
      const semestreDisplay = SEMESTRE_LABELS[semestre]

      const relatorios = await database
        .select({
          professorNome: professorTable.nomeCompleto,
          alunoNome: alunoTable.nomeCompleto,
          alunoMatricula: alunoTable.matricula,
          projetoTitulo: projetoTable.titulo,
          disciplinaNome: projetoTable.disciplinaNome,
          tipoVaga: vagaTable.tipo,
          relatorioConteudo: relatorioFinalMonitorTable.conteudo,
        })
        .from(relatorioFinalMonitorTable)
        .innerJoin(
          relatorioFinalDisciplinaTable,
          eq(relatorioFinalMonitorTable.relatorioDisciplinaId, relatorioFinalDisciplinaTable.id)
        )
        .innerJoin(inscricaoTable, eq(relatorioFinalMonitorTable.inscricaoId, inscricaoTable.id))
        .innerJoin(alunoTable, eq(inscricaoTable.alunoId, alunoTable.id))
        .innerJoin(projetoTable, eq(inscricaoTable.projetoId, projetoTable.id))
        .innerJoin(professorTable, eq(projetoTable.professorResponsavelId, professorTable.id))
        .innerJoin(vagaTable, eq(vagaTable.inscricaoId, inscricaoTable.id))
        .where(and(eq(projetoTable.ano, ano), eq(projetoTable.semestre, semestre)))

      if (relatorios.length === 0) {
        return `Nao ha relatorios finais registrados para o periodo ${semestreDisplay}/${ano}.`
      }

      let texto = `RELATORIOS FINAIS DE MONITORIA - ${semestreDisplay}/${ano}\n\n`
      texto +=
        'O Departamento de Ciencia da Computacao submete a apreciacao do Colegiado os seguintes relatorios finais de monitoria:\n\n'

      for (const rel of relatorios) {
        const nota = extractNotaFromRelatorioConteudo(rel.relatorioConteudo)
        const tipoVaga = rel.tipoVaga === 'BOLSISTA' ? 'Bolsista' : 'Voluntario'
        texto += `- Professor(a) ${rel.professorNome} solicita aprovacao do relatorio de monitoria do(a) aluno(a) `
        texto += `${rel.alunoNome} (matricula: ${rel.alunoMatricula || 'N/A'}), ${tipoVaga}, `
        texto += `com nota ${nota}, no semestre ${semestreDisplay}/${ano}, na disciplina ${rel.disciplinaNome || rel.projetoTitulo}.\n\n`
      }

      texto += `\nTotal de relatorios: ${relatorios.length}\n`

      return texto
    },

    async gerarPlanilhasCertificados(
      ano: number,
      semestre: Semestre
    ): Promise<{ bolsistas: Buffer; voluntarios: Buffer; relatoriosDisciplina: Buffer }> {
      const monitores = await database
        .select({
          alunoNome: alunoTable.nomeCompleto,
          alunoMatricula: alunoTable.matricula,
          alunoCpf: alunoTable.cpf,
          alunoEmail: userTable.email,
          professorNome: professorTable.nomeCompleto,
          professorSiape: professorTable.matriculaSiape,
          projetoTitulo: projetoTable.titulo,
          disciplinaNome: projetoTable.disciplinaNome,
          projetoId: projetoTable.id,
          tipoVaga: vagaTable.tipo,
          cargaHoraria: sql<number>`${projetoTable.cargaHorariaSemana} * ${projetoTable.numeroSemanas}`,
          relatorioMonitorId: relatorioFinalMonitorTable.id,
          relatorioConteudo: relatorioFinalMonitorTable.conteudo,
          departamentoNome: departamentoTable.nome,
        })
        .from(relatorioFinalMonitorTable)
        .innerJoin(
          relatorioFinalDisciplinaTable,
          eq(relatorioFinalMonitorTable.relatorioDisciplinaId, relatorioFinalDisciplinaTable.id)
        )
        .innerJoin(inscricaoTable, eq(relatorioFinalMonitorTable.inscricaoId, inscricaoTable.id))
        .innerJoin(alunoTable, eq(inscricaoTable.alunoId, alunoTable.id))
        .innerJoin(userTable, eq(alunoTable.userId, userTable.id))
        .innerJoin(projetoTable, eq(inscricaoTable.projetoId, projetoTable.id))
        .innerJoin(professorTable, eq(projetoTable.professorResponsavelId, professorTable.id))
        .innerJoin(departamentoTable, eq(projetoTable.departamentoId, departamentoTable.id))
        .innerJoin(vagaTable, eq(vagaTable.inscricaoId, inscricaoTable.id))
        .where(and(eq(projetoTable.ano, ano), eq(projetoTable.semestre, semestre)))

      const bolsistas = monitores.filter((m) => m.tipoVaga === 'BOLSISTA')
      const voluntarios = monitores.filter((m) => m.tipoVaga === 'VOLUNTARIO')

      const bolsistasData = bolsistas.map((m) => ({
        'Nome do Aluno': m.alunoNome,
        Matricula: m.alunoMatricula || '',
        CPF: m.alunoCpf || '',
        Email: m.alunoEmail,
        Disciplina: m.disciplinaNome || m.projetoTitulo,
        Professor: m.professorNome,
        SIAPE: m.professorSiape || '',
        Departamento: m.departamentoNome,
        'Carga Horaria Total': m.cargaHoraria,
        Nota: extractNotaFromRelatorioConteudo(m.relatorioConteudo),
        'Link Relatorio PDF': `${clientUrl}/api/relatorio-monitor/${m.relatorioMonitorId}/pdf`,
      }))

      const wsBolsistas = XLSX.utils.json_to_sheet(bolsistasData)
      const wbBolsistas = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wbBolsistas, wsBolsistas, 'Bolsistas')
      const bolsistasBuffer = Buffer.from(XLSX.write(wbBolsistas, { type: 'buffer', bookType: 'xlsx' }))

      const voluntariosData = voluntarios.map((m) => ({
        'Nome do Aluno': m.alunoNome,
        Matricula: m.alunoMatricula || '',
        CPF: m.alunoCpf || '',
        Email: m.alunoEmail,
        Disciplina: m.disciplinaNome || m.projetoTitulo,
        Professor: m.professorNome,
        Departamento: m.departamentoNome,
        'Carga Horaria Total': m.cargaHoraria,
        Nota: extractNotaFromRelatorioConteudo(m.relatorioConteudo),
        'Link Relatorio PDF': `${clientUrl}/api/relatorio-monitor/${m.relatorioMonitorId}/pdf`,
      }))

      const wsVoluntarios = XLSX.utils.json_to_sheet(voluntariosData)
      const wbVoluntarios = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wbVoluntarios, wsVoluntarios, 'Voluntarios')
      const voluntariosBuffer = Buffer.from(XLSX.write(wbVoluntarios, { type: 'buffer', bookType: 'xlsx' }))

      const relatoriosDisciplina = await database
        .select({
          professorNome: professorTable.nomeCompleto,
          professorSiape: professorTable.matriculaSiape,
          projetoTitulo: projetoTable.titulo,
          disciplinaNome: projetoTable.disciplinaNome,
          projetoId: projetoTable.id,
          relatorioId: relatorioFinalDisciplinaTable.id,
          departamentoNome: departamentoTable.nome,
          status: relatorioFinalDisciplinaTable.status,
        })
        .from(relatorioFinalDisciplinaTable)
        .innerJoin(projetoTable, eq(relatorioFinalDisciplinaTable.projetoId, projetoTable.id))
        .innerJoin(professorTable, eq(projetoTable.professorResponsavelId, professorTable.id))
        .innerJoin(departamentoTable, eq(projetoTable.departamentoId, departamentoTable.id))
        .where(and(eq(projetoTable.ano, ano), eq(projetoTable.semestre, semestre)))

      const relatoriosData = relatoriosDisciplina.map((r) => ({
        Disciplina: r.disciplinaNome || r.projetoTitulo,
        Professor: r.professorNome,
        SIAPE: r.professorSiape || '',
        Departamento: r.departamentoNome,
        Status: r.status,
        'Link Relatorio PDF': `${clientUrl}/api/relatorio-disciplina/${r.relatorioId}/pdf`,
      }))

      const wsRelatorios = XLSX.utils.json_to_sheet(relatoriosData)
      const wbRelatorios = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wbRelatorios, wsRelatorios, 'Relatorios')
      const relatoriosBuffer = Buffer.from(XLSX.write(wbRelatorios, { type: 'buffer', bookType: 'xlsx' }))

      return {
        bolsistas: bolsistasBuffer,
        voluntarios: voluntariosBuffer,
        relatoriosDisciplina: relatoriosBuffer,
      }
    },

    async enviarCertificadosParaNUMOP(
      ano: number,
      semestre: Semestre,
      emailDestino: string,
      remetenteUserId: number
    ): Promise<{ success: boolean; message: string }> {
      const semestreDisplay = SEMESTRE_LABELS[semestre]

      try {
        const planilhas = await this.gerarPlanilhasCertificados(ano, semestre)

        await relatoriosEmailService.sendCertificadosParaDepartamento({
          to: emailDestino,
          ano,
          semestre,
          anexos: [
            { filename: `Certificados_Bolsistas_${ano}_${semestreDisplay}.xlsx`, buffer: planilhas.bolsistas },
            { filename: `Certificados_Voluntarios_${ano}_${semestreDisplay}.xlsx`, buffer: planilhas.voluntarios },
            {
              filename: `Relatorios_Disciplinas_${ano}_${semestreDisplay}.xlsx`,
              buffer: planilhas.relatoriosDisciplina,
            },
          ],
          remetenteUserId,
        })

        return { success: true, message: `Planilhas enviadas com sucesso para ${emailDestino}` }
      } catch (error) {
        log.error(`Erro ao enviar certificados: ${error instanceof Error ? error.message : String(error)}`)
        return { success: false, message: `Erro ao enviar: ${error instanceof Error ? error.message : String(error)}` }
      }
    },

    async getValidationStatus(ano: number, semestre: Semestre) {
      const [projetosCount] = await database
        .select({ count: count() })
        .from(projetoTable)
        .where(and(eq(projetoTable.ano, ano), eq(projetoTable.semestre, semestre), eq(projetoTable.status, APPROVED)))

      const [relatoriosDisciplinaCount] = await database
        .select({ count: count() })
        .from(relatorioFinalDisciplinaTable)
        .innerJoin(projetoTable, eq(relatorioFinalDisciplinaTable.projetoId, projetoTable.id))
        .where(and(eq(projetoTable.ano, ano), eq(projetoTable.semestre, semestre)))

      const [relatoriosDisciplinaAssinadosCount] = await database
        .select({ count: count() })
        .from(relatorioFinalDisciplinaTable)
        .innerJoin(projetoTable, eq(relatorioFinalDisciplinaTable.projetoId, projetoTable.id))
        .where(
          and(
            eq(projetoTable.ano, ano),
            eq(projetoTable.semestre, semestre),
            sql`${relatorioFinalDisciplinaTable.professorAssinouEm} IS NOT NULL`
          )
        )

      const [vagasCount] = await database
        .select({ count: count() })
        .from(vagaTable)
        .innerJoin(projetoTable, eq(vagaTable.projetoId, projetoTable.id))
        .where(and(eq(projetoTable.ano, ano), eq(projetoTable.semestre, semestre)))

      const [relatoriosMonitorCount] = await database
        .select({ count: count() })
        .from(relatorioFinalMonitorTable)
        .innerJoin(inscricaoTable, eq(relatorioFinalMonitorTable.inscricaoId, inscricaoTable.id))
        .innerJoin(projetoTable, eq(inscricaoTable.projetoId, projetoTable.id))
        .where(and(eq(projetoTable.ano, ano), eq(projetoTable.semestre, semestre)))

      const [relatoriosMonitorAssinadosCount] = await database
        .select({ count: count() })
        .from(relatorioFinalMonitorTable)
        .innerJoin(inscricaoTable, eq(relatorioFinalMonitorTable.inscricaoId, inscricaoTable.id))
        .innerJoin(projetoTable, eq(inscricaoTable.projetoId, projetoTable.id))
        .where(
          and(
            eq(projetoTable.ano, ano),
            eq(projetoTable.semestre, semestre),
            sql`${relatorioFinalMonitorTable.alunoAssinouEm} IS NOT NULL`,
            sql`${relatorioFinalMonitorTable.professorAssinouEm} IS NOT NULL`
          )
        )

      return {
        projetos: {
          total: projetosCount?.count || 0,
          comRelatorio: relatoriosDisciplinaCount?.count || 0,
          assinados: relatoriosDisciplinaAssinadosCount?.count || 0,
        },
        monitores: {
          total: vagasCount?.count || 0,
          comRelatorio: relatoriosMonitorCount?.count || 0,
          totalmenteAssinados: relatoriosMonitorAssinadosCount?.count || 0,
        },
        podeExportar:
          (relatoriosDisciplinaAssinadosCount?.count || 0) > 0 && (relatoriosMonitorAssinadosCount?.count || 0) > 0,
      }
    },
  }
}

export type RelatoriosFinaisExportService = ReturnType<typeof createRelatoriosFinaisExportService>
