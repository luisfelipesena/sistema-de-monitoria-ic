import { QueryKeys } from '@/hooks/query-keys';
import type {
  ApiUser,
  UpdateUserRoleInput,
  UserListResponse,
} from '@/routes/api/user/-types';
import { apiClient } from '@/utils/api-client';
import { logger } from '@/utils/logger';
import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationOptions,
  type UseQueryOptions,
} from '@tanstack/react-query';

const log = logger.child({
  context: 'user-hooks',
});

/**
 * Hook para listar usuários
 */
export function useUsers(
  options?: Partial<UseQueryOptions<UserListResponse, Error>>
) {
  return useQuery<UserListResponse, Error>({
    queryKey: QueryKeys.user.all,
    queryFn: async () => {
      try {
        const response = await apiClient.get<UserListResponse>('/user');
        return response.data;
      } catch (error) {
        log.error({ error }, 'Erro ao buscar usuários');
        throw error;
      }
    },
    ...options,
  });
}

/**
 * Hook para atualizar o papel de um usuário
 */
export function useUpdateUserRole(
  options?: Partial<
    UseMutationOptions<ApiUser, Error, { userId: number; data: UpdateUserRoleInput }>
  >
) {
  const queryClient = useQueryClient();

  return useMutation<ApiUser, Error, { userId: number; data: UpdateUserRoleInput }>({
    mutationFn: async ({ userId, data }) => {
      const response = await apiClient.put<ApiUser>(`/user/${userId}`, data);
      return response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: QueryKeys.user.all });
      queryClient.invalidateQueries({
        queryKey: QueryKeys.user.byId(String(variables.userId)),
      });
      options?.onSuccess?.(data, variables, undefined);
    },
    onError: (error, variables, context) => {
      log.error({ error, variables }, 'Erro ao atualizar papel do usuário');
      options?.onError?.(error, variables, context);
    },
    ...options,
  });
}

/**
 * Hook para excluir um usuário
 */
export function useDeleteUser(
  options?: Partial<UseMutationOptions<{ message: string }, Error, number>>
) {
  const queryClient = useQueryClient();

  return useMutation<{ message: string }, Error, number>({
    mutationFn: async (userId: number) => {
      const response = await apiClient.delete<{ message: string }>(
        `/user/${userId}`
      );
      return response.data;
    },
    onSuccess: (data, userId, context) => {
      queryClient.invalidateQueries({ queryKey: QueryKeys.user.all });
      queryClient.removeQueries({
        queryKey: QueryKeys.user.byId(String(userId)),
      });
      options?.onSuccess?.(data, userId, context);
    },
    onError: (error, userId, context) => {
      log.error({ error, userId }, 'Erro ao excluir usuário');
      options?.onError?.(error, userId, context);
    },
    ...options,
  });
}
