import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createProjetoRepository } from './projeto-repository'

/**
 * Regression for projeto 605 (production, 2026-08-19): three periodos exist for
 * (2026, SEMESTRE_2) and only periodo 16 carries edital 13. Both resolvers used an
 * unordered `findFirst`, returned periodo 12, and reported the semester as having no
 * edital — so approval wrote `edital_interno_id = NULL` and the professor's selection
 * screen threw "Projeto não está vinculado a um edital interno".
 */
const EDITAL_13 = { id: 13, tipo: 'DCC', numeroEdital: '002/26', publicado: false }

const PERIODOS_2026_2 = [
  { id: 12, ano: 2026, semestre: 'SEMESTRE_2', numeroEditalPrograd: null, edital: null },
  { id: 13, ano: 2026, semestre: 'SEMESTRE_2', numeroEditalPrograd: null, edital: null },
  { id: 16, ano: 2026, semestre: 'SEMESTRE_2', numeroEditalPrograd: null, edital: EDITAL_13 },
]

function makeDb(periodos: unknown[]) {
  const findMany = vi.fn().mockResolvedValue(periodos)
  const db = {
    query: {
      periodoInscricaoTable: { findMany, findFirst: vi.fn() },
      editalTable: { findFirst: vi.fn(), findMany: vi.fn() },
    },
    // biome-ignore lint/suspicious/noExplicitAny: fake db for repository unit test
  } as any
  return { db, findMany }
}

describe('projetoRepository periodo/edital resolution', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('findPeriodoByProjetoSemestre returns the periodo that holds the edital', async () => {
    const { db } = makeDb(PERIODOS_2026_2)
    const periodo = await createProjetoRepository(db).findPeriodoByProjetoSemestre(2026, 'SEMESTRE_2')

    expect(periodo?.id).toBe(16)
    expect(periodo?.edital?.id).toBe(13)
  })

  it('findPeriodoByProjetoSemestre eager-loads the edital so the edit window can be enforced', async () => {
    const { db, findMany } = makeDb(PERIODOS_2026_2)
    await createProjetoRepository(db).findPeriodoByProjetoSemestre(2026, 'SEMESTRE_2')

    expect(findMany).toHaveBeenCalledTimes(1)
    const args = findMany.mock.calls[0][0]
    expect(args.with.edital.columns).toMatchObject({
      id: true,
      tipo: true,
      numeroEdital: true,
      publicado: true,
      dataInicioAlteracao: true,
      dataFimAlteracao: true,
    })
  })

  it('findEditalByAnoSemestre returns edital 13 instead of null', async () => {
    const { db } = makeDb(PERIODOS_2026_2)
    const edital = await createProjetoRepository(db).findEditalByAnoSemestre(2026, 'SEMESTRE_2')

    expect(edital).not.toBeNull()
    expect(edital?.id).toBe(13)
  })

  it('findEditalByAnoSemestre returns null when no periodo of the semester has an edital', async () => {
    const { db } = makeDb([
      { id: 12, edital: null },
      { id: 13, edital: null },
    ])
    const edital = await createProjetoRepository(db).findEditalByAnoSemestre(2026, 'SEMESTRE_2')

    expect(edital).toBeNull()
  })

  it('findEditalByAnoSemestre returns null when the semester has no periodo', async () => {
    const { db } = makeDb([])
    const edital = await createProjetoRepository(db).findEditalByAnoSemestre(2025, 'SEMESTRE_1')

    expect(edital).toBeNull()
  })

  it('findPeriodoByProjetoSemestre returns undefined when the semester has no periodo', async () => {
    const { db } = makeDb([])
    const periodo = await createProjetoRepository(db).findPeriodoByProjetoSemestre(2025, 'SEMESTRE_1')

    expect(periodo).toBeUndefined()
  })
})
