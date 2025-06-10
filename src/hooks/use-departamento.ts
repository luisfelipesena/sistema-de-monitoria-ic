import { api } from '@/utils/api'

export function useDepartamentoList() {
  const { data, isLoading, error } = api.departamento.list.useQuery()
  
  return {
    data: data || [],
    isLoading,
    error,
  }
}