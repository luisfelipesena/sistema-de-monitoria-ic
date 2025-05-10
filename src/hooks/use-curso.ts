import { QueryKeys } from '@/hooks/query-keys';
import { apiClient } from '@/utils/api-client';
import { logger } from '@/utils/logger';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

const log = logger.child({
  context: 'curso-hooks',
});

export interface Curso {
  id: number;
  nome: string;
  codigo?: number | null;
  createdAt?: string;
  updatedAt?: string | null;
}

export interface CursoInput {
  nome: string;
  codigo?: number | null;
}

/**
 * Hook para listar cursos
 */
export function useCursos() {
  return useQuery<Curso[]>({
    queryKey: QueryKeys.curso.all,
    queryFn: async () => {
      try {
        const response = await apiClient.get('/curso');
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
      const response = await apiClient.post('/curso', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cursos'] });
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
      const response = await apiClient.put(`/curso/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cursos'] });
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
      const response = await apiClient.delete(`/curso/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cursos'] });
    },
    onError: (error) => {
      log.error({ error }, 'Erro ao excluir curso');
    },
  });
}

/**
 * Hook para criar cursos iniciais (seed)
 */
export function useSeedCursos() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await apiClient.post('/curso');
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cursos'] });
    },
    onError: (error) => {
      log.error({ error }, 'Erro ao criar cursos iniciais');
    },
  });
}

// Compatibilidade com código existente
export function useCursoList() {
  return useCursos();
} 