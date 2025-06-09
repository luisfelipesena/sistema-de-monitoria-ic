import { apiClient } from '@/utils/api-client';
import { useQuery, useMutation } from '@tanstack/react-query';
import { QueryKeys } from './query-keys';
import type { 
  ValidateInvitationResponse 
} from '@/routes/api/auth/validate-invitation';
import type { 
  AcceptInvitationResponse 
} from '@/routes/api/auth/accept-invitation';

export function useValidateInvitation(token: string) {
  return useQuery<ValidateInvitationResponse>({
    queryKey: QueryKeys.invitation.validate(token),
    queryFn: async () => {
      const response = await apiClient.get<ValidateInvitationResponse>(
        `/auth/validate-invitation?token=${token}`
      );
      return response.data;
    },
    enabled: !!token,
    staleTime: 0, // Don't cache validation results
    refetchOnWindowFocus: false,
  });
}

export function useAcceptInvitation() {
  return useMutation<AcceptInvitationResponse, Error, string>({
    mutationFn: async (token) => {
      const response = await apiClient.post<AcceptInvitationResponse>(
        '/auth/accept-invitation',
        { token }
      );
      return response.data;
    },
  });
} 