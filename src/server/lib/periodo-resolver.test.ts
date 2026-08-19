import { describe, expect, it } from 'vitest'
import { type PeriodoCandidate, pickPeriodoForSemestre, resolvePeriodoForSemestre } from './periodo-resolver'

/**
 * Shape of production data on 2026-08-19: three periodos for (2026, SEMESTRE_2),
 * only the newest carrying edital 13 (DCC). The unordered `findFirst` this replaces
 * returned periodo 12, so projeto 605 was approved with `edital_interno_id = NULL`.
 */
const PROD_2026_2: PeriodoCandidate[] = [
  { id: 12, edital: null },
  { id: 13, edital: null },
  { id: 16, edital: { tipo: 'DCC' } },
]

describe('pickPeriodoForSemestre', () => {
  it('picks the periodo carrying the edital, not the first row', () => {
    expect(pickPeriodoForSemestre(PROD_2026_2)?.id).toBe(16)
  })

  it('picks the periodo carrying the edital regardless of row order', () => {
    const reversed = [...PROD_2026_2].reverse()
    expect(pickPeriodoForSemestre(reversed)?.id).toBe(16)

    const editalFirst = [PROD_2026_2[2], PROD_2026_2[0], PROD_2026_2[1]]
    expect(pickPeriodoForSemestre(editalFirst)?.id).toBe(16)
  })

  it('prefers the DCC edital over the DCI one', () => {
    const periodos: PeriodoCandidate[] = [
      { id: 20, edital: { tipo: 'DCI' } },
      { id: 21, edital: { tipo: 'DCC' } },
    ]
    expect(pickPeriodoForSemestre(periodos)?.id).toBe(21)
  })

  it('prefers the DCC edital even when the DCI periodo is newer', () => {
    const periodos: PeriodoCandidate[] = [
      { id: 30, edital: { tipo: 'DCC' } },
      { id: 31, edital: { tipo: 'DCI' } },
    ]
    expect(pickPeriodoForSemestre(periodos)?.id).toBe(30)
  })

  it('falls back to the newest periodo when none has an edital', () => {
    const periodos: PeriodoCandidate[] = [{ id: 2, edital: null }, { id: 7 }]
    expect(pickPeriodoForSemestre(periodos)?.id).toBe(7)
  })

  it('breaks ties between two DCC editais by the newest periodo', () => {
    const periodos: PeriodoCandidate[] = [
      { id: 40, edital: { tipo: 'DCC' } },
      { id: 41, edital: { tipo: 'DCC' } },
    ]
    expect(pickPeriodoForSemestre(periodos)?.id).toBe(41)
  })

  it('treats an edital with no tipo as a non-DCC edital, still above no edital', () => {
    const periodos: PeriodoCandidate[] = [
      { id: 50, edital: { tipo: null } },
      { id: 51, edital: null },
    ]
    expect(pickPeriodoForSemestre(periodos)?.id).toBe(50)
  })

  it('returns the single periodo when there is no ambiguity', () => {
    expect(pickPeriodoForSemestre([{ id: 9, edital: { tipo: 'DCC' } }])?.id).toBe(9)
  })

  it('returns undefined when the semester has no periodo at all', () => {
    expect(pickPeriodoForSemestre([])).toBeUndefined()
  })

  it('does not mutate the input array', () => {
    const periodos = [...PROD_2026_2]
    pickPeriodoForSemestre(periodos)
    expect(periodos.map((p) => p.id)).toEqual([12, 13, 16])
  })
})

/**
 * `total_bolsas_prograd` and `numero_edital_prograd` describe the semester but live on a
 * single row. Prod on 2026-08-19: periodo 12 holds 9 bolsas and '007/26', periodo 16 holds
 * the edital and 0/null. Resolving to 16 without this fallback reports the semester as
 * having no PROGRAD scholarships, which throws MISSING_PROGRAD_LIMIT on every allocation.
 */
