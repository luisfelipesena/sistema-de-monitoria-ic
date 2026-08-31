import { useToast } from '@/hooks/use-toast'
import type { MonitorProject, SelectionState } from '@/types/monitor-selection'
import { api } from '@/utils/api'
import { useCallback, useState } from 'react'

export function useMonitorSelection() {
  const { toast } = useToast()
  const [selectedCandidates, setSelectedCandidates] = useState<SelectionState>({
    bolsistas: [],
    voluntarios: [],
  })
  const [feedback, setFeedback] = useState('')

  const { data: projetos = [], isLoading, refetch } = api.selecao.getProfessorProjectsWithCandidates.useQuery()

  const selectMonitorsMutation = api.selecao.selectMonitors.useMutation({
    onSuccess: (result) => {
      toast({
        title: 'Sucesso!',
        description: result.message,
      })
      resetSelection()
      refetch()
    },
    onError: (error) => {
      toast({
        title: 'Erro',
        description: error.message,
        variant: 'destructive',
      })
    },
  })

  const publishResultsMutation = api.selecao.publishResults.useMutation({
    onSuccess: (result) => {
      toast({
        title: 'Resultados Publicados!',
        description: result.message,
      })
    },
    onError: (error) => {
      toast({
        title: 'Erro ao Publicar',
        description: error.message,
        variant: 'destructive',
      })
    },
  })

  const handleSelectCandidate = useCallback(
    (inscricaoId: number, tipo: 'bolsista' | 'voluntario', project: MonitorProject) => {
      setSelectedCandidates((prev) => {
        if (tipo === 'bolsista') {
          const isSelected = prev.bolsistas.includes(inscricaoId)
          const maxBolsistas = project.bolsasDisponibilizadas || 0

          if (isSelected) {
            return {
              ...prev,
              bolsistas: prev.bolsistas.filter((id) => id !== inscricaoId),
            }
          }
          if (prev.bolsistas.length < maxBolsistas) {
            return {
              ...prev,
              bolsistas: [...prev.bolsistas, inscricaoId],
            }
          }
          return prev
        }
        const isSelected = prev.voluntarios.includes(inscricaoId)

        if (isSelected) {
          return {
            ...prev,
            voluntarios: prev.voluntarios.filter((id) => id !== inscricaoId),
          }
        }
        return {
          ...prev,
          voluntarios: [...prev.voluntarios, inscricaoId],
        }
      })
    },
    []
  )

  const handleSubmitSelection = useCallback(
    (projetoId: number, motivoTroca?: string) => {
      selectMonitorsMutation.mutate({
        projetoId,
        bolsistas: selectedCandidates.bolsistas,
        voluntarios: selectedCandidates.voluntarios,
        motivoTroca,
      })
    },
    [selectedCandidates, selectMonitorsMutation]
  )

  const handlePublishResults = useCallback(
    (projetoId: number) => {
      publishResultsMutation.mutate({
        projetoId: projetoId.toString(),
        notifyStudents: true,
        mensagemPersonalizada: feedback || undefined,
      })
    },
    [feedback, publishResultsMutation]
  )

  const openSelectionForProject = useCallback((project: MonitorProject) => {
    const bolsistas = project.inscricoes
      .filter((i) => i.status === 'SELECTED_BOLSISTA' || i.status === 'ACCEPTED_BOLSISTA')
      .map((i) => i.id)
    const voluntarios = project.inscricoes
      .filter((i) => i.status === 'SELECTED_VOLUNTARIO' || i.status === 'ACCEPTED_VOLUNTARIO')
      .map((i) => i.id)
    setSelectedCandidates({ bolsistas, voluntarios })
    setFeedback('')
  }, [])

  const resetSelection = useCallback(() => {
    setSelectedCandidates({ bolsistas: [], voluntarios: [] })
    setFeedback('')
  }, [])

  return {
    projetos,
    isLoading,
    selectedCandidates,
    feedback,
    setFeedback,
    selectMonitorsMutation,
    publishResultsMutation,
    handleSelectCandidate,
    handleSubmitSelection,
    handlePublishResults,
    openSelectionForProject,
    resetSelection,
  }
}
