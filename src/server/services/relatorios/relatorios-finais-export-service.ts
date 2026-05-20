import type { db } from '@/server/db'
import {
  alunoTable,
  departamentoTable,
  disciplinaTable,
  inscricaoTable,
  professorTable,
  projetoDisciplinaTable,
  projetoTable,
  relatorioFinalDisciplinaTable,
  relatorioFinalMonitorTable,
  userTable,
  vagaTable,
} from '@/server/db/schema'
import { relatoriosEmailService } from '@/server/lib/email/relatorios-emails'
import { APPROVED, SEMESTRE_1, SEMESTRE_LABELS, type Semestre, extractNotaFromRelatorioConteudo } from '@/types'
import { logger } from '@/utils/logger'
import { and, count, eq, sql } from 'drizzle-orm'
import ExcelJS from 'exceljs'

type Database = typeof db

const log = logger.child({ context: 'RelatoriosFinaisExportService' })

// Excel styling constants (matching PROGRAD template)
const greenFill: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF92D050' } }
const thinBorder: Partial<ExcelJS.Borders> = {
  top: { style: 'thin' },
  left: { style: 'thin' },
  bottom: { style: 'thin' },
  right: { style: 'thin' },
}

function applyHeaderStyle(row: ExcelJS.Row) {
  row.eachCell((cell) => {
    cell.fill = greenFill
    cell.font = { bold: true, size: 10 }
    cell.border = thinBorder
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
  })
  row.height = 25
}

