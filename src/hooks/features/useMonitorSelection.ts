import { useState, useCallback } from 'react'
import { useToast } from '@/hooks/use-toast'
import { api } from '@/utils/api'
import type { SelectionState, MonitorProject } from '@/types/monitor-selection'

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
        const maxVoluntarios = project.voluntariosSolicitados || 0

        if (isSelected) {
          return {
            ...prev,
            voluntarios: prev.voluntarios.filter((id) => id !== inscricaoId),
          }
        }
        if (prev.voluntarios.length < maxVoluntarios) {
          return {
            ...prev,
            voluntarios: [...prev.voluntarios, inscricaoId],
          }
        }
        return prev
      })
    },
    []
  )

  const handleSubmitSelection = useCallback(
    (projetoId: number) => {
      selectMonitorsMutation.mutate({
        projetoId,
        bolsistas: selectedCandidates.bolsistas,
        voluntarios: selectedCandidates.voluntarios,
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
    resetSelection,
  }
}
