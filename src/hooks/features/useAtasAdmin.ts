import { useServerPagination } from '@/hooks/useServerPagination'
import { api } from '@/utils/api'

export function useAtasAdmin() {
  const {
    page,
    pageSize,
    setPage,
    setPageSize,
    columnFilters,
    setColumnFilters,
    apiFilters,
  } = useServerPagination({
    useCurrentSemester: true,
    defaultPageSize: 20,
  })

  // Build query input from apiFilters
  const queryInput = {
    ano: apiFilters.ano?.[0],
    semestre: apiFilters.semestre?.[0] as 'SEMESTRE_1' | 'SEMESTRE_2' | undefined,
    departamentoId: apiFilters.departamentoId?.[0],
    status: apiFilters.status?.[0] as 'DRAFT' | 'SIGNED' | undefined,
    limit: apiFilters.limit,
    offset: apiFilters.offset,
  }

  const { data, isLoading } = api.selecao.getAllAtasForAdmin.useQuery(queryInput)

  return {
    atas: data?.items ?? [],
    isLoading,
    stats: data?.stats ?? { total: 0, rascunho: 0, assinado: 0 },
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
