import { logger } from '@/utils/logger'
import * as XLSX from 'xlsx'

const log = logger.child({ context: 'PlanejamentoDCCParser' })
const HEADER_DISCIPLINA_MARKER = 'DISCIPLINA' as const

export interface PlanejamentoDCCRow {
  disciplinaCodigo: string
  disciplinaNome: string
  professorNome: string
  cargaHoraria?: number
}

export interface ParsedPlanejamentoDCC {
  rows: PlanejamentoDCCRow[]
  errors: string[]
  warnings: string[]
}

/**
 * Sanitize cell values from spreadsheets to handle special characters
 * that may cause processing errors (smart quotes, BOM, non-breaking spaces, etc.)
 */
function sanitizeCellValue(value: string): string {
  return value
    .replace(/[\u200B-\u200D\uFEFF]/g, '') // Zero-width chars / BOM
    .replace(/\u00A0/g, ' ')               // Non-breaking space
    .replace(/[\u2018\u2019]/g, "'")        // Smart single quotes
    .replace(/[\u201C\u201D]/g, '"')        // Smart double quotes
    .replace(/[\u2013\u2014]/g, '-')        // En/em dashes
    .replace(/\u2026/g, '...')              // Ellipsis
    .replace(/\r\n|\r/g, '\n')             // Normalize newlines
    .trim()
}

/**
 * Parser específico para planilha de planejamento DCC
 * Formato: DISCIPLINA | TURMA | NOME DISCIPLINA | ... | CH | DOCENTE
 */
