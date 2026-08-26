export interface SortableCandidate {
  notaFinal?: number | string | null
  notaDisciplina?: number | string | null
  notaSelecao?: number | string | null
  coeficienteRendimento?: number | string | null
  aluno?: {
    cr?: number | string | null
    nomeCompleto?: string | null
  } | null
}

/**
 * Compare candidates using official ranking rules:
 * 1. Nota Final (descending)
 * 2. Nota da Disciplina (descending tie-breaker)
 * 3. Coeficiente de Rendimento / CR (descending tie-breaker)
 */
export function compareCandidates<T extends SortableCandidate>(a: T, b: T): number {
  const notaFinalA = a.notaFinal !== null && a.notaFinal !== undefined ? Number(a.notaFinal) : 0
  const notaFinalB = b.notaFinal !== null && b.notaFinal !== undefined ? Number(b.notaFinal) : 0
  if (Math.abs(notaFinalB - notaFinalA) > 0.0001) {
    return notaFinalB - notaFinalA
  }

  const notaDiscA = a.notaDisciplina !== null && a.notaDisciplina !== undefined ? Number(a.notaDisciplina) : 0
  const notaDiscB = b.notaDisciplina !== null && b.notaDisciplina !== undefined ? Number(b.notaDisciplina) : 0
  if (Math.abs(notaDiscB - notaDiscA) > 0.0001) {
    return notaDiscB - notaDiscA
  }

  const crA =
    a.coeficienteRendimento !== null && a.coeficienteRendimento !== undefined
      ? Number(a.coeficienteRendimento)
      : a.aluno?.cr !== null && a.aluno?.cr !== undefined
        ? Number(a.aluno.cr)
        : 0
  const crB =
    b.coeficienteRendimento !== null && b.coeficienteRendimento !== undefined
      ? Number(b.coeficienteRendimento)
      : b.aluno?.cr !== null && b.aluno?.cr !== undefined
        ? Number(b.aluno.cr)
        : 0

  return crB - crA
}
