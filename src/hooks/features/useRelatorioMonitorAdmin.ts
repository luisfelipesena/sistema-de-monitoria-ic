import { useMemo } from 'react'
import { useUrlColumnFilters } from '@/hooks/useUrlColumnFilters'
import { api } from '@/utils/api'

export function useRelatorioMonitorAdmin() {
  const { columnFilters, setColumnFilters } = useUrlColumnFilters({
    useCurrentSemester: true,
  })

  // Extract filter values from column filters
  const filters = useMemo(() => {
    const ano = columnFilters.find((f) => f.id === 'ano')?.value as number | undefined
    const semestre = columnFilters.find((f) => f.id === 'semestre')?.value as 'SEMESTRE_1' | 'SEMESTRE_2' | undefined
    const departamentoId = columnFilters.find((f) => f.id === 'departamentoId')?.value as number | undefined

    return { ano, semestre, departamentoId }
  }, [columnFilters])

  const { data: relatorios, isLoading } = api.relatoriosFinais.listAllMonitorReportsForAdmin.useQuery(filters)

  // Calculate stats
  const stats = useMemo(() => {
    if (!relatorios) return { total: 0, draft: 0, pendingStudent: 0, complete: 0 }

    return {
      total: relatorios.length,
      draft: relatorios.filter((r) => r.status === 'DRAFT').length,
      pendingStudent: relatorios.filter((r) => r.status === 'SUBMITTED' && !r.alunoAssinouEm).length,
      complete: relatorios.filter((r) => r.alunoAssinouEm && r.professorAssinouEm).length,
    }
  }, [relatorios])

  return {
    relatorios: relatorios ?? [],
    isLoading,
    stats,
    columnFilters,
    setColumnFilters,
  }
}
