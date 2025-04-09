'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/use-auth';
import { useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router';

export function RouteGuard() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    console.log('isLoading', isLoading);
    console.log('isAuthenticated', isAuthenticated);
    if (!isLoading && !isAuthenticated) {
      navigate('/');
    }
  }, [isLoading, isAuthenticated, user]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Skeleton className="w-full h-full" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <Outlet />;
}

export default RouteGuard;
