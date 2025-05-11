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
  FileText,
  FolderKanban,
  GraduationCap,
  LayoutDashboard,
  User,
  Users,
  type LucideIcon,
} from 'lucide-react';

type SidebarLayoutProps = {
  pathname: string;
};

type UserRole = 'admin' | 'professor' | 'student';

type MenuItemConfig = {
  label: string;
  href: string | ((role: UserRole) => string);
  icon: LucideIcon;
  roles: UserRole[];
  isActive?: (pathname: string, itemHref: string) => boolean;
};

const menuItemsConfig: MenuItemConfig[] = [
  {
    label: 'Dashboard',
    href: (role) => `/home/${role}/dashboard`, // repetir isso para todas rotas onde se diferencia o role
    icon: LayoutDashboard,
    roles: ['admin', 'professor', 'student'],
  },
  {
    label: 'Projetos',
    href: '/home/common/projects',
    icon: FolderKanban,
    roles: ['admin', 'professor', 'student'],
  },
  {
    label: 'Perfil',
    href: '/home/common/profile',
    icon: User,
    roles: ['admin', 'professor', 'student'],
  },
  {
    label: 'Cursos',
    href: '/home/admin/cursos',
    icon: GraduationCap,
    roles: ['admin'],
  },
  {
    label: 'Usuários',
    href: '/home/admin/users',
    icon: Users,
    roles: ['admin'],
  },
  {
    label: 'Arquivos',
    href: '/home/admin/files',
    icon: FileText,
    roles: ['admin'],
  },
];

export function SidebarLayout({ pathname }: SidebarLayoutProps) {
  const { user } = useAuth();
  const { isLessThanMediumDesktop, setOpenCompactSidebarView } = useSidebar();
  const navigate = useNavigate();

  function handleNavigate(to: string) {
    navigate({ to });
    if (isLessThanMediumDesktop) setOpenCompactSidebarView(false);
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
          {menuItemsConfig
            .filter(
              (item) =>
                user?.role && item.roles.includes(user.role as UserRole),
            )
            .map((item) => {
              const actualHref =
                typeof item.href === 'function'
                  ? item.href(user!.role as UserRole)
                  : item.href;
              const checkIsActive =
                item.isActive ||
                ((currentPathname, itemHref) =>
                  currentPathname.startsWith(itemHref));

              return (
                <SidebarMenuItem key={actualHref}>
                  <SidebarMenuButton
                    asChild
                    isActive={checkIsActive(pathname, actualHref)}
                    tooltip={item.label}
                    onClick={() => handleNavigate(actualHref)}
                  >
                    <Link to={actualHref}>
                      <item.icon />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
        </SidebarMenu>
      </SidebarContent>
    </Sidebar>
  );
}
