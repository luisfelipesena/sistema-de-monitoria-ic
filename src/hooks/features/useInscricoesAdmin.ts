import { useServerPagination } from '@/hooks/useServerPagination'
import { api } from '@/utils/api'

export function useInscricoesAdmin() {
  const { page, pageSize, setPage, setPageSize, columnFilters, setColumnFilters, apiFilters } = useServerPagination({
    useCurrentSemester: false,
    defaultPageSize: 20,
  })

  // Build query input from apiFilters
  const queryInput = {
    ano: apiFilters.ano?.[0],
    semestre: apiFilters.semestre?.[0] as 'SEMESTRE_1' | 'SEMESTRE_2' | undefined,
    departamentoId: apiFilters.departamentoId?.[0],
    status: apiFilters.status?.[0] as
      | 'SUBMITTED'
      | 'SELECTED_BOLSISTA'
      | 'SELECTED_VOLUNTARIO'
      | 'REJECTED_BY_PROFESSOR'
      | 'ACCEPTED_BOLSISTA'
      | 'ACCEPTED_VOLUNTARIO'
      | undefined,
    limit: apiFilters.limit,
    offset: apiFilters.offset,
  }

  const { data, isLoading } = api.inscricao.getAllForAdmin.useQuery(queryInput)

  return {
    inscricoes: data?.items ?? [],
    isLoading,
    stats: data?.stats ?? { total: 0, submitted: 0, selected: 0, rejected: 0 },
    total: data?.total ?? 0,
    columnFilters,
    setColumnFilters,
    // Pagination
    page,
    pageSize,
    setPage,
    setPageSize,
  }
}