function applyDataStyle(row: ExcelJS.Row) {
  row.eachCell((cell) => {
    cell.border = thinBorder
    cell.alignment = { vertical: 'middle', wrapText: true }
  })
}

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

    /**
     * Generate certificate report XLSX matching Certificates 2025.xlsx template format.
     * Returns a SINGLE workbook with 3 sheets:
     * - "Relatórios Disciplinas": Componente, Código, Semestre, Departamento, Unidade, Professor
     * - "Relatórios Monitores": Monitor, Modalidade, Código, Componente, Semestre, Início, Início do recesso, Fim do recesso, Término, Nota, Frequência, Semanas, CHT, Departamento, Unidade, Professor
     * - "Source": Dropdown validation data
     */
    async gerarPlanilhasCertificados(
      ano: number,
      semestre: Semestre
    ): Promise<{ certificados: Buffer; fileName: string }> {
      const semestreDisplay = `${ano}.${semestre === SEMESTRE_1 ? '1' : '2'}`

      // Fetch all monitors with complete data
      const monitores = await database
        .select({
          alunoNome: alunoTable.nomeCompleto,
          professorNome: professorTable.nomeCompleto,
          projetoId: projetoTable.id,
          projetoTitulo: projetoTable.titulo,
          disciplinaNome: projetoTable.disciplinaNome,
          tipoVaga: vagaTable.tipo,
          cargaHorariaSemana: projetoTable.cargaHorariaSemana,
          numeroSemanas: projetoTable.numeroSemanas,
          relatorioConteudo: relatorioFinalMonitorTable.conteudo,
          departamentoNome: departamentoTable.nome,
          departamentoSigla: departamentoTable.sigla,
          dataInicio: vagaTable.dataInicio,
          dataFim: vagaTable.dataFim,
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

      // Fetch disciplines for each project
      const projetoIds = [...new Set(monitores.map((m) => m.projetoId))]
      const disciplinasMap = new Map<number, Array<{ codigo: string; nome: string }>>()

      for (const projetoId of projetoIds) {
        const disciplinas = await database
          .select({
            codigo: disciplinaTable.codigo,
            nome: disciplinaTable.nome,
          })
          .from(projetoDisciplinaTable)
          .innerJoin(disciplinaTable, eq(projetoDisciplinaTable.disciplinaId, disciplinaTable.id))
          .where(eq(projetoDisciplinaTable.projetoId, projetoId))
        disciplinasMap.set(projetoId, disciplinas)
      }

      // Create workbook with 3 sheets
      const workbook = new ExcelJS.Workbook()

      // === SHEET 1: Relatórios Disciplinas ===
      const sheetDisciplinas = workbook.addWorksheet('Relatórios Disciplinas')
      const disciplinasHeaders = ['Componente', 'Código', 'Semestre', 'Departamento', 'Unidade', 'Professor']
      const disciplinasHeaderRow = sheetDisciplinas.addRow(disciplinasHeaders)
      applyHeaderStyle(disciplinasHeaderRow)

      // Second row with descriptions
      const disciplinasDescRow = sheetDisciplinas.addRow([
        'Nome do Componente Curricular',
        'Código do Componente Curricular',
        'Semestre',
        'Departamento ou Coordenação acadêmica',
        'Unidade Universitária',
        'Professor Orientador',
      ])
      applyDataStyle(disciplinasDescRow)

      // Collect unique disciplines
      const uniqueDisciplinas = new Map<
        string,
        { nome: string; codigo: string; departamento: string; professor: string }
      >()
      for (const m of monitores) {
        const disciplinas = disciplinasMap.get(m.projetoId) || []
        for (const d of disciplinas) {
          if (!uniqueDisciplinas.has(d.codigo)) {
            uniqueDisciplinas.set(d.codigo, {
              nome: d.nome,
              codigo: d.codigo,
              departamento: m.departamentoNome,
              professor: m.professorNome,
            })
          }
        }
      }

      for (const d of uniqueDisciplinas.values()) {
        const row = sheetDisciplinas.addRow([
          d.nome,
          d.codigo,
          semestreDisplay,
          d.departamento,
          'Instituto de Computação',
          d.professor,
        ])
        applyDataStyle(row)
      }

      // Set column widths
      const disciplinaWidths = [40, 15, 10, 40, 25, 35]
      disciplinaWidths.forEach((w, i) => {
        sheetDisciplinas.getColumn(i + 1).width = w
      })

      // === SHEET 2: Relatórios Monitores ===
      const sheetMonitores = workbook.addWorksheet('Relatórios Monitores')
      const monitoresHeaders = [
        'Monitor',
        'Modalidade',
        'Código',
        'Componente',
        'Semestre',
        'Início',
        'Início do recesso',
        'Fim do recesso',
        'Término',
        'Nota',
        'Frequência',
        'Semanas',
        'CHT',
        'Departamento',
        'Unidade',
        'Professor',
      ]
      const monitoresHeaderRow = sheetMonitores.addRow(monitoresHeaders)
      applyHeaderStyle(monitoresHeaderRow)

      // Second row with descriptions
      const monitoresDescRow = sheetMonitores.addRow([
        'Nome do Monitor',
        'Modalidade',
        'Código do Componente Curricular',
        'Nome do Componente Curricular',
        'Semestre',
        'Início das atividades',
        'Início do recesso',
        'Fim do recesso',
        'Término das atividades',
        'Nota',
        'Frequência de participação (%)',
        'Semanas',
        'Carga horária total',
        'Departamento ou Coordenação acadêmica',
        'Unidade Universitária',
        'Professor Orientador',
      ])
      applyDataStyle(monitoresDescRow)

      // Helper to format date
      const formatDate = (d: Date | null) => {
        if (!d) return ''
        return d.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: '2-digit' })
      }

      // Add monitor rows
      for (const m of monitores) {
        const disciplinas = disciplinasMap.get(m.projetoId) || []
        const disciplina = disciplinas[0] || { codigo: '', nome: m.disciplinaNome || m.projetoTitulo }
        const nota = extractNotaFromRelatorioConteudo(m.relatorioConteudo)
        const cargaHorariaTotal = (m.cargaHorariaSemana || 12) * (m.numeroSemanas || 18)
        const modalidade = m.tipoVaga === 'BOLSISTA' ? 'Bolsista' : 'Voluntário'

        // Default dates if not set
        const dataInicio = m.dataInicio || new Date(ano, semestre === SEMESTRE_1 ? 2 : 7, 24)
        const dataFim = m.dataFim || new Date(ano, semestre === SEMESTRE_1 ? 6 : 11, 26)

        const row = sheetMonitores.addRow([
          m.alunoNome,
          modalidade,
          disciplina.codigo,
          disciplina.nome,
          semestreDisplay,
          formatDate(dataInicio),
          '', // Início do recesso
          '', // Fim do recesso
          formatDate(dataFim),
          nota,
          '100%',
          m.numeroSemanas || 18,
          `${cargaHorariaTotal} horas`,
          m.departamentoSigla || m.departamentoNome,
          'IC',
          m.professorNome,
        ])
        applyDataStyle(row)
      }

      // Set column widths for monitors sheet
      const monitoresWidths = [35, 12, 12, 35, 10, 12, 15, 15, 12, 8, 12, 10, 12, 15, 8, 35]
      monitoresWidths.forEach((w, i) => {
        sheetMonitores.getColumn(i + 1).width = w
      })

      // === SHEET 3: Source (validation data) ===
      const sheetSource = workbook.addWorksheet('Source')
      sheetSource.addRow(['Modalidade'])
      sheetSource.addRow(['Bolsista'])
      sheetSource.addRow(['Voluntário'])

      // Generate buffer
      const buffer = await workbook.xlsx.writeBuffer()
      const fileName = `Certificates_${ano}_${semestre === SEMESTRE_1 ? '1' : '2'}.xlsx`

      return {
        certificados: Buffer.from(buffer),
        fileName,
      }
    },

    async enviarCertificadosParaNUMOP(
      ano: number,
      semestre: Semestre,
      emailDestino: string,
      remetenteUserId: number
    ): Promise<{ success: boolean; message: string }> {
      try {
        const planilha = await this.gerarPlanilhasCertificados(ano, semestre)

        await relatoriosEmailService.sendCertificadosParaDepartamento({
          to: emailDestino,
          ano,
          semestre,
          anexos: [{ filename: planilha.fileName, buffer: planilha.certificados }],
          remetenteUserId,
        })

        return { success: true, message: `Planilha de certificados enviada com sucesso para ${emailDestino}` }
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
