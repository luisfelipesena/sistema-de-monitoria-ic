import type { ProfessorInput, ProfessorResponse } from '@/routes/api/professor';
import { apiClient } from '@/utils/api-client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { QueryKeys } from './query-keys';

/**
 * Hook para obter dados do professor
 */
export function useProfessor() {
  return useQuery<ProfessorResponse>({
    queryKey: QueryKeys.professor.all,
    queryFn: async () => {
      const response = await apiClient.get<ProfessorResponse>('/professor');
      return response.data;
    },
    retry: false,
  });
}

/**
 * Hook para listar todos os professores (para admins)
 */
export function useProfessores() {
  return useQuery<ProfessorResponse[]>({
    queryKey: QueryKeys.professor.list,
    queryFn: async () => {
      const response =
        await apiClient.get<ProfessorResponse[]>('/professor/list');
      return response.data;
    },
  });
}

/**
 * Hook para atualizar dados do professor
 */
export function useSetProfessor() {
  const queryClient = useQueryClient();

  return useMutation<ProfessorResponse, Error, ProfessorInput>({
    mutationFn: async (data: ProfessorInput) => {
      const response = await apiClient.post<ProfessorResponse>(
        '/professor',
        data,
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QueryKeys.professor.all });
      queryClient.invalidateQueries({ queryKey: QueryKeys.onboarding.status });
    },
  });
}
