import { useAuth } from '@/hooks/use-auth';
import { createFileRoute, Navigate, Outlet } from '@tanstack/react-router';

export const Route = createFileRoute('/home/_layout/student/_layout')({
  component: RouteComponent,
});

function RouteComponent() {
  const { user } = useAuth();
  if (user?.role !== 'student') {
    return <Navigate to="/home" />;
  }

  return <Outlet />;
}
