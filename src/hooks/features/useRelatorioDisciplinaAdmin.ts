import { useMemo } from 'react'
import { useUrlColumnFilters } from '@/hooks/useUrlColumnFilters'
import { api } from '@/utils/api'

export function useRelatorioDisciplinaAdmin() {
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

  const { data: relatorios, isLoading } = api.relatoriosFinais.listAllDisciplinaReportsForAdmin.useQuery(filters)

  // Calculate stats
  const stats = useMemo(() => {
    if (!relatorios) return { total: 0, pendente: 0, draft: 0, submitted: 0 }

    return {
      total: relatorios.length,
      pendente: relatorios.filter((r) => r.status === 'NOT_CREATED').length,
      draft: relatorios.filter((r) => r.status === 'DRAFT').length,
      submitted: relatorios.filter((r) => r.status === 'SUBMITTED' || r.status === 'APPROVED').length,
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
