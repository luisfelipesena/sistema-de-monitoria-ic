import { api } from '@/utils/api'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

export function usePeriodosInscricao() {
  return api.periodoInscricao.getPeriodos.useQuery()
}

export function usePeriodoInscricao(id: number) {
  return api.periodoInscricao.getPeriodo.useQuery({ id })
}

export function usePeriodoAtivo() {
  return api.periodoInscricao.getPeriodoAtivo.useQuery()
}

export function useCriarPeriodoInscricao() {
  const queryClient = useQueryClient()

  return api.periodoInscricao.criarPeriodo.useMutation({
    onSuccess: () => {
      toast.success('Período de inscrição criado com sucesso!')
      queryClient.invalidateQueries({ queryKey: [['periodoInscricao', 'getPeriodos']] })
    },
    onError: (error) => {
      toast.error(`Erro ao criar período: ${error.message}`)
    },
  })
}

export function useAtualizarPeriodoInscricao() {
  const queryClient = useQueryClient()

  return api.periodoInscricao.atualizarPeriodo.useMutation({
    onSuccess: () => {
      toast.success('Período de inscrição atualizado com sucesso!')
      queryClient.invalidateQueries({ queryKey: [['periodoInscricao', 'getPeriodos']] })
    },
    onError: (error) => {
      toast.error(`Erro ao atualizar período: ${error.message}`)
    },
  })
}

export function useDeletarPeriodoInscricao() {
  const queryClient = useQueryClient()

  return api.periodoInscricao.deletarPeriodo.useMutation({
    onSuccess: () => {
      toast.success('Período de inscrição excluído com sucesso!')
      queryClient.invalidateQueries({ queryKey: [['periodoInscricao', 'getPeriodos']] })
    },
    onError: (error: any) => {
      toast.error(`Erro ao excluir período: ${error.message}`)
    },
  })
}
