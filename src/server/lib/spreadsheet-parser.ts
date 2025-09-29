import { logger } from '@/utils/logger'
import * as XLSX from 'xlsx'

const log = logger.child({ context: 'SpreadsheetParser' })

export interface PlanejamentoRow {
  disciplinaCodigo: string
  disciplinaNome: string
  turma?: string
  professoresSiapes: string[] // Array de SIAPEs
  vagas?: number
}

export interface ParsedPlanejamento {
  rows: PlanejamentoRow[]
  errors: string[]
  warnings: string[]
}

/**
 * Parser de planilha de planejamento do chefe do departamento
 * Formato esperado: Disciplina | Nome | Turma | Professores (SIAPE) | Vagas
 */
export async function parsePlanejamentoSpreadsheet(fileBuffer: Buffer): Promise<ParsedPlanejamento> {
  const errors: string[] = []
  const warnings: string[] = []
  const rows: PlanejamentoRow[] = []

  try {
    // Ler workbook
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' })

    // Pegar primeira sheet
    const sheetName = workbook.SheetNames[0]
    if (!sheetName) {
      errors.push('Planilha vazia ou sem abas')
      return { rows, errors, warnings }
    }

    const worksheet = workbook.Sheets[sheetName]
    if (!worksheet) {
      errors.push('Não foi possível ler a planilha')
      return { rows, errors, warnings }
    }

    // Converter para JSON
    const data = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, {
      defval: '',
      raw: false,
    })

    log.info({ totalLinhas: data.length }, 'Planilha parseada')

    // Processar cada linha
    for (let i = 0; i < data.length; i++) {
      const row = data[i]
      const lineNumber = i + 2 // +2 porque header é linha 1

      try {
        // Tentar diferentes formatos de colunas (flexibilidade)
        const disciplinaCodigo = extractValue(row, [
          'codigo',
          'código',
          'cod',
          'disciplina_codigo',
          'codigo_disciplina',
          'Código',
          'Codigo',
        ])

        const disciplinaNome = extractValue(row, [
          'nome',
          'disciplina',
          'disciplina_nome',
          'nome_disciplina',
          'Nome',
          'Disciplina',
        ])

        const turma = extractValue(row, ['turma', 'Turma'])

        const professoresRaw = extractValue(row, [
          'professores',
          'professor',
          'siape',
          'siapes',
          'professor_siape',
          'professores_siape',
          'Professores',
          'Professor',
          'SIAPE',
        ])

        const vagasRaw = extractValue(row, ['vagas', 'Vagas', 'numero_vagas'])

        // Validações básicas
        if (!disciplinaCodigo) {
          warnings.push(`Linha ${lineNumber}: Código da disciplina vazio, pulando`)
          continue
        }

        if (!disciplinaNome) {
          warnings.push(`Linha ${lineNumber}: Nome da disciplina vazio, pulando`)
          continue
        }

        if (!professoresRaw) {
          warnings.push(`Linha ${lineNumber}: Nenhum professor informado, pulando`)
          continue
        }

        // Processar professores (podem vir separados por vírgula, ponto-e-vírgula, etc)
        const professoresSiapes = professoresRaw
          .toString()
          .split(/[,;|\n]/)
          .map((s) => s.trim())
          .filter((s) => s.length > 0)

        if (professoresSiapes.length === 0) {
          warnings.push(`Linha ${lineNumber}: Lista de professores vazia após processamento`)
          continue
        }

        // Validar formato SIAPE (apenas números, geralmente 7 dígitos)
        const invalidSiapes = professoresSiapes.filter((siape) => !/^\d{6,8}$/.test(siape))
        if (invalidSiapes.length > 0) {
          warnings.push(
            `Linha ${lineNumber}: SIAPEs com formato inválido: ${invalidSiapes.join(', ')} (esperado: 6-8 dígitos)`
          )
          // Filtrar apenas SIAPEs válidos
          const validSiapes = professoresSiapes.filter((siape) => /^\d{6,8}$/.test(siape))
          if (validSiapes.length === 0) {
            continue
          }
        }

        const vagas = vagasRaw ? parseInt(vagasRaw.toString(), 10) : undefined

        rows.push({
          disciplinaCodigo: disciplinaCodigo.toString().trim(),
          disciplinaNome: disciplinaNome.toString().trim(),
          turma: turma ? turma.toString().trim() : undefined,
          professoresSiapes,
          vagas: vagas && !isNaN(vagas) ? vagas : undefined,
        })
      } catch (error) {
        errors.push(
          `Linha ${lineNumber}: Erro ao processar - ${error instanceof Error ? error.message : 'Erro desconhecido'}`
        )
      }
    }

    log.info(
      {
        linhasProcessadas: rows.length,
        erros: errors.length,
        avisos: warnings.length,
      },
      'Planilha processada'
    )

    return { rows, errors, warnings }
  } catch (error) {
    log.error(error, 'Erro ao parsear planilha')
    errors.push(`Erro crítico ao processar planilha: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
    return { rows, errors, warnings }
  }
}

/**
 * Extrai valor de um objeto tentando múltiplas chaves possíveis
 */
function extractValue(obj: Record<string, unknown>, possibleKeys: string[]): string | undefined {
  for (const key of possibleKeys) {
    if (key in obj && obj[key] !== undefined && obj[key] !== null && obj[key] !== '') {
      return obj[key] as string
    }
  }
  return undefined
}

/**
 * Valida estrutura da planilha antes de processar
 */
export function validateSpreadsheetStructure(fileBuffer: Buffer): { valid: boolean; message: string } {
  try {
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' })

    if (workbook.SheetNames.length === 0) {
      return { valid: false, message: 'Planilha sem abas' }
    }

    const worksheet = workbook.Sheets[workbook.SheetNames[0]]
    if (!worksheet) {
      return { valid: false, message: 'Não foi possível ler a primeira aba' }
    }

    const data = XLSX.utils.sheet_to_json(worksheet)
    if (data.length === 0) {
      return { valid: false, message: 'Planilha vazia' }
    }

    return { valid: true, message: 'Planilha válida' }
  } catch (error) {
    return {
      valid: false,
      message: `Erro ao validar: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
    }
  }
}
