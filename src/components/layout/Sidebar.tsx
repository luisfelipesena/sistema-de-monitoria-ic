import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { useAuth } from '@/hooks/use-auth';
import { Link, useNavigate } from '@tanstack/react-router';
import {
<<<<<<< Updated upstream
  FileText,
  FolderKanban,
  GraduationCap,
  LayoutDashboard,
  User,
  Users,
=======
  ClipboardList,
  FolderKanban,
  LayoutDashboard,
  Settings,
  User,
>>>>>>> Stashed changes
} from 'lucide-react';

type SidebarLayoutProps = {
  pathname: string;
};

export function SidebarLayout({ pathname }: SidebarLayoutProps) {
  const { user } = useAuth();
  const { isLessThanMediumDesktop, setOpenCompactSidebarView } = useSidebar();
  const navigate = useNavigate();

  function handleNavigate(to: string) {
    navigate({ to });
    if (isLessThanMediumDesktop) setOpenCompactSidebarView(false);
  }

  // Menu de administrador
  const adminMenu = [
    { label: 'Cursos', href: '/home/admin/cursos', icon: GraduationCap },
    // {
    //   label: 'Departamentos',
    //   href: '/home/admin/departamentos',
    //   icon: Building,
    // },
    { label: 'Usuários', href: '/home/admin/users', icon: Users },
    // { label: 'Disciplinas', href: '/home/admin/disciplinas', icon: BookOpen },
    { label: 'Arquivos', href: '/home/admin/files', icon: FileText },
  ];

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
<<<<<<< Updated upstream

=======
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={pathname.startsWith('/home/dashboard/admin')}
              tooltip="Dashboard"
              onClick={() => handleNavigate('/home/dashboard/admin')}
            >
              <Link to="/home/dashboard/admin">
                <ClipboardList />
                <span>Dashboard</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={pathname.startsWith('/home/test')}
              tooltip="Dashboard"
              onClick={() => handleNavigate('/home/test')}
            >
              <Link to="/home/test">
                <FolderKanban />
                <span>Teste</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
>>>>>>> Stashed changes
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

          {/* Menu de Administração */}
          {user?.role === 'admin' && (
            <>
              <div className="mt-6 mb-2 px-3">
                <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Administração
                </h2>
              </div>

              {adminMenu.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.href}
                    tooltip={item.label}
                    onClick={() => handleNavigate(item.href)}
                  >
                    <Link to={item.href}>
                      <item.icon />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </>
          )}
        </SidebarMenu>
      </SidebarContent>
    </Sidebar>
  );
}