export async function parsePlanejamentoDCC(fileBuffer: Buffer): Promise<ParsedPlanejamentoDCC> {
  const errors: string[] = []
  const warnings: string[] = []
  const rows: PlanejamentoDCCRow[] = []

  try {
    // Ler workbook com codepage UTF-8 para preservar caracteres acentuados
    const workbook = XLSX.read(fileBuffer, { type: 'buffer', codepage: 65001 })

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

    // Converter para array sem header automático
    const data = XLSX.utils.sheet_to_json<string[]>(worksheet, {
      header: 1, // Array de arrays
      defval: '',
      raw: false,
    })

    log.info({ totalLinhas: data.length }, 'Planilha parseada')

    // Encontrar linha do header real (linha 3 no arquivo original, índice 2)
    let headerIndex = -1
    for (let i = 0; i < Math.min(10, data.length); i++) {
      const row = data[i]
      if (Array.isArray(row) && row.length > 0) {
        const firstCol = String(row[0] || '').toUpperCase()
        if (firstCol.includes(HEADER_DISCIPLINA_MARKER)) {
          headerIndex = i
          break
        }
      }
    }

    if (headerIndex === -1) {
      errors.push(`Não foi possível encontrar linha de cabeçalho (procurando por "${HEADER_DISCIPLINA_MARKER}")`)
      return { rows, errors, warnings }
    }

    const headers = data[headerIndex] as string[]
    log.info({ headerIndex, headers }, 'Header encontrado')

    // Identificar índices das colunas importantes
    const disciplinaIdx = headers.findIndex((h) => String(h).toUpperCase().includes('DISCIPLINA'))
    const nomeIdx = headers.findIndex((h) => {
      const h_upper = String(h).toUpperCase()
      return h_upper.includes('NOME') && h_upper.includes('DISCIPLINA')
    })
    const docenteIdx = headers.length - 1 // Última coluna
    const chIdx = headers.findIndex((h) => String(h).toUpperCase() === 'CH')

    if (disciplinaIdx === -1 || docenteIdx === -1) {
      errors.push(`Colunas obrigatórias não encontradas. Disciplina: ${disciplinaIdx}, Docente: ${docenteIdx}`)
      return { rows, errors, warnings }
    }

    log.info(
      {
        disciplinaIdx,
        nomeIdx,
        chIdx,
        docenteIdx,
      },
      'Índices das colunas identificados'
    )

    // Variáveis para rastrear disciplina atual (linhas vazias são continuações)
    let currentDisciplina = ''
    let currentNome = ''
    let currentCH: number | undefined

    // Processar linhas de dados (começar após header + 1 para pular separadores)
    for (let i = headerIndex + 1; i < data.length; i++) {
      const row = data[i]
      if (!Array.isArray(row) || row.length === 0) continue

      const lineNumber = i + 1

      try {
        const disciplinaRaw = sanitizeCellValue(String(row[disciplinaIdx] || ''))
        const nomeRaw = nomeIdx !== -1 ? sanitizeCellValue(String(row[nomeIdx] || '')) : ''
        const docenteRaw = sanitizeCellValue(String(row[docenteIdx] || ''))
        const chRaw = chIdx !== -1 ? sanitizeCellValue(String(row[chIdx] || '')) : ''

        // Pular linhas separadoras (ex: "OBRIGATÓRIAS DA GRADUAÇÃO")
        if (
          disciplinaRaw.toUpperCase().includes('OBRIGATÓRIA') ||
          disciplinaRaw.toUpperCase().includes('OPTATIVA') ||
          disciplinaRaw.toUpperCase().includes('TURMAS')
        ) {
          continue
        }

        // Se disciplina estiver preenchida, é uma nova disciplina
        if (disciplinaRaw) {
          currentDisciplina = disciplinaRaw
          currentNome = nomeRaw || currentDisciplina
          currentCH = chRaw ? parseInt(chRaw, 10) : undefined
        }

        // Processar docente se existir
        if (docenteRaw && currentDisciplina) {
          // Limpar nome do docente (remover observações)
          let professorNome = docenteRaw

          // Pular substitutos genéricos (SUB 01, SUB 02, etc)
          if (/^SUB\s*\d+$/i.test(professorNome)) {
            warnings.push(
              `Linha ${lineNumber}: Professor substituto genérico "${professorNome}" - pulando (disciplina ${currentDisciplina})`
            )
            continue
          }

          // Pular "docente a contratar"
          if (/docente\s*a\s*contratar/i.test(professorNome)) {
            warnings.push(`Linha ${lineNumber}: Docente a contratar - pulando (disciplina ${currentDisciplina})`)
            continue
          }

          // Limpar observações entre parênteses
          professorNome = professorNome.replace(/\([^)]*\)/g, '').trim()

          // Se tem múltiplos professores separados por "+"
          const professores = professorNome
            .split('+')
            .map((p) => p.trim())
            .filter((p) => p.length > 0 && !/^SUB\s*\d+$/i.test(p))

          if (professores.length === 0) {
            continue
          }

          // Para cada professor, criar entrada
          for (const prof of professores) {
            // Verificar se já foi adicionado (evitar duplicatas por disciplina+professor)
            const exists = rows.some(
              (r) => r.disciplinaCodigo === currentDisciplina && r.professorNome.toLowerCase() === prof.toLowerCase()
            )

            if (!exists) {
              rows.push({
                disciplinaCodigo: currentDisciplina,
                disciplinaNome: currentNome,
                professorNome: prof,
                cargaHoraria: currentCH && !isNaN(currentCH) ? currentCH : undefined,
              })

              log.debug(
                {
                  linha: lineNumber,
                  disciplina: currentDisciplina,
                  professor: prof,
                },
                'Linha processada'
              )
            }
          }
        }
      } catch (error) {
        errors.push(
          `Linha ${lineNumber}: Erro ao processar - ${error instanceof Error ? error.message : 'Erro desconhecido'}`
        )
      }
    }

    // Agrupar por disciplina para detectar projetos coletivos
    const grouped = groupByDisciplina(rows)

    // Avisar sobre projetos coletivos
    for (const [key, entries] of grouped.entries()) {
      if (entries.length > 1) {
        const professores = entries.map((e) => e.professorNome).join(', ')
        log.info(
          { key, professores },
          `Disciplina ${entries[0].disciplinaCodigo} tem ${entries.length} professores (COLETIVO)`
        )
      }
    }

    log.info(
      {
        linhasProcessadas: rows.length,
        disciplinasUnicas: grouped.size,
        erros: errors.length,
        avisos: warnings.length,
      },
      'Planilha DCC processada'
    )

    return { rows, errors, warnings }
  } catch (error) {
    log.error(error, 'Erro ao parsear planilha DCC')
    errors.push(`Erro crítico ao processar planilha: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
    return { rows, errors, warnings }
  }
}

/**
 * Agrupa linhas por disciplina (código)
 */
export function groupByDisciplina(rows: PlanejamentoDCCRow[]): Map<string, PlanejamentoDCCRow[]> {
  const grouped = new Map<string, PlanejamentoDCCRow[]>()

  for (const row of rows) {
    const key = row.disciplinaCodigo
    if (!grouped.has(key)) {
      grouped.set(key, [])
    }
    grouped.get(key)?.push(row)
  }

  return grouped
}
