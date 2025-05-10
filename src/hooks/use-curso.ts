import { apiClient } from '@/utils/api-client';
import { useQuery } from '@tanstack/react-query';

interface Curso {
  id: number;
  nome: string;
  codigo?: number;
}

export function useCursos() {
  return useQuery<Curso[]>({
    queryKey: ['cursos'],
    queryFn: async () => {
      const response = await apiClient.get('/curso');
      return response.data;
    },
  });
}

export function useCursoList() {
  return useCursos();
} 