import { trpc } from '../../apps/web-next/src/utils/trpc';

export function useProfileSignature() {
  return trpc.signature.getProfile.useQuery();
}

export function useSaveProfileSignature() {
  const utils = trpc.useContext();
  return trpc.signature.saveProfile.useMutation({
    onSuccess: () => utils.signature.getProfile.invalidate(),
  });
}

export function useSignProject() {
  return trpc.signature.signProject.useMutation();
}