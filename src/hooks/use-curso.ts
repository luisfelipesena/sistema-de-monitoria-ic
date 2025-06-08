import { apiClient } from '@/utils/api-client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { QueryKeys } from './query-keys';
import { toast } from 'sonner';
import type { selectCursoTableSchema } from '@/server/database/schema';
import { z } from 'zod';

type Curso = z.infer<typeof selectCursoTableSchema>;
type CursoInput = Omit<Curso, 'id' | 'createdAt' | 'updatedAt'>;

// Hook para listar todos os cursos
export function useCursos() {
  return useQuery<Curso[]>({
    queryKey: QueryKeys.curso.list,
    queryFn: async () => {
      const response = await apiClient.get<Curso[]>('/course');
      return response.data;
    },
  });
}

// Hook para buscar detalhes de um curso
export function useCurso(id: number) {
  return useQuery<Curso>({
    queryKey: QueryKeys.curso.byId(id.toString()),
    queryFn: async () => {
      const response = await apiClient.get<Curso>(`/course/${id}`);
      return response.data;
    },
    enabled: !!id,
  });
}

// Hook para criar um novo curso
export function useCreateCurso() {
  const queryClient = useQueryClient();
  return useMutation<Curso, Error, CursoInput>({
    mutationFn: async (data) => {
      const response = await apiClient.post<Curso>('/course', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QueryKeys.curso.list });
      toast.success('Curso criado com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao criar curso', {
        description: error.message,
      });
    },
  });
}

// Hook para atualizar um curso
export function useUpdateCurso() {
  const queryClient = useQueryClient();
  return useMutation<Curso, Error, { id: number; data: Partial<CursoInput> }>({
    mutationFn: async ({ id, data }) => {
      const response = await apiClient.put<Curso>(`/course/${id}`, data);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: QueryKeys.curso.list });
      queryClient.invalidateQueries({
        queryKey: QueryKeys.curso.byId(data.id.toString()),
      });
      toast.success('Curso atualizado com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar curso', {
        description: error.message,
      });
    },
  });
}

// Hook para excluir um curso
export function useDeleteCurso() {
  const queryClient = useQueryClient();
  return useMutation<{ success: boolean }, Error, number>({
    mutationFn: async (id) => {
      const response = await apiClient.delete<{ success: boolean }>(
        `/course/${id}`,
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QueryKeys.curso.list });
      toast.success('Curso excluído com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao excluir curso', {
        description: error.message,
      });
    },
  });
}
