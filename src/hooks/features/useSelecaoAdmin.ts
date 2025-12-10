import { useMemo } from 'react'
import { useUrlColumnFilters } from '@/hooks/useUrlColumnFilters'
import { api } from '@/utils/api'

export function useSelecaoAdmin() {
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

  const { data: projetos, isLoading } = api.selecao.getAllProjectsWithSelectionStatus.useQuery(filters)

  // Calculate stats
  const stats = useMemo(() => {
    if (!projetos) return { total: 0, pendente: 0, emSelecao: 0, assinado: 0 }

    return {
      total: projetos.length,
      pendente: projetos.filter((p) => p.selecaoStatus === 'PENDENTE').length,
      emSelecao: projetos.filter((p) => p.selecaoStatus === 'EM_SELECAO' || p.selecaoStatus === 'RASCUNHO').length,
      assinado: projetos.filter((p) => p.selecaoStatus === 'ASSINADO').length,
    }
  }, [projetos])

  return {
    projetos: projetos ?? [],
    isLoading,
    stats,
    columnFilters,
    setColumnFilters,
  }
}
