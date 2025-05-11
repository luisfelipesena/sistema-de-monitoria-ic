import { useAuth } from '@/hooks/use-auth';
import { createFileRoute, Outlet, useNavigate } from '@tanstack/react-router';
import { useEffect } from 'react';

export const Route = createFileRoute('/home/_layout/')({
  component: RouteComponent,
});

function RouteComponent() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const isAdmin = user?.role === 'admin';
  const isProfessor = user?.role === 'professor';
  const isStudent = user?.role === 'student';

  useEffect(() => {
    if (location.pathname === '/home') {
      if (isAdmin) {
        navigate({ to: '/home/admin/dashboard' });
      } else if (isProfessor) {
        navigate({ to: '/home/professor/dashboard' });
      } else if (isStudent) {
        navigate({ to: '/home/student/dashboard' });
      }
    }
  }, [isAdmin, isProfessor, isStudent, location.pathname]);

  return <Outlet />;
}
