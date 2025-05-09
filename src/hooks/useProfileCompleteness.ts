import { useQuery } from '@tanstack/react-query';
import { useAuth } from './use-auth';

export function useProfileCompleteness() {
  const { user, isLoading: authLoading } = useAuth();

  const {
    data: profileData,
    isLoading: profileLoading,
    error,
  } = useQuery({
    queryKey: ['profile-completeness', user?.role, user?.id],
    queryFn: async () => {
      if (!user) return null;
      if (user.role === 'student') {
        const res = await fetch('/api/aluno');
        if (!res.ok) throw new Error('Failed to fetch student profile');
        const data = await res.json();
        return Object.keys(data).length > 0;
      }
      if (user.role === 'professor') {
        const res = await fetch('/api/professor');
        if (!res.ok) throw new Error('Failed to fetch professor profile');
        const data = await res.json();
        return Object.keys(data).length > 0;
      }
      return true;
    },
    enabled: !!user && !authLoading,
    staleTime: 5 * 60 * 1000,
  });

  return {
    isComplete: profileData === true,
    isLoading: authLoading || profileLoading,
    error,
  };
}
