import { trpc } from '@/server/trpc/react';

export function useAdminFilesList() {
  return trpc.files.list.useQuery();
}

export function useAdminFileDelete() {
  const utils = trpc.useUtils();
  const mutation = trpc.files.delete.useMutation({
    onSuccess: () => {
      utils.files.list.invalidate();
    },
  });
  return mutation;
}

export function useFilePresignedUrl() {
  return trpc.files.presignedUrl.get.useMutation();
}
