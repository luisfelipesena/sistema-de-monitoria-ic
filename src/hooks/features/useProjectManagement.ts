import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/hooks/use-toast'
import { useDialogState } from '@/hooks/useDialogState'
import { useColumnFilters } from '@/hooks/useColumnFilters'
import { api } from '@/utils/api'
import { useQueryClient } from '@tanstack/react-query'
import type { ManageProjectItem } from '@/types'
import {
  PROJETO_STATUS_DRAFT,
  PROJETO_STATUS_SUBMITTED,
  PROJETO_STATUS_APPROVED,
  PROJETO_STATUS_REJECTED,
} from '@/types'

export function useProjectManagement() {
  const { toast } = useToast()
  const router = useRouter()
  const queryClient = useQueryClient()

  const [groupedView, setGroupedView] = useState(false)
  const [rejectFeedback, setRejectFeedback] = useState('')
  const [loadingPdfProjetoId, setLoadingPdfProjetoId] = useState<number | null>(null)

  // Column filters with current semester as default
  const { columnFilters, setColumnFilters } = useColumnFilters({
    useCurrentSemester: true,
  })

  const previewDialog = useDialogState<ManageProjectItem>()
  const rejectDialog = useDialogState<ManageProjectItem>()
  const deleteDialog = useDialogState<ManageProjectItem>()
  const filesDialog = useDialogState<ManageProjectItem>()

  const { data: projetos, isLoading: loadingProjetos } = api.projeto.getProjetos.useQuery()

  const approveProjectMutation = api.projeto.approveProjeto.useMutation({
    onSuccess: () => {
      toast({
        title: 'Sucesso!',
        description: 'Projeto aprovado! Agora pendente de assinatura administrativa.',
      })
      queryClient.invalidateQueries()
      previewDialog.close()
    },
    onError: (error) => {
      toast({
        title: 'Erro',
        description: `Erro ao aprovar projeto: ${error.message}`,
        variant: 'destructive',
      })
    },
  })

  const rejectProjectMutation = api.projeto.rejectProjeto.useMutation({
    onSuccess: () => {
      toast({
        title: 'Sucesso!',
        description: 'Projeto rejeitado!',
      })
      queryClient.invalidateQueries()
      rejectDialog.close()
      setRejectFeedback('')
    },
    onError: (error) => {
      toast({
        title: 'Erro',
        description: `Erro ao rejeitar projeto: ${error.message}`,
        variant: 'destructive',
      })
    },
  })

  const deleteProjectMutation = api.projeto.deleteProjeto.useMutation({
    onSuccess: () => {
      toast({
        title: 'Sucesso!',
        description: 'Projeto removido com sucesso!',
      })
      queryClient.invalidateQueries()
      deleteDialog.close()
    },
    onError: (error) => {
      toast({
        title: 'Erro',
        description: `Erro ao remover projeto: ${error.message}`,
        variant: 'destructive',
      })
    },
  })

  const getProjetoPdfMutation = api.file.getProjetoPdfUrl.useMutation()
  const getAdminFilePresignedUrlMutation = api.file.getAdminFilePresignedUrl.useMutation()

  const { data: projectFiles, isLoading: loadingProjectFiles } = api.file.getProjetoFiles.useQuery(
    { projetoId: filesDialog.data?.id || 0 },
    { enabled: filesDialog.isOpen && !!filesDialog.data?.id }
  )

  // Sort projetos by createdAt descending
  const sortedProjetos = useMemo(() => {
    if (!projetos) return []
    return [...projetos].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }, [projetos])

  const statusCounts = useMemo(() => {
    if (!sortedProjetos)
      return {
        draft: 0,
        submitted: 0,
        approved: 0,
        rejected: 0,
      }

    return sortedProjetos.reduce(
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
      { draft: 0, submitted: 0, approved: 0, rejected: 0 }
    )
  }, [sortedProjetos])

  const handleViewProjectPDF = async (projetoId: number) => {
    setLoadingPdfProjetoId(projetoId)
    try {
      toast({
        title: 'Preparando visualização...',
        description: 'Preparando visualização do PDF...',
      })

      const result = await getProjetoPdfMutation.mutateAsync({ projetoId })
      window.open(result.url, '_blank')

      toast({
        title: 'Sucesso!',
        description: 'PDF aberto em nova aba',
      })
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível abrir o documento para visualização.',
        variant: 'destructive',
      })
      console.error('View PDF error:', error)
    } finally {
      setLoadingPdfProjetoId(null)
    }
  }

  const handleDownloadFile = async (objectName: string) => {
    try {
      const presignedUrl = await getAdminFilePresignedUrlMutation.mutateAsync({ objectName })

      const link = document.createElement('a')
      link.href = presignedUrl.url
      link.download = objectName.split('/').pop() || 'file'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast({
        title: 'Sucesso!',
        description: 'Download iniciado',
      })
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao baixar arquivo',
        variant: 'destructive',
      })
      console.error('Download error:', error)
    }
  }

  const handleApproveProject = async () => {
    if (!previewDialog.data) return

    try {
      await approveProjectMutation.mutateAsync({
        id: previewDialog.data.id,
        feedbackAdmin: 'Projeto aprovado pela administração.',
      })
    } catch (error) {
      console.error('Approve project error:', error)
    }
  }

  const handleRejectProject = async () => {
    if (!rejectDialog.data) return

    try {
      await rejectProjectMutation.mutateAsync({
        id: rejectDialog.data.id,
        feedbackAdmin: rejectFeedback || 'Projeto rejeitado pela administração.',
      })
    } catch (error) {
      console.error('Reject project error:', error)
    }
  }

  const handleDeleteProject = async () => {
    if (!deleteDialog.data) return

    try {
      await deleteProjectMutation.mutateAsync({
        id: deleteDialog.data.id,
      })
    } catch (error) {
      console.error('Delete project error:', error)
    }
  }

  const handleOpenRejectDialog = (projeto: ManageProjectItem) => {
    previewDialog.close()
    rejectDialog.open(projeto)
  }

  const handleGoToDocumentSigning = () => {
    router.push('/home/admin/assinatura-documentos')
  }

  return {
    projetos: sortedProjetos,
    loadingProjetos,
    statusCounts,
    columnFilters,
    setColumnFilters,
    groupedView,
    setGroupedView,
    rejectFeedback,
    setRejectFeedback,
    loadingPdfProjetoId,
    previewDialog,
    rejectDialog,
    deleteDialog,
    filesDialog,
    projectFiles,
    loadingProjectFiles,
    handleViewProjectPDF,
    handleDownloadFile,
    handleApproveProject,
    handleRejectProject,
    handleDeleteProject,
    handleOpenRejectDialog,
    handleGoToDocumentSigning,
    isApproving: approveProjectMutation.isPending,
    isRejecting: rejectProjectMutation.isPending,
    isDeleting: deleteProjectMutation.isPending,
  }
}
