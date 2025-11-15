import { useTRPCMutation } from '@/hooks/useTRPCMutation'
import { api } from '@/utils/api'
import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import type { FilterValues } from '@/components/ui/FilterModal'
import type { DashboardProjectItem, UserListItem } from '@/types'

export function useDashboard() {
  const router = useRouter()

  const { data: projetos, isLoading: loadingProjetos } = api.projeto.getProjetos.useQuery()
  const { data: users, isLoading: loadingUsers } = api.user.getUsers.useQuery({})

  const [abaAtiva, setAbaAtiva] = useState<'projetos' | 'professores' | 'alunos'>('projetos')
  const [filterModalOpen, setFilterModalOpen] = useState(false)
  const [filters, setFilters] = useState<FilterValues>({})
  const [groupedView, setGroupedView] = useState(false)
  const [loadingPdfProjetoId, setLoadingPdfProjetoId] = useState<number | null>(null)

  const activeFilters = Object.values(filters).filter((v) => v !== undefined && v !== '').length

  const getProjetoPdfMutation = useTRPCMutation(api.file.getProjetoPdfUrl.useMutation, {
    successMessage: 'PDF aberto em nova aba',
    errorMessage: 'Não foi possível abrir o documento para visualização.',
  })

  const handleViewPdf = async (projetoId: number) => {
    setLoadingPdfProjetoId(projetoId)
    try {
      const result = (await getProjetoPdfMutation.mutateAsync({ projetoId })) as { url: string }
      window.open(result.url, '_blank')
    } finally {
      setLoadingPdfProjetoId(null)
    }
  }

  const handleGenerateEditalInterno = () => {
    router.push('/home/admin/edital-management')
  }

  const handleManageProjectsClick = () => {
    router.push('/home/admin/manage-projects')
  }

  const handleAnalisarProjeto = (projetoId: number) => {
    router.push(`/home/admin/manage-projects?projeto=${projetoId}`)
  }

  const handleEditarUsuario = (_userId: number, tipo: 'professor' | 'aluno') => {
    if (tipo === 'professor') {
      router.push('/home/admin/professores')
    } else {
      router.push('/home/admin/alunos')
    }
  }

  const handleApplyFilters = (newFilters: FilterValues) => {
    setFilters(newFilters)
  }

  const actualProjetos = useMemo(
    () =>
      (projetos || []).map((projeto) => ({
        ...projeto,
        bolsasDisponibilizadas: projeto.bolsasDisponibilizadas ?? null,
      })) as DashboardProjectItem[],
    [projetos]
  )

  const actualUsers = useMemo(() => users?.users || [], [users])

  const professores = useMemo(
    () => actualUsers.filter((user) => user.role === 'professor') as UserListItem[],
    [actualUsers]
  )

  const alunos = useMemo(() => actualUsers.filter((user) => user.role === 'student') as UserListItem[], [actualUsers])

  const statusCounts = useMemo(() => {
    if (!actualProjetos)
      return {
        draft: 0,
        submitted: 0,
        approved: 0,
        rejected: 0,
      }

    return actualProjetos.reduce(
      (acc, projeto) => {
        switch (projeto.status) {
          case 'DRAFT':
            acc.draft++
            break
          case 'SUBMITTED':
            acc.submitted++
            break
          case 'APPROVED':
            acc.approved++
            break
          case 'REJECTED':
            acc.rejected++
            break
        }
        return acc
      },
      {
        draft: 0,
        submitted: 0,
        approved: 0,
        rejected: 0,
      }
    )
  }, [actualProjetos])

  return {
    // State
    abaAtiva,
    setAbaAtiva,
    filterModalOpen,
    setFilterModalOpen,
    filters,
    groupedView,
    setGroupedView,
    loadingPdfProjetoId,
    activeFilters,

    // Data
    projetos: actualProjetos,
    users: actualUsers,
    professores,
    alunos,
    statusCounts,

    // Loading
    loadingProjetos,
    loadingUsers,

    // Handlers
    handleViewPdf,
    handleGenerateEditalInterno,
    handleManageProjectsClick,
    handleAnalisarProjeto,
    handleEditarUsuario,
    handleApplyFilters,
  }
}
