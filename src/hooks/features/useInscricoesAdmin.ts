import { useToast } from '@/hooks/use-toast'
import { useServerPagination } from '@/hooks/useServerPagination'
import { api } from '@/utils/api'
import { useQueryClient } from '@tanstack/react-query'

import type { StatusInscricao, TipoInscricao } from '@/types'

export function useInscricoesAdmin() {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const { page, pageSize, setPage, setPageSize, columnFilters, setColumnFilters, apiFilters } = useServerPagination({
    useCurrentSemester: false,
    defaultPageSize: 20,
  })

  // Build query input from apiFilters
  const queryInput = {
    ano: apiFilters.ano?.[0],
    semestre: apiFilters.semestre?.[0] as 'SEMESTRE_1' | 'SEMESTRE_2' | undefined,
    departamentoId: apiFilters.departamentoId?.[0],
    status: apiFilters.status as StatusInscricao[] | StatusInscricao | undefined,
    tipoVagaPretendida: apiFilters.tipoVagaPretendida as ('BOLSISTA' | 'VOLUNTARIO')[] | ('BOLSISTA' | 'VOLUNTARIO') | undefined,
    alunoNome: apiFilters.alunoNome,
    projetoTitulo: apiFilters.projetoTitulo,
    professorNome: apiFilters.professorNome || apiFilters.professorResponsavel,
    limit: apiFilters.limit,
    offset: apiFilters.offset,
  }

  const { data, isLoading } = api.inscricao.getAllForAdmin.useQuery(queryInput)

  const deleteInscricaoMutation = api.inscricao.deleteInscricao.useMutation({
    onSuccess: () => {
      toast({
        title: 'Sucesso!',
        description: 'Inscrição removida com sucesso.',
      })
      queryClient.invalidateQueries()
    },
    onError: (error) => {
      toast({
        title: 'Erro',
        description: `Erro ao remover inscrição: ${error.message}`,
        variant: 'destructive',
      })
    },
  })

  return {
    inscricoes: data?.items ?? [],
    isLoading,
    stats: data?.stats ?? { total: 0, submitted: 0, selected: 0, rejected: 0 },
    total: data?.total ?? 0,
    columnFilters,
    setColumnFilters,
    deleteInscricao: (id: number) => deleteInscricaoMutation.mutateAsync({ id }),
    isDeleting: deleteInscricaoMutation.isPending,
    // Pagination
    page,
    pageSize,
    setPage,
    setPageSize,
  }
}
