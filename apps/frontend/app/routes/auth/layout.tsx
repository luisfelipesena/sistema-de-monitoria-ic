import { useAuth } from '@/hooks/use-auth';
import { Link, Navigate, Outlet } from 'react-router';

export default function AuthLayout() {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Navigate to="/home" />;
  }

  return (
    <div>
      <header>
        <Link to="/">Sistema de Monitoria IC</Link>
      </header>
      <Outlet />
    </div>
  );
}
