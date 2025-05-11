import { useAuth } from '@/hooks/use-auth';
import { createFileRoute, Navigate, Outlet } from '@tanstack/react-router';

export const Route = createFileRoute('/home/_layout/admin/_layout')({
  component: RouteComponent,
});

function RouteComponent() {
  const { user } = useAuth();
  if (user?.role !== 'admin') {
    return <Navigate to="/home" />;
  }

  return <Outlet />;
}
