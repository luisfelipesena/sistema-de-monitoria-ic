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
  BookOpen,
  Calendar,
  FileCheck,
  FilePlus,
  FileText,
  FolderKanban,
  GraduationCap,
  LayoutDashboard,
  Mail,
  Monitor,
  TrendingUp,
  User,
  UserCog,
  UserPlus,
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
    href: (role) => `/home/${role}/dashboard`,
    icon: LayoutDashboard,
    roles: ['admin', 'professor', 'student'],
  },
  {
    label: 'Novo Edital',
    href: '/home/admin/edital',
    icon: Calendar,
    roles: ['admin'],
  },
  {
    label: 'Seleção de monitores',
    href: '/home/common/selecao-monitores',
    icon: UserCog,
    roles: ['professor', 'admin'],
  },
  {
    label: 'Projetos',
    href: '/home/common/projects',
    icon: FolderKanban,
    roles: ['professor'],
  },
  {
    label: 'Gerenciar Projetos',
    href: '/home/admin/projetos',
    icon: FolderKanban,
    roles: ['admin'],
  },
  {
    label: 'Perfil',
    href: '/home/common/profile',
    icon: User,
    roles: ['admin', 'professor', 'student'],
  },
  {
    label: 'Inscrição',
    href: '/home/common/monitoria',
    icon: FilePlus,
    roles: ['student'],
  },
  {
    label: 'Status',
    href: '/home/common/status',
    icon: FileCheck,
    roles: ['student'],
  },
  {
    label: 'Documentos',
    href: '/home/common/documentos',
    icon: FileText,
    roles: ['student'],
  },
  {
    label: 'Cursos',
    href: '/home/admin/cursos',
    icon: GraduationCap,
    roles: ['admin'],
  },
  {
    label: 'Departamentos',
    href: '/home/admin/departamentos',
    icon: Monitor,
    roles: ['admin'],
  },
  {
    label: 'Disciplinas',
    href: '/home/admin/disciplinas',
    icon: BookOpen,
    roles: ['admin'],
  },
  {
    label: 'Análise de Projetos',
    href: '/home/admin/analise-projetos',
    icon: FileCheck,
    roles: ['admin'],
  },
  {
    label: 'Analytics',
    href: '/home/admin/analytics',
    icon: TrendingUp,
    roles: ['admin'],
  },
  {
    label: 'Professores',
    href: '/home/admin/professores',
    icon: UserCog,
    roles: ['admin'],
  },
  {
    label: 'Alunos',
    href: '/home/admin/alunos',
    icon: UserPlus,
    roles: ['admin'],
  },
  {
    label: 'Usuários',
    href: '/home/admin/users',
    icon: Users,
    roles: ['admin'],
  },
  {
    label: 'Notificações',
    href: '/home/admin/notificacoes',
    icon: Mail,
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
            src="/images/ic-logo-clean.png"
            alt="Monitoria IC"
            className="h-32 w-18"
          />
          <span className="text-xl font-semibold">Monitoria IC</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu className="text-base">
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
                ((currentPathname, itemHref) => currentPathname === itemHref);

              return (
                <SidebarMenuItem key={actualHref}>
                  <SidebarMenuButton
                    asChild
                    isActive={checkIsActive(pathname, actualHref)}
                    tooltip={item.label}
                    onClick={() => handleNavigate(actualHref)}
                    className="text-base py-3"
                  >
                    <Link to={actualHref}>
                      <item.icon className="h-5 w-5" />
                      <span className="text-base font-medium">
                        {item.label}
                      </span>
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
