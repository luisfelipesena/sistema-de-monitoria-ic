import { Spinner } from '@/components/ui/spinner';
import { useAuth } from '@/hooks/use-auth';
import { createFileRoute, Navigate, Outlet } from '@tanstack/react-router';

export const Route = createFileRoute('/home/_layout/professor/_layout')({
  component: RouteComponent,
});

function RouteComponent() {
  const { user, isLoading } = useAuth();
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Spinner />
      </div>
    );
  }

  if (user?.role !== 'professor') {
    return <Navigate to="/home" />;
  }

  return <Outlet />;
}
