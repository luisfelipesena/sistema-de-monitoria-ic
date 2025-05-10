'use client';

import { Header } from '@/components/layout/Header';
import { SidebarLayout } from '@/components/layout/Sidebar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { useAuth } from '@/hooks/use-auth';
import { useOnboardingStatus } from '@/hooks/use-onboarding';
import { logger } from '@/utils/logger';
import {
  Outlet,
  createFileRoute,
  useLocation,
  useNavigate,
} from '@tanstack/react-router';
import { useEffect } from 'react';

const log = logger.child({
  context: 'HomeLayout',
});

export const Route = createFileRoute('/home/_layout')({
  component: HomeLayoutComponent,
});

function HomeLayoutComponent() {
  const { user, isLoading, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const { data: onboardingStatus, isLoading: statusLoading } =
    useOnboardingStatus();

  useEffect(() => {
    if (!isLoading && !statusLoading && onboardingStatus) {
      log.info({ onboardingStatus }, 'Onboarding status');
      if (onboardingStatus.pending) {
        navigate({ to: '/home/onboarding' });
      }
    }
  }, [onboardingStatus, isLoading, statusLoading, location.pathname]);

  useEffect(() => {
    if (!user && !isLoading) {
      signOut();
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
