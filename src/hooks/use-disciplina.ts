import {
  DisciplinaProfessorVinculo,
  DisciplinaResponse,
} from '@/routes/api/disciplina/-types';
import { apiClient } from '@/utils/api-client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { QueryKeys } from './query-keys';

// Extended type for disciplinas that include professor information
export interface DisciplinaWithProfessor extends DisciplinaResponse {
  professorResponsavel?: string | null;
  professorResponsavelId?: number | null;
}

// Key de cache para consultas
export const DisciplinaKeys = {
  all: ['disciplinas'],
  detail: (id: number) => ['disciplinas', id],
  byDepartamento: (departamentoId: number) => [
    'disciplinas',
    'byDepartamento',
    departamentoId,
  ],
};

// Função para buscar disciplinas por departamento
export function useDisciplinas(departamentoId?: number) {
  return useQuery<DisciplinaWithProfessor[]>({
    queryKey: departamentoId
      ? DisciplinaKeys.byDepartamento(departamentoId)
      : DisciplinaKeys.all,
    queryFn: async () => {
      const url = departamentoId
        ? `/api/disciplina?departamentoId=${departamentoId}`
        : '/api/disciplina';
      const response = await apiClient.get<DisciplinaWithProfessor[]>(url);
      return response.data;
    },
    enabled: !!departamentoId,
  });
}

export function useCreateDisciplina() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      nome: string;
      codigo: string;
      departamentoId: number;
    }) => {
      const response = await apiClient.post('/disciplina', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QueryKeys.disciplina.list });
    },
  });
}

export function useUpdateDisciplina() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number;
      data: { nome: string; codigo: string; departamentoId: number };
    }) => {
      const response = await apiClient.put(`/disciplina/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QueryKeys.disciplina.list });
    },
  });
}

export function useDeleteDisciplina() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await apiClient.delete(`/disciplina/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QueryKeys.disciplina.list });
    },
  });
}

// Função para vincular professor a disciplina
export function useVincularProfessorDisciplina() {
  const queryClient = useQueryClient();

  return useMutation<unknown, Error, DisciplinaProfessorVinculo>({
    mutationFn: async (data) => {
      const response = await apiClient.post(
        '/api/disciplina/vincular-professor',
        data,
      );
      return response.data;
    },
    onSuccess: (_, variables) => {
      // Invalidar caches relacionados
      queryClient.invalidateQueries({ queryKey: DisciplinaKeys.all });
      if (variables.disciplinaId) {
        queryClient.invalidateQueries({
          queryKey: DisciplinaKeys.detail(variables.disciplinaId),
        });
      }
    },
  });
}

// Função para desvincular professor de disciplina
export function useDesvincularProfessorDisciplina() {
  const queryClient = useQueryClient();

  return useMutation<unknown, Error, Partial<DisciplinaProfessorVinculo>>({
    mutationFn: async (data) => {
      const response = await apiClient.delete(
        '/api/disciplina/vincular-professor',
        {
          data,
        },
      );
      return response.data;
    },
    onSuccess: (_, variables) => {
      // Invalidar caches relacionados
      queryClient.invalidateQueries({ queryKey: DisciplinaKeys.all });
      if (variables.disciplinaId) {
        queryClient.invalidateQueries({
          queryKey: DisciplinaKeys.detail(variables.disciplinaId),
        });
      }
    },
  });
}
