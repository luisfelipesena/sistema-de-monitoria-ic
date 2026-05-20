import { useState, useMemo } from 'react'
import { useDialogState } from '@/hooks/useDialogState'
import { useTRPCMutation } from '@/hooks/useTRPCMutation'
import { api } from '@/utils/api'
import { DEPARTMENT_STATUS_ATIVO, type DepartamentoListItem } from '@/types'
import type { DepartmentFormData } from '@/components/features/admin/departamentos/DepartmentFormDialog'

const EMPTY_FORM: DepartmentFormData = {
  nome: '',
  sigla: '',
  descricao: '',
  instituto: '',
  coordenador: '',
  email: '',
  telefone: '',
}

export function useDepartmentManagement() {
  const [formData, setFormData] = useState<DepartmentFormData>(EMPTY_FORM)

  const createDialog = useDialogState()
  const editDialog = useDialogState<DepartamentoListItem>()
  const deleteDialog = useDialogState<DepartamentoListItem>()

  const { data: departamentosData, isLoading } = api.departamento.getDepartamentos.useQuery({
    includeStats: true,
  })

  const createMutation = useTRPCMutation(api.departamento.createDepartamento.useMutation, {
    successMessage: 'Departamento criado com sucesso',
    errorMessage: 'Não foi possível criar o departamento',
    invalidateQueries: true,
    onSuccess: () => {
      createDialog.close()
      resetForm()
    },
  })

  const updateMutation = useTRPCMutation(api.departamento.updateDepartamento.useMutation, {
    successMessage: 'Departamento atualizado com sucesso',
    errorMessage: 'Não foi possível atualizar o departamento',
    invalidateQueries: true,
    onSuccess: () => {
      editDialog.close()
      resetForm()
    },
  })

  const deleteMutation = useTRPCMutation(api.departamento.deleteDepartamento.useMutation, {
    successMessage: 'Departamento excluído com sucesso',
    errorMessage: 'Não foi possível excluir o departamento',
    invalidateQueries: true,
    onSuccess: () => {
      deleteDialog.close()
    },
  })

  const departamentos: DepartamentoListItem[] = useMemo(
    () =>
      departamentosData?.map((dept) => ({
        id: dept.id,
        nome: dept.nome,
        sigla: dept.sigla || '',
        descricao: dept.descricao || undefined,
        instituto: dept.unidadeUniversitaria,
        coordenador: dept.coordenador || undefined,
        email: dept.email || undefined,
        telefone: dept.telefone || undefined,
        professores: 0,
        disciplinas: 0,
        projetos: 0,
        status: DEPARTMENT_STATUS_ATIVO,
        criadoEm: dept.createdAt.toISOString(),
        atualizadoEm: dept.updatedAt?.toISOString() || dept.createdAt.toISOString(),
      })) || [],
    [departamentosData]
  )

  const resetForm = () => {
    setFormData(EMPTY_FORM)
  }

  const handleCreate = async () => {
    if (!formData.nome || !formData.sigla) {
      throw new Error('Por favor, preencha o nome e a sigla do departamento')
    }

    await createMutation.mutateAsync({
      nome: formData.nome,
      sigla: formData.sigla,
      unidadeUniversitaria: formData.instituto || 'UFBA',
      coordenador: formData.coordenador || undefined,
      email: formData.email || undefined,
      telefone: formData.telefone || undefined,
      descricao: formData.descricao || undefined,
    })
  }

  const handleEdit = (departamento: DepartamentoListItem) => {
    setFormData({
      nome: departamento.nome,
      sigla: departamento.sigla,
      descricao: departamento.descricao || '',
      instituto: departamento.instituto || '',
      coordenador: departamento.coordenador || '',
      email: departamento.email || '',
      telefone: departamento.telefone || '',
    })
    editDialog.open(departamento)
  }

  const handleUpdate = async () => {
    if (!formData.nome || !formData.sigla || !editDialog.data) {
      throw new Error('Por favor, preencha o nome e a sigla do departamento')
    }

    await updateMutation.mutateAsync({
      id: editDialog.data.id,
      nome: formData.nome,
      sigla: formData.sigla,
      unidadeUniversitaria: formData.instituto || 'UFBA',
      coordenador: formData.coordenador || undefined,
      email: formData.email || undefined,
      telefone: formData.telefone || undefined,
      descricao: formData.descricao || undefined,
    })
  }

  const handleDelete = async () => {
    if (!deleteDialog.data) return

    await deleteMutation.mutateAsync({
      id: deleteDialog.data.id,
    })
  }

  return {
    departamentos,
    isLoading,
    formData,
    setFormData,
    createDialog,
    editDialog,
    deleteDialog,
    handleCreate,
    handleEdit,
    handleUpdate,
    handleDelete,
    resetForm,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  }
}
