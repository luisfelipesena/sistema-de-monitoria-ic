'use client';

import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { useAuth } from '@/hooks/use-auth';
import { trpc } from '@/server/trpc/react';

import { SidebarLayout } from '@/components/layout/Sidebar';
import {
  Outlet,
  createFileRoute,
  useLocation,
  useNavigate,
  useRouter,
} from '@tanstack/react-router';
import React, { useEffect, useState } from 'react';

export const Route = createFileRoute('/home/_layout')({
  component: HomeLayoutComponent,
});

function HomeLayoutComponent() {
  const { user, isLoading, signOut } = useAuth();
  const { data: onboardingPending } = trpc.onboarding.getStatus.useQuery();
  const location = useLocation();
  const [isSignedOut, setIsSignedOut] = useState(false);
  const navigate = useNavigate();
  const router = useRouter();

  React.useEffect(
    function onSuccessOnboarding() {
      if (onboardingPending?.pending) {
        navigate({ to: '/home/onboarding' });
      }
    },
    [onboardingPending?.pending],
  );

  useEffect(() => {
    if (!user && !isLoading && !isSignedOut) {
      signOut();
      setIsSignedOut(true);
    }
  }, [user, isLoading, isSignedOut]);

  if (isLoading) return null;

  return (
    <SidebarProvider>
      <SidebarLayout pathname={location.pathname} />
      <SidebarInset>
        <Header />
        <main className="flex-1 min-h-screen p-6">
          <Outlet />
        </main>
        <Footer />
      </SidebarInset>
    </SidebarProvider>
  );
}
