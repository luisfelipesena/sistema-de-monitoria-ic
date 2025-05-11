'use client';

import { Header } from '@/components/layout/Header';
import { SidebarLayout } from '@/components/layout/Sidebar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { useAuth } from '@/hooks/use-auth';
import { useOnboardingStatus } from '@/hooks/use-onboarding';
import {
  Outlet,
  createFileRoute,
  useLocation,
  useNavigate,
} from '@tanstack/react-router';
import { useEffect } from 'react';

export const Route = createFileRoute('/home/_layout')({
  component: HomeLayoutComponent,
});

function HomeLayoutComponent() {
  const { user, isLoading } = useAuth();

  const location = useLocation();
  const navigate = useNavigate();

  const { data: onboardingStatus, isLoading: statusLoading } =
    useOnboardingStatus();

  useEffect(() => {
    if (!isLoading && !statusLoading && onboardingStatus) {
      if (onboardingStatus.pending) {
        navigate({ to: '/home/common/onboarding' });
      }
    }
  }, [onboardingStatus, isLoading, statusLoading, location.pathname]);

  useEffect(() => {
    if (!user && !isLoading) {
      navigate({ to: '/', replace: true });
    }
  }, [user, isLoading]);

  return (
    <SidebarProvider>
      <SidebarLayout pathname={location.pathname} />

      <SidebarInset>
        <Header />
        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
