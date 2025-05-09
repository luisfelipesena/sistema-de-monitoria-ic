import { trpc } from '@/router';
import { useAuth } from './use-auth';

export function useProfileCompleteness() {
  const { user, isLoading: authLoading } = useAuth();

  const {
    data: profileData,
    isLoading: profileLoading,
    error,
  } = trpc.aluno.get.useQuery(undefined, {
    enabled: !!user && !authLoading,
  });

  return {
    isComplete: profileData === true,
    isLoading: authLoading || profileLoading,
    error,
  };
}
