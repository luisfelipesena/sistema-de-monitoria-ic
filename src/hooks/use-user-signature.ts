import { apiClient } from '@/utils/api-client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { QueryKeys } from './query-keys';
import type { 
  SignatureInput, 
  SignatureResponse 
} from '@/routes/api/user/signature';

export function useUserSignature() {
  return useQuery<SignatureResponse>({
    queryKey: QueryKeys.userSignature.get,
    queryFn: async () => {
      const response = await apiClient.get<SignatureResponse>('/user/signature');
      return response.data;
    },
  });
}

export function useSaveUserSignature() {
  const queryClient = useQueryClient();
  
  return useMutation<SignatureResponse, Error, SignatureInput>({
    mutationFn: async (input) => {
      const response = await apiClient.post<SignatureResponse>('/user/signature', input);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QueryKeys.userSignature.get });
    },
  });
}

export function useDeleteUserSignature() {
  const queryClient = useQueryClient();
  
  return useMutation<SignatureResponse, Error>({
    mutationFn: async () => {
      const response = await apiClient.delete<SignatureResponse>('/user/signature');
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QueryKeys.userSignature.get });
    },
  });
} 