const PROD_2026_2_PROGRAD: PeriodoCandidate[] = [
  { id: 12, totalBolsasPrograd: 9, numeroEditalPrograd: '007/26', edital: null },
  { id: 13, totalBolsasPrograd: 9, numeroEditalPrograd: null, edital: null },
  { id: 16, totalBolsasPrograd: 0, numeroEditalPrograd: null, edital: { tipo: 'DCC' } },
]

describe('resolvePeriodoForSemestre', () => {
  it('keeps the id of the periodo that holds the edital', () => {
    expect(resolvePeriodoForSemestre(PROD_2026_2_PROGRAD)?.id).toBe(16)
  })

  it('reads totalBolsasPrograd from a sibling when the resolved periodo has none', () => {
    expect(resolvePeriodoForSemestre(PROD_2026_2_PROGRAD)?.totalBolsasPrograd).toBe(9)
  })

  it('reads numeroEditalPrograd from a sibling when the resolved periodo has none', () => {
    expect(resolvePeriodoForSemestre(PROD_2026_2_PROGRAD)?.numeroEditalPrograd).toBe('007/26')
  })

  it("prefers the resolved periodo's own PROGRAD values over its siblings'", () => {
    const periodos: PeriodoCandidate[] = [
      { id: 12, totalBolsasPrograd: 9, numeroEditalPrograd: '007/26', edital: null },
      { id: 16, totalBolsasPrograd: 4, numeroEditalPrograd: '009/26', edital: { tipo: 'DCC' } },
    ]
    const resolved = resolvePeriodoForSemestre(periodos)
    expect(resolved?.totalBolsasPrograd).toBe(4)
    expect(resolved?.numeroEditalPrograd).toBe('009/26')
  })

  it('falls back to the newest sibling that has a value', () => {
    const periodos: PeriodoCandidate[] = [
      { id: 2, totalBolsasPrograd: 30, edital: null },
      { id: 7, totalBolsasPrograd: 12, edital: null },
      { id: 8, totalBolsasPrograd: 0, edital: { tipo: 'DCC' } },
    ]
    expect(resolvePeriodoForSemestre(periodos)?.totalBolsasPrograd).toBe(12)
  })

  it('leaves the PROGRAD fields untouched when no periodo of the semester has them', () => {
    const periodos: PeriodoCandidate[] = [
      { id: 12, totalBolsasPrograd: 0, numeroEditalPrograd: null, edital: null },
      { id: 16, totalBolsasPrograd: 0, numeroEditalPrograd: null, edital: { tipo: 'DCC' } },
    ]
    const resolved = resolvePeriodoForSemestre(periodos)
    expect(resolved?.totalBolsasPrograd).toBe(0)
    expect(resolved?.numeroEditalPrograd).toBeNull()
  })

  it('carries every other column of the resolved periodo through untouched', () => {
    const periodos = [
      { id: 12, ano: 2026, semestre: 'SEMESTRE_2', dataFim: 'x', totalBolsasPrograd: 9, edital: null },
      {
        id: 16,
        ano: 2026,
        semestre: 'SEMESTRE_2',
        dataFim: 'y',
        totalBolsasPrograd: 0,
        edital: { tipo: 'DCC' as const },
      },
    ]
    expect(resolvePeriodoForSemestre(periodos)).toMatchObject({ id: 16, dataFim: 'y', totalBolsasPrograd: 9 })
  })

  it('returns undefined when the semester has no periodo', () => {
    expect(resolvePeriodoForSemestre([])).toBeUndefined()
  })

  it('does not mutate the input periodos', () => {
    const periodos = PROD_2026_2_PROGRAD.map((p) => ({ ...p }))
    resolvePeriodoForSemestre(periodos)
    expect(periodos.map((p) => p.id)).toEqual([12, 13, 16])
    expect(periodos[2].totalBolsasPrograd).toBe(0)
  })
})
