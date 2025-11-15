import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { api } from '@/utils/api'
import { useTRPCMutation } from '@/hooks/useTRPCMutation'
import { SEMESTRE_1, SEMESTRE_2 } from '@/types'

const filterFormSchema = z.object({
  ano: z.number().int().min(2000).max(2100),
  semestre: z.enum([SEMESTRE_1, SEMESTRE_2]),
})

export type FilterFormData = z.infer<typeof filterFormSchema>

export function useScholarshipAllocation() {
  const [filters, setFilters] = useState<FilterFormData>({
    ano: new Date().getFullYear(),
    semestre: SEMESTRE_1,
  })
  const [editingAllocations, setEditingAllocations] = useState<Record<number, number>>({})

  const form = useForm<FilterFormData>({
    resolver: zodResolver(filterFormSchema),
    defaultValues: filters,
  })

  const { data: projects, isLoading, refetch } = api.scholarshipAllocation.getApprovedProjects.useQuery(filters)
  const { data: summary } = api.scholarshipAllocation.getAllocationSummary.useQuery(filters)
  const { data: progradData, refetch: refetchProgradTotal } =
    api.scholarshipAllocation.getTotalProgradScholarships.useQuery(filters)

  const updateAllocationMutation = useTRPCMutation(api.scholarshipAllocation.updateScholarshipAllocation.useMutation, {
    successMessage: 'Alocação atualizada!',
    onSuccess: () => {
      refetch()
    },
  })

  const bulkUpdateMutation = useTRPCMutation(api.scholarshipAllocation.bulkUpdateAllocations.useMutation, {
    successMessage: 'Alocações atualizadas!',
    onSuccess: () => {
      setEditingAllocations({})
      refetch()
    },
  })

  const allocateCandidateMutation = useTRPCMutation(
    api.scholarshipAllocation.allocateScholarshipToCandidate.useMutation,
    {
      successMessage: 'Candidato selecionado!',
      onSuccess: () => {
        refetch()
      },
    }
  )

  const setProgradTotalMutation = useTRPCMutation(
    api.scholarshipAllocation.setTotalScholarshipsFromPrograd.useMutation,
    {
      successMessage: (data: { totalBolsas: number }) => `Total de ${data.totalBolsas} bolsas PROGRAD definido.`,
      onSuccess: () => {
        refetchProgradTotal()
      },
    }
  )

  const notifyProfessorsMutation = useTRPCMutation(
    api.scholarshipAllocation.notifyProfessorsAfterAllocation.useMutation,
    {
      successMessage: (data: { emailsEnviados: number }) =>
        `${data.emailsEnviados} professores notificados sobre alocação de bolsas.`,
    }
  )

  const handleFilterSubmit = (data: FilterFormData) => {
    setFilters(data)
  }

  const handleEditAllocation = (projectId: number, currentValue: number) => {
    setEditingAllocations((prev) => ({
      ...prev,
      [projectId]: currentValue,
    }))
  }

  const handleSaveAllocation = (projectId: number) => {
    const newValue = editingAllocations[projectId]
    if (newValue !== undefined) {
      updateAllocationMutation.mutate({
        projetoId: projectId,
        bolsasDisponibilizadas: newValue,
      })
      setEditingAllocations((prev) => {
        const updated = { ...prev }
        delete updated[projectId]
        return updated
      })
    }
  }

  const handleBulkSave = () => {
    const allocations = Object.entries(editingAllocations).map(([projetoId, bolsasDisponibilizadas]) => ({
      projetoId: parseInt(projetoId),
      bolsasDisponibilizadas,
    }))

    bulkUpdateMutation.mutate({ allocations })
  }

  const handleNotifyProfessors = () => {
    notifyProfessorsMutation.mutate({
      ano: filters.ano,
      semestre: filters.semestre,
    })
  }

  const totalPrograd = progradData?.totalBolsasPrograd ?? 0
  const totalAlocadas = Number(summary?.summary.totalBolsasDisponibilizadas) || 0
  const bolsasRestantes = totalPrograd - totalAlocadas
  const excedeuLimite = bolsasRestantes < 0
  const limiteConfigurado = totalPrograd > 0

  return {
    filters,
    form,
    editingAllocations,
    setEditingAllocations,
    projects,
    isLoading,
    summary,
    totalPrograd,
    totalAlocadas,
    bolsasRestantes,
    excedeuLimite,
    limiteConfigurado,
    handleFilterSubmit,
    handleEditAllocation,
    handleSaveAllocation,
    handleBulkSave,
    handleNotifyProfessors,
    updateAllocationMutation,
    bulkUpdateMutation,
    allocateCandidateMutation,
    setProgradTotalMutation,
    notifyProfessorsMutation,
  }
}
