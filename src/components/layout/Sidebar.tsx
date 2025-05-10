import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { Link, useNavigate } from '@tanstack/react-router';
import { FolderKanban, LayoutDashboard, Settings, User } from 'lucide-react';

type SidebarLayoutProps = {
  pathname: string;
};

export function SidebarLayout({ pathname }: SidebarLayoutProps) {
  const { isMobile, setOpenMobile } = useSidebar();
  const navigate = useNavigate();

  function handleNavigate(to: string) {
    navigate({ to });
    if (isMobile) setOpenMobile(false);
  }

  return (
    <Sidebar className="z-30">
      <SidebarHeader>
        <div className="flex flex-col items-center gap-2 mb-4">
          <img
            src="/images/logo.ico"
            alt="Monitoria IC"
            className="h-32 w-18"
          />
          <span className="text-lg font-semibold">Monitoria IC</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={pathname === '/home'}
              tooltip="Visão Geral"
              onClick={() => handleNavigate('/home')}
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
              isActive={pathname.startsWith('/home/projects')}
              tooltip="Projetos"
              onClick={() => handleNavigate('/home/projects')}
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
              isActive={pathname.startsWith('/home/test')}
              tooltip="Teste"
              onClick={() => handleNavigate('/home/test')}
            >
              <Link to="/home/test">
                <FolderKanban />
                <span>Teste</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={pathname.startsWith('/home/profile')}
              tooltip="Perfil"
              onClick={() => handleNavigate('/home/profile')}
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
              isActive={pathname.startsWith('/home/admin/files')}
              tooltip="Administração"
              onClick={() => handleNavigate('/home/admin/files')}
            >
              <Link to="/home/admin/files">
                <Settings />
                <span>Administração</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>
    </Sidebar>
  );
}
