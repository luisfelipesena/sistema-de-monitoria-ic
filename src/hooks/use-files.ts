import { trpc } from '@/utils/trpc';
import { useQueryClient } from '@tanstack/react-query';

export function useAdminFilesList() {
  return trpc.files.list.useQuery();
}

export function useAdminFileDelete() {
  const queryClient = useQueryClient();
  const mutation = trpc.files.delete.useMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['files.list'] });
    },
  });
  return mutation;
}

export function useFilePresignedUrl() {
  return trpc.files.presignedUrl.get.useMutation();
}
