import { api } from '@/utils/api'

export function useDepartamentoList() {
  return api.departamento.getDepartamentos.useQuery({ includeStats: false })
}

export function useDepartamento(id: number) {
  return api.departamento.getDepartamento.useQuery(
    { id },
    {
      enabled: !!id,
    }
  )
}

export function useCreateDepartamento() {
  return api.departamento.createDepartamento.useMutation()
}

export function useUpdateDepartamento() {
  return api.departamento.updateDepartamento.useMutation()
}

export function useDeleteDepartamento() {
  return api.departamento.deleteDepartamento.useMutation()
}
