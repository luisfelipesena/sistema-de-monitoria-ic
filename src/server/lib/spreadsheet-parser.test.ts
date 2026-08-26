import { describe, expect, it } from 'vitest'
import { parsePlanejamentoDCC } from './planejamento-dcc-parser'
import { XLSX } from './sheetjs'
import { parsePlanejamentoSpreadsheet } from './spreadsheet-parser'

function createWorkbook(rows: unknown[][], bookType: 'xlsx' | 'biff8' = 'xlsx'): Buffer {
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(rows), 'Planejamento')
  return XLSX.write(workbook, { type: 'buffer', bookType })
}

describe('spreadsheet parsers', () => {
  it('reads the generic planning workbook', async () => {
    const result = await parsePlanejamentoSpreadsheet(
      createWorkbook([
        ['Código', 'Nome', 'Professores', 'Vagas'],
        ['MATC01', 'Algoritmos', '1234567', 2],
      ])
    )

    expect(result.errors).toEqual([])
    expect(result.rows).toEqual([
      expect.objectContaining({ disciplinaCodigo: 'MATC01', professoresSiapes: ['1234567'], vagas: 2 }),
    ])
  })

  it('reads the DCC planning workbook', async () => {
    const result = await parsePlanejamentoDCC(
      createWorkbook([
        ['DISCIPLINA', 'TURMA', 'NOME DISCIPLINA', 'CH', 'DOCENTE'],
        ['MATC01', 'T01', 'Algoritmos', 68, 'Prof. Teste'],
      ])
    )

    expect(result.errors).toEqual([])
    expect(result.rows).toEqual([
      expect.objectContaining({
        disciplinaCodigo: 'MATC01',
        disciplinaNome: 'Algoritmos',
        professorNome: 'Prof. Teste',
        cargaHoraria: 68,
      }),
    ])
  })

  it('reads legacy XLS files with accented headers', async () => {
    const result = await parsePlanejamentoSpreadsheet(
      createWorkbook(
        [
          ['Código', 'Nome', 'Professores'],
          ['MATC02', 'Computação', '7654321'],
        ],
        'biff8'
      )
    )

    expect(result.errors).toEqual([])
    expect(result.rows[0]).toEqual(
      expect.objectContaining({ disciplinaCodigo: 'MATC02', disciplinaNome: 'Computação' })
    )
  })
})
