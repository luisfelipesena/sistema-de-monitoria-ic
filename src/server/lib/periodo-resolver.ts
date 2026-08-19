import type { Semestre, TipoEdital } from '@/types'
import { TIPO_EDITAL_DCC } from '@/types'

/**
 * A (ano, semestre) pair legitimately maps to more than one `periodo_inscricao`:
 * `createEdital` inserts a fresh periodo per edital and only rejects overlapping
 * date ranges, so DCC and DCI editais (and any re-published edital) each add a row.
 *
 * Resolving the periodo with an unordered `findFirst` therefore returns an arbitrary
 * one — in practice the oldest, which usually carries no edital — and every caller
 * concludes the semester has no edital. That is how projeto 605 was approved with
 * `edital_interno_id = NULL` while the other 30 projects of 2026.2 pointed at edital 13.
 */

export interface PeriodoCandidate {
  id: number
  totalBolsasPrograd?: number | null
  numeroEditalPrograd?: string | null
  edital?: { tipo?: TipoEdital | null } | null
}

export interface PeriodoLookup {
  ano: number
  semestre: Semestre
}

/**
 * Ranks a periodo for "which one represents this ano/semestre".
 * Lower is better: DCC edital, then any edital, then no edital at all.
 * Projects are linked to the DCC edital (see `linkApprovedProjectsToEdital`).
 */
function rankPeriodo(periodo: PeriodoCandidate): number {
  if (!periodo.edital) return 2
  return periodo.edital.tipo === TIPO_EDITAL_DCC ? 0 : 1
}

/**
 * Deterministically picks the periodo that represents an ano/semestre.
 * Prefers the one carrying the DCC edital, then any edital, then the newest row.
 */
export function pickPeriodoForSemestre<T extends PeriodoCandidate>(periodos: T[]): T | undefined {
  return periodos.reduce<T | undefined>((best, candidate) => {
    if (!best) return candidate
    const bestRank = rankPeriodo(best)
    const candidateRank = rankPeriodo(candidate)
    if (candidateRank !== bestRank) return candidateRank < bestRank ? candidate : best
    return candidate.id > best.id ? candidate : best
  }, undefined)
}

/**
 * Resolves the periodo of an ano/semestre, reading the PROGRAD fields across its siblings.
 *
 * `totalBolsasPrograd` and `numeroEditalPrograd` describe the whole semester but are stored
 * on a single row — whichever periodo was current when an admin typed them. Every periodo
 * `createEdital` inserts starts at 0/null, so the row carrying the edital is rarely the row
 * carrying the PROGRAD numbers. Without this fallback, resolving to the edital's periodo
 * would report the semester as having no PROGRAD scholarships and no PROGRAD edital number.
 *
 * The resolved `id` is always the winner's, so writes still land on the row that owns the edital.
 */
export function resolvePeriodoForSemestre<T extends PeriodoCandidate>(periodos: T[]): T | undefined {
  const winner = pickPeriodoForSemestre(periodos)
  if (!winner) return undefined

  const byPreference = [winner, ...periodos.filter((p) => p.id !== winner.id).sort((a, b) => b.id - a.id)]
  const totalBolsasPrograd = byPreference.find((p) => (p.totalBolsasPrograd ?? 0) > 0)?.totalBolsasPrograd
  const numeroEditalPrograd = byPreference.find((p) => p.numeroEditalPrograd)?.numeroEditalPrograd

  return {
    ...winner,
    ...(totalBolsasPrograd !== undefined && { totalBolsasPrograd }),
    ...(numeroEditalPrograd !== undefined && { numeroEditalPrograd }),
  }
}
