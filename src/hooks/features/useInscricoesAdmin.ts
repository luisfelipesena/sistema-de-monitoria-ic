import { useMemo } from 'react'
import { useUrlColumnFilters } from '@/hooks/useUrlColumnFilters'
import { api } from '@/utils/api'

export function useInscricoesAdmin() {
  const { columnFilters, setColumnFilters } = useUrlColumnFilters({
    useCurrentSemester: true,
  })

  // Extract filter values from column filters
  const filters = useMemo(() => {
    const ano = columnFilters.find((f) => f.id === 'ano')?.value as number | undefined
    const semestre = columnFilters.find((f) => f.id === 'semestre')?.value as 'SEMESTRE_1' | 'SEMESTRE_2' | undefined
    const status = columnFilters.find((f) => f.id === 'status')?.value as string | undefined
    const departamentoId = columnFilters.find((f) => f.id === 'departamentoId')?.value as number | undefined

    return {
      ano,
      semestre,
      status: status as
        | 'SUBMITTED'
        | 'SELECTED_BOLSISTA'
        | 'SELECTED_VOLUNTARIO'
        | 'REJECTED_BY_PROFESSOR'
        | 'ACCEPTED_BOLSISTA'
        | 'ACCEPTED_VOLUNTARIO'
        | undefined,
      departamentoId,
    }
  }, [columnFilters])

  const { data: inscricoes, isLoading } = api.inscricao.getAllForAdmin.useQuery(filters)

  // Calculate stats
  const stats = useMemo(() => {
    if (!inscricoes) return { total: 0, submitted: 0, selected: 0, rejected: 0 }

    return {
      total: inscricoes.length,
      submitted: inscricoes.filter((i) => i.status === 'SUBMITTED').length,
      selected: inscricoes.filter((i) => i.status?.startsWith('SELECTED_') || i.status?.startsWith('ACCEPTED_')).length,
      rejected: inscricoes.filter((i) => i.status?.startsWith('REJECTED_')).length,
    }
  }, [inscricoes])

  return {
    inscricoes: inscricoes ?? [],
    isLoading,
    stats,
    columnFilters,
    setColumnFilters,
  }
}
