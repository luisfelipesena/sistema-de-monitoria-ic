import { useMemo } from 'react'
import { useUrlColumnFilters } from '@/hooks/useUrlColumnFilters'
import { api } from '@/utils/api'

export function useAtasAdmin() {
  const { columnFilters, setColumnFilters } = useUrlColumnFilters({
    useCurrentSemester: true,
  })

  // Extract filter values from column filters
  const filters = useMemo(() => {
    const ano = columnFilters.find((f) => f.id === 'ano')?.value as number | undefined
    const semestre = columnFilters.find((f) => f.id === 'semestre')?.value as 'SEMESTRE_1' | 'SEMESTRE_2' | undefined
    const departamentoId = columnFilters.find((f) => f.id === 'departamentoId')?.value as number | undefined
    const status = columnFilters.find((f) => f.id === 'status')?.value as 'DRAFT' | 'SIGNED' | undefined

    return { ano, semestre, departamentoId, status }
  }, [columnFilters])

  const { data: atas, isLoading } = api.selecao.getAllAtasForAdmin.useQuery(filters)

  // Calculate stats
  const stats = useMemo(() => {
    if (!atas) return { total: 0, rascunho: 0, assinado: 0 }

    return {
      total: atas.length,
      rascunho: atas.filter((a) => a.status === 'RASCUNHO').length,
      assinado: atas.filter((a) => a.status === 'ASSINADO').length,
    }
  }, [atas])

  return {
    atas: atas ?? [],
    isLoading,
    stats,
    columnFilters,
    setColumnFilters,
  }
}
