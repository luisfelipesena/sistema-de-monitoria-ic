import { trpc } from '@/../apps/web-next/src/utils/trpc';

export function useUserSignature() {
  return trpc.signature.getProfile.useQuery();
}

export function useSaveUserSignature() {
  return trpc.signature.saveProfile.useMutation({
    onSuccess: () => {
      trpc.signature.getProfile.invalidate();
    },
  });
}

export function useDeleteUserSignature() {
  // not yet implemented in router, fallback to mutation disabled
  return { mutateAsync: async () => Promise.reject('Not implemented'), isPending: false } as any;
} 