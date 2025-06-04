import { apiClient } from '@/utils/api-client';
import { logger } from '@/utils/logger';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { InviteProfessorResponse, InviteProfessorInput } from '@/routes/api/admin/invite-professor';
// import { QueryKeys } from './query-keys'; // Uncomment if specific query invalidations are needed

const log = logger.child({
  context: 'use-admin-hooks',
});

export function useInviteProfessor() {
  const queryClient = useQueryClient();

  return useMutation<
    InviteProfessorResponse,
    Error,
    string // The email string is the direct input to the mutation
  >({
    mutationFn: async (email) => {
      const payload: InviteProfessorInput = { email };
      const response = await apiClient.post<InviteProfessorResponse>(
        '/admin/invite-professor',
        payload,
      );
      return response.data; // Corrected: Axios response data is in response.data
    },
    onSuccess: (data) => {
      log.info(
        { success: data.success, message: data.message, invitationId: data.invitationId },
        'Professor invitation mutation successful.',
      );
      // Example: queryClient.invalidateQueries({ queryKey: QueryKeys.admin.invitationsList });
    },
    onError: (error: Error, variables) => {
      log.error(
        error,
        'Error sending professor invitation for email:' + variables,
      );
    },
  });
} 