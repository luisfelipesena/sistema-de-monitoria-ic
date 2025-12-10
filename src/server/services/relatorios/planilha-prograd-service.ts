import { NotFoundError } from '@/server/lib/errors'
import { SEMESTRE_1, type Semestre } from '@/types'
import { logger } from '@/utils/logger'
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
  // If it already has DDD (11 digits), return as is
  if (clean.length >= 11) return clean
  // If it's a 9-digit number, assume local (71 - Salvador)
  if (clean.length === 9) return `71${clean}`
  return clean
}

// Helper to escape CSV values
function escapeCSV(value: string | number | null | undefined): string {
  const stringValue = String(value ?? '')
  if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
    return `"${stringValue.replace(/"/g, '""')}"`
  }
  return stringValue
}

export function createPlanilhaPROGRADService(repo: RelatoriosRepository) {
  return {
    /**
     * Generate CSV for VOLUNTÁRIOS in PROGRAD format
     * Columns:
     * - Nome Completo
     * - RG (somente números)
     * - CPF (somente números)
     * - Matrícula
     * - Componente Curricular do Projeto (código e nome)
     * - Professor Responsável
     */
    async generatePlanilhaVoluntariosCSV(ano: number, semestre: Semestre, departamentoId?: number) {
      const voluntarios = await repo.findVoluntariosFinal(ano, semestre, departamentoId)

      if (voluntarios.length === 0) {
        throw new NotFoundError('Voluntário', 'Nenhum voluntário encontrado para o período especificado')
      }

      const headers = [
        'Nome Completo',
        'RG (somente números)',
        'CPF (somente números)',
        'Matrícula',
        'Componente Curricular do Projeto (código e nome)',
        'Professor Responsável',
      ]

      const rows = await Promise.all(
        voluntarios.map(async (v) => {
          const disciplinas = await repo.findDisciplinasByProjetoId(v.projeto.id)
          const componenteCurricular = disciplinas.map((d) => `${d.codigo} - ${d.nome}`).join('; ')

          return [
            escapeCSV(v.aluno.nomeCompleto),
            escapeCSV(cleanNumericOnly(v.aluno.rg)),
            escapeCSV(cleanNumericOnly(v.aluno.cpf)),
            escapeCSV(v.aluno.matricula),
            escapeCSV(componenteCurricular),
            escapeCSV(v.professor.nomeCompleto),
          ].join(',')
        })
      )

      const csvContent = [headers.join(','), ...rows].join('\n')
      const semestreDisplay = semestre === SEMESTRE_1 ? '1' : '2'
      const fileName = `planilha-voluntarios-${ano}-${semestreDisplay}.csv`

      return {
        csvContent,
        fileName,
        totalRegistros: voluntarios.length,
        downloadUrl: `data:text/csv;charset=utf-8;base64,${Buffer.from(csvContent, 'utf-8').toString('base64')}`,
      }
    },

    /**
     * Generate CSV for BOLSISTAS in PROGRAD format
     * Columns:
     * - Nome Completo
     * - RG (somente números)
     * - CPF (somente números)
     * - Matrícula
     * - Celular (DDD + número)
     * - E-mail
     * - Banco (exceto Mercado Pago)
     * - Agência
     * - Dígito (agência) - Note: not available in current schema, will be empty
     * - Conta
     * - Dígito (conta)
     * - Endereço completo
     * - Componente Curricular do Projeto (código e nome)
     * - Professor Responsável
     */
    async generatePlanilhaBolsistasCSV(
      ano: number,
      semestre: Semestre,
      departamentoId?: number,
      _includeEndereco = true
    ) {
      const bolsistas = await repo.findBolsistasFinal(ano, semestre, departamentoId)

      if (bolsistas.length === 0) {
        throw new NotFoundError('Bolsista', 'Nenhum bolsista encontrado para o período especificado')
      }

      const headers = [
        'Nome Completo',
        'RG (somente números)',
        'CPF (somente números)',
        'Matrícula',
        'Celular (DDD + número)',
        'E-mail',
        'Banco',
        'Agência',
        'Dígito Agência',
        'Conta',
        'Dígito Conta',
        'Endereço Completo',
        'Componente Curricular do Projeto (código e nome)',
        'Professor Responsável',
      ]

      // Note: We need to fetch endereco separately since it's not in findBolsistasFinal
      // For now, we'll leave endereço empty or fetch it if available
      const rows = await Promise.all(
        bolsistas.map(async (b) => {
          const disciplinas = await repo.findDisciplinasByProjetoId(b.projeto.id)
          const componenteCurricular = disciplinas.map((d) => `${d.codigo} - ${d.nome}`).join('; ')

          // Endereco would need to be fetched separately if includeEndereco is true
          // For now, leaving as empty since it requires additional query
          const enderecoCompleto = ''

          return [
            escapeCSV(b.aluno.nomeCompleto),
            escapeCSV(cleanNumericOnly(b.aluno.rg)),
            escapeCSV(cleanNumericOnly(b.aluno.cpf)),
            escapeCSV(b.aluno.matricula),
            escapeCSV(formatPhone(b.aluno.telefone)),
            escapeCSV(b.alunoUser.email),
            escapeCSV(b.aluno.banco || ''),
            escapeCSV(b.aluno.agencia || ''),
            escapeCSV(''), // Dígito agência - not available in schema
            escapeCSV(b.aluno.conta || ''),
            escapeCSV(b.aluno.digitoConta || ''),
            escapeCSV(enderecoCompleto),
            escapeCSV(componenteCurricular),
            escapeCSV(b.professor.nomeCompleto),
          ].join(',')
        })
      )

      const csvContent = [headers.join(','), ...rows].join('\n')
      const semestreDisplay = semestre === SEMESTRE_1 ? '1' : '2'
      const fileName = `planilha-bolsistas-${ano}-${semestreDisplay}.csv`

      return {
        csvContent,
        fileName,
        totalRegistros: bolsistas.length,
        downloadUrl: `data:text/csv;charset=utf-8;base64,${Buffer.from(csvContent, 'utf-8').toString('base64')}`,
      }
    },

    /**
     * Validate data completeness for PROGRAD export
     * Returns list of issues found
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
