import { NotFoundError } from '@/server/lib/errors'
import { SEMESTRE_1, type Semestre } from '@/types'
import { logger } from '@/utils/logger'
import ExcelJS from 'exceljs'
import type { RelatoriosRepository } from './relatorios-repository'

const _log = logger.child({ context: 'PlanilhaPROGRADService' })

// Helper to clean RG/CPF (remove non-numeric characters)
function cleanNumericOnly(value: string | null | undefined): string {
  if (!value) return ''
  return value.replace(/\D/g, '')
}

// Helper to format phone (DDD + number)
function formatPhone(value: string | null | undefined): string {
  if (!value) return ''
  const clean = value.replace(/\D/g, '')
  if (clean.length >= 11) return clean
  if (clean.length === 9) return `71${clean}`
  return clean
}

// Excel styling constants
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

export function createPlanilhaPROGRADService(repo: RelatoriosRepository) {
  return {
    /**
     * Generate XLSX for VOLUNTARIOS in PROGRAD format
     * Columns: Nome, RG, CPF, Matrícula, Componente Curricular, Professor
     */
    async generatePlanilhaVoluntariosXLSX(ano: number, semestre: Semestre, departamentoId?: number) {
      const voluntarios = await repo.findVoluntariosFinal(ano, semestre, departamentoId)

      if (voluntarios.length === 0) {
        throw new NotFoundError('Voluntário', 'Nenhum voluntário encontrado para o período especificado')
      }

      const workbook = new ExcelJS.Workbook()
      const sheet = workbook.addWorksheet('Voluntários')

      const headers = ['Nome Completo', 'RG', 'CPF', 'Matrícula', 'Componente Curricular', 'Professor Responsável']
      const headerRow = sheet.addRow(headers)
      applyHeaderStyle(headerRow)

      for (const v of voluntarios) {
        const disciplinas = await repo.findDisciplinasByProjetoId(v.projeto.id)
        const componenteCurricular = disciplinas.map((d) => `${d.codigo} - ${d.nome}`).join('; ')

        const row = sheet.addRow([
          v.aluno.nomeCompleto,
          cleanNumericOnly(v.aluno.rg),
          cleanNumericOnly(v.aluno.cpf),
          v.aluno.matricula,
          componenteCurricular,
          v.professor.nomeCompleto,
        ])
        applyDataStyle(row)
      }

      const colWidths = [30, 15, 15, 15, 50, 30]
      headers.forEach((_, idx) => {
        sheet.getColumn(idx + 1).width = colWidths[idx] || 15
      })

      const buffer = await workbook.xlsx.writeBuffer()
      const semestreDisplay = semestre === SEMESTRE_1 ? '1' : '2'
      const fileName = `planilha-voluntarios-${ano}-${semestreDisplay}.xlsx`

      return {
        buffer: Buffer.from(buffer),
        fileName,
        totalRegistros: voluntarios.length,
        downloadUrl: `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${Buffer.from(buffer).toString('base64')}`,
      }
    },

    /**
     * Generate XLSX for BOLSISTAS in PROGRAD format
     * Columns: Nome, RG, CPF, Matrícula, Celular, Email, Banco, Agência, Dígito Agência, Conta, Dígito Conta, Endereço, Componente, Professor
     */
    async generatePlanilhaBolsistasXLSX(
      ano: number,
      semestre: Semestre,
      departamentoId?: number,
      _includeEndereco = true
    ) {
      const bolsistas = await repo.findBolsistasFinal(ano, semestre, departamentoId)

      if (bolsistas.length === 0) {
        throw new NotFoundError('Bolsista', 'Nenhum bolsista encontrado para o período especificado')
      }

      const workbook = new ExcelJS.Workbook()
      const sheet = workbook.addWorksheet('Bolsistas')

      const headers = [
        'Nome Completo',
        'RG',
        'CPF',
        'Matrícula',
        'Celular',
        'E-mail',
        'Banco',
        'Agência',
        'Dígito Agência',
        'Conta',
        'Dígito Conta',
        'Endereço Completo',
        'Componente Curricular',
        'Professor Responsável',
      ]
      const headerRow = sheet.addRow(headers)
      applyHeaderStyle(headerRow)

      for (const b of bolsistas) {
        const disciplinas = await repo.findDisciplinasByProjetoId(b.projeto.id)
        const componenteCurricular = disciplinas.map((d) => `${d.codigo} - ${d.nome}`).join('; ')
        const enderecoCompleto = ''

        const row = sheet.addRow([
          b.aluno.nomeCompleto,
          cleanNumericOnly(b.aluno.rg),
          cleanNumericOnly(b.aluno.cpf),
          b.aluno.matricula,
          formatPhone(b.aluno.telefone),
          b.alunoUser.email,
          b.aluno.banco || '',
          b.aluno.agencia || '',
          '',
          b.aluno.conta || '',
          b.aluno.digitoConta || '',
          enderecoCompleto,
          componenteCurricular,
          b.professor.nomeCompleto,
        ])
        applyDataStyle(row)
      }

      const colWidths = [30, 15, 15, 15, 15, 30, 15, 12, 8, 15, 8, 40, 50, 30]
      headers.forEach((_, idx) => {
        sheet.getColumn(idx + 1).width = colWidths[idx] || 15
      })

      const buffer = await workbook.xlsx.writeBuffer()
      const semestreDisplay = semestre === SEMESTRE_1 ? '1' : '2'
      const fileName = `planilha-bolsistas-${ano}-${semestreDisplay}.xlsx`

      return {
        buffer: Buffer.from(buffer),
        fileName,
        totalRegistros: bolsistas.length,
        downloadUrl: `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${Buffer.from(buffer).toString('base64')}`,
      }
    },

    /**
     * Validate data completeness for PROGRAD export
     */
    async validateDataForExport(ano: number, semestre: Semestre, tipo: 'bolsistas' | 'voluntarios' | 'ambos') {
      const problemas: Array<{
        tipo: string
        monitor: string
        campo: string
        mensagem: string
      }> = []

      if (tipo === 'bolsistas' || tipo === 'ambos') {
        const bolsistas = await repo.findBolsistasForValidation(ano, semestre)

        for (const b of bolsistas) {
          if (!b.aluno.cpf) {
            problemas.push({
              tipo: 'bolsista',
              monitor: b.aluno.nomeCompleto,
              campo: 'CPF',
              mensagem: 'CPF não informado',
            })
          }
          if (!b.aluno.banco) {
            problemas.push({
              tipo: 'bolsista',
              monitor: b.aluno.nomeCompleto,
              campo: 'Dados Bancários',
              mensagem: 'Banco não informado',
            })
          }
          if (!b.aluno.agencia) {
            problemas.push({
              tipo: 'bolsista',
              monitor: b.aluno.nomeCompleto,
              campo: 'Dados Bancários',
              mensagem: 'Agência não informada',
            })
          }
          if (!b.aluno.conta) {
            problemas.push({
              tipo: 'bolsista',
              monitor: b.aluno.nomeCompleto,
              campo: 'Dados Bancários',
              mensagem: 'Conta não informada',
            })
          }
        }
      }

      if (tipo === 'voluntarios' || tipo === 'ambos') {
        const voluntarios = await repo.findVoluntariosForValidation(ano, semestre)

        for (const v of voluntarios) {
          if (!v.aluno.cpf) {
            problemas.push({
              tipo: 'voluntario',
              monitor: v.aluno.nomeCompleto,
              campo: 'CPF',
              mensagem: 'CPF não informado',
            })
          }
        }
      }

      return {
        valido: problemas.length === 0,
        totalProblemas: problemas.length,
        problemas,
      }
    },
  }
}

export type PlanilhaPROGRADService = ReturnType<typeof createPlanilhaPROGRADService>
