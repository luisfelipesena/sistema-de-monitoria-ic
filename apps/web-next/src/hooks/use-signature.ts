import { trpc } from '../utils/trpc';

export function useProfileSignature() {
  return trpc.signature.getProfile.useQuery();
}

export function useSaveProfileSignature() {
  return trpc.signature.saveProfile.useMutation();
}