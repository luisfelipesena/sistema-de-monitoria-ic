import { DisciplinaResponse } from '@/routes/api/disciplina/-types';
import { apiClient } from '@/utils/api-client';
import { useQuery } from '@tanstack/react-query';
import { QueryKeys } from './query-keys';

export function useDisciplinas(departamentoId?: number) {
  return useQuery<DisciplinaResponse[]>({
    queryKey: departamentoId
      ? [...QueryKeys.disciplina.list, departamentoId]
      : QueryKeys.disciplina.list,
    queryFn: async () => {
      const params = departamentoId ? `?departamentoId=${departamentoId}` : '';
      const response = await apiClient.get<DisciplinaResponse[]>(
        `/disciplina${params}`,
      );
      return response.data;
    },
  });
}
