'use client';

import { Header } from '@/components/layout/Header';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from '@/components/ui/sidebar';
import { useAuth } from '@/hooks/use-auth';
import {
  Link,
  Outlet,
  createFileRoute,
  useLocation,
} from '@tanstack/react-router';
import {
  FolderKanban,
  LayoutDashboard,
  LogOut,
  Settings,
  User,
} from 'lucide-react';
import { useEffect, useState } from 'react';

export const Route = createFileRoute('/home/_layout')({
  component: HomeLayoutComponent,
});

function HomeLayoutComponent() {
  const { user, isLoading, signOut, isAuthenticated } = useAuth();
  const location = useLocation();
  const [isSignedOut, setIsSignedOut] = useState(false);

  useEffect(() => {
    if (!user && !isLoading && !isSignedOut) {
      signOut();
      setIsSignedOut(true);
    }
  }, [user, isLoading, isSignedOut]);

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <div className="flex flex-col items-center gap-2 mb-4">
            <img src="/ic-logo.png" alt="Monitoria IC" className="h-32 w-18" />
            <span className="text-lg font-semibold">Monitoria IC</span>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={location.pathname === '/home'}
                tooltip="Visão Geral"
              >
                <Link to="/home">
                  <LayoutDashboard />
                  <span>Visão Geral</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={location.pathname.startsWith('/home/projects')}
                tooltip="Projetos"
              >
                <Link to="/home/projects">
                  <FolderKanban />
                  <span>Projetos</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={location.pathname.startsWith('/home/profile')}
                tooltip="Perfil"
              >
                <Link to="/home/profile">
                  <User />
                  <span>Perfil</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={location.pathname.startsWith('/home/settings')}
                tooltip="Configurações"
              >
                <Link to="/home/settings">
                  <Settings />
                  <span>Configurações</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
          {user && (
            <div className="px-3 py-2 mb-2 text-sm border-t border-border">
              <p className="font-medium truncate">{user.username}</p>
              <p className="text-xs text-muted-foreground">{user.role}</p>
            </div>
          )}
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => {
                  setIsSignedOut(true);
                  signOut();
                }}
                tooltip="Sair"
              >
                <LogOut />
                <span>Sair</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset>
        <Header />
        <main className="flex-1 p-6 overflow-y-auto">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
