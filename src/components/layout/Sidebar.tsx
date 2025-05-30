import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { useAuth } from '@/hooks/use-auth';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { Link, useNavigate } from '@tanstack/react-router';
import {
  BookOpen,
  Building,
  ChevronRight,
  FileCheck,
  FilePlus,
  FileSignature,
  FileText,
  GraduationCap,
  LayoutDashboard,
  Settings,
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

type MenuGroupConfig = {
  label: string;
  icon: LucideIcon;
  roles: UserRole[];
  items: MenuItemConfig[];
};

type MenuConfig = MenuItemConfig | MenuGroupConfig;

const isMenuGroup = (item: MenuConfig): item is MenuGroupConfig => {
  return 'items' in item;
};

const menuConfig: MenuConfig[] = [
  // Dashboard
  {
    label: 'Dashboard',
    href: (role) => `/home/${role}/dashboard`,
    icon: LayoutDashboard,
    roles: ['admin', 'professor', 'student'],
  },

  // Admin - Projetos
  {
    label: 'Projetos',
    icon: FileText,
    roles: ['admin'],
    items: [
      {
        label: 'Gerenciar Projetos',
        href: '/home/admin/manage-projects',
        icon: FileText,
        roles: ['admin'],
      },
      {
        label: 'Projetos Pendentes',
        href: '/home/admin/pending-approvals',
        icon: FileCheck,
        roles: ['admin'],
      },
      {
        label: 'Assinatura de Documentos',
        href: '/home/admin/document-signing',
        icon: FileSignature,
        roles: ['admin'],
      },
    ],
  },

  // Admin - Usuários
  {
    label: 'Usuários',
    icon: Users,
    roles: ['admin'],
    items: [
      {
        label: 'Todos os Usuários',
        href: '/home/admin/users',
        icon: Users,
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
    ],
  },

  // Admin - Configurações Acadêmicas
  {
    label: 'Configurações',
    icon: Settings,
    roles: ['admin'],
    items: [
      {
        label: 'Cursos',
        href: '/home/admin/cursos',
        icon: GraduationCap,
        roles: ['admin'],
      },
      {
        label: 'Departamentos',
        href: '/home/admin/departamentos',
        icon: Building,
        roles: ['admin'],
      },
      {
        label: 'Disciplinas',
        href: '/home/admin/disciplinas',
        icon: BookOpen,
        roles: ['admin'],
      },
      {
        label: 'Editais',
        href: '/home/admin/edital',
        icon: FileText,
        roles: ['admin'],
      },
    ],
  },

  // Admin - Sistema
  {
    label: 'Sistema',
    icon: TrendingUp,
    roles: ['admin'],
    items: [
      {
        label: 'Analytics',
        href: '/home/admin/analytics',
        icon: TrendingUp,
        roles: ['admin'],
      },
      {
        label: 'Arquivos',
        href: '/home/admin/files',
        icon: FileText,
        roles: ['admin'],
      },
    ],
  },

  // Professor - Projetos
  {
    label: 'Projetos',
    icon: FileText,
    roles: ['professor'],
    items: [
      {
        label: 'Novo Projeto',
        href: '/home/professor/projects',
        icon: FilePlus,
        roles: ['professor'],
      },
      {
        label: 'Meus Projetos',
        href: '/home/professor/dashboard',
        icon: FileText,
        roles: ['professor'],
      },
      {
        label: 'Gerenciar Voluntários',
        href: '/home/professor/volunteer-management',
        icon: Users,
        roles: ['professor'],
      },
      {
        label: 'Seleção de Monitores',
        href: '/home/common/selecao-monitores',
        icon: UserCog,
        roles: ['professor'],
      },
    ],
  },

  // Student - Monitoria
  {
    label: 'Monitoria',
    icon: GraduationCap,
    roles: ['student'],
    items: [
      {
        label: 'Inscrição em Monitoria',
        href: '/home/student/inscricao-monitoria',
        icon: FilePlus,
        roles: ['student'],
      },
      {
        label: 'Meu Status',
        href: '/home/common/status',
        icon: FileCheck,
        roles: ['student'],
      },
    ],
  },

  // Perfil - sempre último
  {
    label: 'Perfil',
    href: '/home/common/profile',
    icon: User,
    roles: ['admin', 'professor', 'student'],
  },
];

const SIDEBAR_OPEN_GROUPS_KEY = 'sidebar_open_groups';

export function SidebarLayout({ pathname }: SidebarLayoutProps) {
  const { user } = useAuth();
  const { isLessThanMediumDesktop, setOpenCompactSidebarView } = useSidebar();
  const navigate = useNavigate();
  const [openGroups, setOpenGroups] = useLocalStorage<string[]>(
    SIDEBAR_OPEN_GROUPS_KEY,
    [],
  );

  function handleNavigate(to: string) {
    navigate({ to });
    if (isLessThanMediumDesktop) setOpenCompactSidebarView(false);
  }

  function toggleGroup(groupLabel: string) {
    const newOpenGroups = new Set(openGroups);
    if (newOpenGroups.has(groupLabel)) {
      newOpenGroups.delete(groupLabel);
    } else {
      newOpenGroups.add(groupLabel);
    }
    setOpenGroups(Array.from(newOpenGroups));
  }

  function isItemActive(item: MenuItemConfig): boolean {
    const actualHref =
      typeof item.href === 'function'
        ? item.href(user!.role as UserRole)
        : item.href;

    const checkIsActive =
      item.isActive ||
      ((currentPathname, itemHref) => currentPathname === itemHref);

    return checkIsActive(pathname, actualHref);
  }

  function isGroupActive(group: MenuGroupConfig): boolean {
    return group.items.some((item) => isItemActive(item));
  }

  function renderMenuItem(item: MenuItemConfig) {
    const actualHref =
      typeof item.href === 'function'
        ? item.href(user!.role as UserRole)
        : item.href;

    return (
      <SidebarMenuItem key={actualHref}>
        <SidebarMenuButton
          asChild
          isActive={isItemActive(item)}
          tooltip={item.label}
          onClick={() => handleNavigate(actualHref)}
          className="text-base py-3"
        >
          <Link to={actualHref}>
            <item.icon className="h-5 w-5" />
            <span className="text-base font-medium">{item.label}</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  }

  function renderMenuGroup(group: MenuGroupConfig) {
    const isOpen = openGroups.includes(group.label);
    const isActive = isGroupActive(group);

    return (
      <Collapsible
        key={group.label}
        open={isOpen}
        onOpenChange={() => toggleGroup(group.label)}
      >
        <SidebarMenuItem>
          <CollapsibleTrigger asChild>
            <SidebarMenuButton
              tooltip={group.label}
              isActive={isActive}
              className="text-base py-3"
            >
              <group.icon className="h-5 w-5" />
              <span className="text-base font-medium">{group.label}</span>
              <ChevronRight
                className={`ml-auto h-4 w-4 transition-transform duration-200 ${
                  isOpen ? 'rotate-90' : ''
                }`}
              />
            </SidebarMenuButton>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <SidebarMenuSub>
              {group.items.map((item) => {
                const actualHref =
                  typeof item.href === 'function'
                    ? item.href(user!.role as UserRole)
                    : item.href;

                return (
                  <SidebarMenuSubItem key={actualHref}>
                    <SidebarMenuSubButton
                      asChild
                      isActive={isItemActive(item)}
                      onClick={() => handleNavigate(actualHref)}
                      className="text-sm py-2"
                    >
                      <Link to={actualHref}>
                        <item.icon className="h-4 w-4" />
                        <span className="text-sm font-medium">
                          {item.label}
                        </span>
                      </Link>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                );
              })}
            </SidebarMenuSub>
          </CollapsibleContent>
        </SidebarMenuItem>
      </Collapsible>
    );
  }

  const filteredMenuConfig = menuConfig.filter((config) => {
    if (!user?.role) return false;
    return config.roles.includes(user.role as UserRole);
  });

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
          {filteredMenuConfig.map((config) => {
            if (isMenuGroup(config)) {
              return renderMenuGroup(config);
            } else {
              return renderMenuItem(config);
            }
          })}
        </SidebarMenu>
      </SidebarContent>
    </Sidebar>
  );
}
