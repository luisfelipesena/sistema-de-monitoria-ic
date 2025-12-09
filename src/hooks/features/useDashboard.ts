import { useColumnFilters } from '@/hooks/useColumnFilters'
import { useTRPCMutation } from '@/hooks/useTRPCMutation'
import {
  PROJETO_STATUS_APPROVED,
  PROJETO_STATUS_DRAFT,
  PROJETO_STATUS_REJECTED,
  PROJETO_STATUS_SUBMITTED,
  type DashboardProjectItem,
  type UserListItem,
} from '@/types'
import { api } from '@/utils/api'
import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'

export function useDashboard() {
  const router = useRouter()
  const utils = api.useUtils()

  const { data: projetos, isLoading: loadingProjetos } = api.projeto.getProjetos.useQuery()
  const { data: users, isLoading: loadingUsers } = api.user.getUsers.useQuery({})

  const [abaAtiva, setAbaAtiva] = useState<'projetos' | 'professores' | 'alunos'>('projetos')
  const [groupedView, setGroupedView] = useState(false)

  // Column filters with current semester as default
  const { columnFilters, setColumnFilters, activeFilterCount } = useColumnFilters({
    useCurrentSemester: true,
  })

  const [deletingProjetoId, setDeletingProjetoId] = useState<number | null>(null)

  const deleteProjetoMutation = useTRPCMutation(api.projeto.deleteProjeto.useMutation, {
    successMessage: 'Projeto excluído com sucesso',
    errorMessage: 'Erro ao excluir projeto',
    onSuccess: () => {
      utils.projeto.getProjetos.invalidate()
    },
  })

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

  const handleDeleteProjeto = async (projetoId: number) => {
    setDeletingProjetoId(projetoId)
    try {
      await deleteProjetoMutation.mutateAsync({ id: projetoId })
    } finally {
      setDeletingProjetoId(null)
    }
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
          case PROJETO_STATUS_DRAFT:
            acc.draft++
            break
          case PROJETO_STATUS_SUBMITTED:
            acc.submitted++
            break
          case PROJETO_STATUS_APPROVED:
            acc.approved++
            break
          case PROJETO_STATUS_REJECTED:
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
    groupedView,
    setGroupedView,

    // Column filters
    columnFilters,
    setColumnFilters,
    activeFilterCount,

    // Data
    projetos: actualProjetos,
    users: actualUsers,
    professores,
    alunos,
    statusCounts,

    // Loading
    loadingProjetos,
    loadingUsers,
    deletingProjetoId,

    // Handlers
    handleGenerateEditalInterno,
    handleManageProjectsClick,
    handleAnalisarProjeto,
    handleEditarUsuario,
    handleDeleteProjeto,
  }
}
