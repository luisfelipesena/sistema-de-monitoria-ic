import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createEditalRepository } from './edital/edital-repository'
import { createImportProjectsRepository } from './import-projects/import-projects-repository'
import { InscricaoRepository } from './inscricao/inscricao-repository'
import { createScholarshipAllocationRepository } from './scholarship-allocation/scholarship-allocation-repository'

/**
 * Every repository that resolves "the periodo of this ano/semestre" must load all
 * candidates and pick the one holding the edital. Reverting any of them to an unordered
 * `findFirst` reintroduces the bug that left projeto 605 without an edital, so each
 * lookup is pinned here — the shared resolver's own tests cannot see this wiring.
 */
const PERIODOS_2026_2 = [
  { id: 12, ano: 2026, semestre: 'SEMESTRE_2', totalBolsasPrograd: 9, numeroEditalPrograd: '007/26', edital: null },
  { id: 13, ano: 2026, semestre: 'SEMESTRE_2', totalBolsasPrograd: 9, numeroEditalPrograd: null, edital: null },
  {
    id: 16,
    ano: 2026,
    semestre: 'SEMESTRE_2',
    totalBolsasPrograd: 0,
    numeroEditalPrograd: null,
    edital: { id: 13, tipo: 'DCC' },
  },
]

function makeDb() {
  const findMany = vi.fn().mockResolvedValue(PERIODOS_2026_2)
  const findFirst = vi.fn().mockResolvedValue(PERIODOS_2026_2[0])
  // biome-ignore lint/suspicious/noExplicitAny: fake db for repository unit tests
  const db = { query: { periodoInscricaoTable: { findMany, findFirst } } } as any
  return { db, findMany, findFirst }
}

const LOOKUPS: Array<{ name: string; call: (db: unknown) => Promise<unknown> }> = [
  {
    name: 'editalRepository.findPeriodoBySemestre',
    // biome-ignore lint/suspicious/noExplicitAny: fake db for repository unit tests
    call: (db) => createEditalRepository(db as any).findPeriodoBySemestre(2026, 'SEMESTRE_2'),
  },
  {
    name: 'scholarshipAllocationRepository.findPeriodo',
    // biome-ignore lint/suspicious/noExplicitAny: fake db for repository unit tests
    call: (db) => createScholarshipAllocationRepository(db as any).findPeriodo(2026, 'SEMESTRE_2'),
  },
  {
    name: 'importProjectsRepository.findPeriodoBySemestre',
    // biome-ignore lint/suspicious/noExplicitAny: fake db for repository unit tests
    call: (db) => createImportProjectsRepository(db as any).findPeriodoBySemestre(2026, 'SEMESTRE_2'),
  },
  {
    name: 'inscricaoRepository.findActivePeriodoInscricao',
    // biome-ignore lint/suspicious/noExplicitAny: fake db for repository unit tests
    call: (db) => new InscricaoRepository(db as any).findActivePeriodoInscricao(2026, 'SEMESTRE_2'),
  },
]

describe('periodo lookups by ano/semestre', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  for (const lookup of LOOKUPS) {
    describe(lookup.name, () => {
      it('returns the periodo that holds the edital, not the first row', async () => {
        const { db } = makeDb()
        // biome-ignore lint/suspicious/noExplicitAny: repository return shapes differ
        const periodo = (await lookup.call(db)) as any

        expect(periodo?.id).toBe(16)
      })

      it('loads every candidate instead of a single unordered row', async () => {
        const { db, findMany, findFirst } = makeDb()
        await lookup.call(db)

        expect(findMany).toHaveBeenCalledTimes(1)
        expect(findFirst).not.toHaveBeenCalled()
      })

      it('eager-loads the edital relation so the periodo can be ranked', async () => {
        const { db, findMany } = makeDb()
        await lookup.call(db)

        const args = findMany.mock.calls[0][0]
        expect(args.where).toBeDefined()
        expect(args.with?.edital).toBeDefined()
      })

      it('carries the PROGRAD values of the semester through', async () => {
        const { db } = makeDb()
        // biome-ignore lint/suspicious/noExplicitAny: repository return shapes differ
        const periodo = (await lookup.call(db)) as any

        expect(periodo?.totalBolsasPrograd).toBe(9)
        expect(periodo?.numeroEditalPrograd).toBe('007/26')
      })
    })
  }
})
