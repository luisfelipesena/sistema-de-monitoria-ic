import { useAuth } from '@/hooks/use-auth';
import { createFileRoute, Navigate, Outlet } from '@tanstack/react-router';

export const Route = createFileRoute('/home/_layout/professor/_layout')({
  component: RouteComponent,
});

function RouteComponent() {
  const { user } = useAuth();
  if (user?.role !== 'professor') {
    return <Navigate to="/home" />;
  }

  return <Outlet />;
}
