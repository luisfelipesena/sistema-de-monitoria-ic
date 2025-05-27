import { QueryKeys } from '@/hooks/query-keys';
import { CursoInput, CursoResponse } from '@/routes/api/course/-types';
import { apiClient } from '@/utils/api-client';
import { logger } from '@/utils/logger';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

const log = logger.child({
  context: 'curso-hooks',
});

/**
 * Hook para listar cursos
 */
export function useCursos() {
  return useQuery<CursoResponse[]>({
    queryKey: QueryKeys.curso.all,
    queryFn: async () => {
      try {
        const response = await apiClient.get('/course');
        return response.data;
      } catch (error) {
        log.error({ error }, 'Erro ao buscar cursos');
        throw error;
      }
    },
  });
}

/**
 * Hook para criar um curso
 */
export function useCreateCurso() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CursoInput) => {
      const response = await apiClient.post('/course', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QueryKeys.curso.all });
    },
    onError: (error) => {
      log.error({ error }, 'Erro ao criar curso');
    },
  });
}

/**
 * Hook para atualizar um curso
 */
export function useUpdateCurso() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: CursoInput }) => {
      const response = await apiClient.put(`/course/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QueryKeys.curso.all });
    },
    onError: (error) => {
      log.error({ error }, 'Erro ao atualizar curso');
    },
  });
}

/**
 * Hook para excluir um curso
 */
export function useDeleteCurso() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await apiClient.delete(`/course/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QueryKeys.curso.all });
    },
    onError: (error) => {
      log.error({ error }, 'Erro ao excluir curso');
    },
  });
}
