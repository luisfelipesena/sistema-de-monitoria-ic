import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
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
} from "@/components/ui/sidebar"
import { useAuth } from "@/hooks/use-auth"
import { useLocalStorage } from "@/hooks/use-local-storage"
import {
  ArrowLeftRight,
  Award,
  BookOpen,
  Building,
  ChevronRight,
  ClipboardCheck,
  FileCheck,
  FilePlus,
  FileSignature,
  FileSpreadsheet,
  FileText,
  GraduationCap,
  LayoutDashboard,
  Mail,
  ScrollText,
  Settings,
  TrendingUp,
  Upload,
  User,
  UserCog,
  UserPlus,
  Users,
  type LucideIcon,
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

type SidebarLayoutProps = {
  pathname: string
}

type UserRole = "admin" | "professor" | "student"

type MenuItemConfig = {
  label: string
  href: string | ((role: UserRole) => string)
  icon: LucideIcon
  roles: UserRole[]
  isActive?: (pathname: string, itemHref: string) => boolean
}

type MenuGroupConfig = {
  label: string
  icon: LucideIcon
  roles: UserRole[]
  items: MenuItemConfig[]
}

type MenuConfig = MenuItemConfig | MenuGroupConfig

const isMenuGroup = (item: MenuConfig): item is MenuGroupConfig => {
  return "items" in item
}

const menuConfig: MenuConfig[] = [
  // ============ ADMIN MENU ============
  // 1. Dashboard
  {
    label: "Dashboard",
    href: (role) => `/home/${role}/dashboard`,
    icon: LayoutDashboard,
    roles: ["admin", "student"],
  },

  // 2. Projetos
  {
    label: "Projetos",
    icon: FileText,
    roles: ["admin"],
    items: [
      {
        label: "Importar Planejamento",
        href: "/home/admin/import-projects",
        icon: Upload,
        roles: ["admin"],
      },
      {
        label: "Gerenciar Projetos",
        href: "/home/admin/manage-projects",
        icon: FileText,
        roles: ["admin"],
      },
      {
        label: "Planilha IC PROGRAD",
        href: "/home/admin/planilha-prograd",
        icon: FileSpreadsheet,
        roles: ["admin"],
      },
      {
        label: "Templates de Projeto",
        href: "/home/admin/projeto-templates",
        icon: FileText,
        roles: ["admin"],
      },
      {
        label: "Assinar Documentos",
        href: "/home/professor/assinatura-documentos",
        icon: FileSignature,
        roles: ["admin"],
      },
    ],
  },

  // 3. Editais
  {
    label: "Editais",
    icon: FileText,
    roles: ["admin"],
    items: [
      {
        label: "Gerenciar Editais",
        href: "/home/admin/edital-management",
        icon: FileText,
        roles: ["admin"],
      },
      {
        label: "Alocação de Bolsas",
        href: "/home/admin/scholarship-allocation",
        icon: Award,
        roles: ["admin"],
      },
    ],
  },

  // 4. Inscrições
  {
    label: "Inscrições",
    icon: FilePlus,
    roles: ["admin"],
    items: [
      {
        label: "Visualizar Inscrições",
        href: "/home/admin/inscricoes",
        icon: FilePlus,
        roles: ["admin"],
      },
    ],
  },

  // 5. Seleção
  {
    label: "Seleção",
    icon: ClipboardCheck,
    roles: ["admin"],
    items: [
      {
        label: "Gerenciar Seleções",
        href: "/home/admin/selecao",
        icon: ClipboardCheck,
        roles: ["admin"],
      },
      {
        label: "Atas de Seleção",
        href: "/home/admin/atas-selecao",
        icon: FileText,
        roles: ["admin"],
      },
    ],
  },

  // 6. Relatórios
  {
    label: "Relatórios",
    icon: FileSpreadsheet,
    roles: ["admin"],
    items: [
      {
        label: "Consolidação PROGRAD",
        href: "/home/admin/consolidacao-prograd",
        icon: FileSpreadsheet,
        roles: ["admin"],
      },
      {
        label: "Relatório por Disciplina",
        href: "/home/admin/relatorio-disciplina",
        icon: BookOpen,
        roles: ["admin"],
      },
      {
        label: "Relatório por Monitor",
        href: "/home/admin/relatorio-monitor",
        icon: Users,
        roles: ["admin"],
      },
    ],
  },

  // 7. Usuários
  {
    label: "Usuários",
    icon: Users,
    roles: ["admin"],
    items: [
      {
        label: "Todos os Usuários",
        href: "/home/admin/users",
        icon: Users,
        roles: ["admin"],
      },
      {
        label: "Professores",
        href: "/home/admin/professores",
        icon: UserCog,
        roles: ["admin"],
      },
      {
        label: "Alunos",
        href: "/home/admin/alunos",
        icon: UserPlus,
        roles: ["admin"],
      },
    ],
  },

  // 8. Configurações
  {
    label: "Configurações",
    icon: Settings,
    roles: ["admin"],
    items: [
      {
        label: "Departamentos",
        href: "/home/admin/departamentos",
        icon: Building,
        roles: ["admin"],
      },
      {
        label: "Disciplinas",
        href: "/home/admin/disciplinas",
        icon: BookOpen,
        roles: ["admin"],
      },
      {
        label: "Equivalências de Disciplinas",
        href: "/home/admin/equivalencias",
        icon: ArrowLeftRight,
        roles: ["admin"],
      },
      {
        label: "Email",
        href: "/home/admin/configuracoes",
        icon: Mail,
        roles: ["admin"],
      },
    ],
  },

  // 9. Sistema
  {
    label: "Sistema",
    icon: TrendingUp,
    roles: ["admin"],
    items: [
      {
        label: "Analytics",
        href: "/home/admin/analytics",
        icon: TrendingUp,
        roles: ["admin"],
      },
      {
        label: "Notificações",
        href: "/home/admin/notificacoes",
        icon: Mail,
        roles: ["admin"],
      },
      {
        label: "Logs de Auditoria",
        href: "/home/admin/audit-logs",
        icon: ScrollText,
        roles: ["admin"],
      },
    ],
  },

  // ============ PROFESSOR MENU ============
  // Professor - Meus Projetos
  {
    label: "Meus Projetos",
    icon: FileText,
    roles: ["professor"],
    items: [
      {
        label: "Dashboard",
        href: "/home/professor/dashboard",
        icon: LayoutDashboard,
        roles: ["professor"],
      },
      {
        label: "Novo Projeto",
        href: "/home/professor/projetos/novo",
        icon: FilePlus,
        roles: ["professor"],
      },
      {
        label: "Assinar Documentos",
        href: "/home/professor/assinatura-documentos",
        icon: FileSignature,
        roles: ["professor"],
      },
    ],
  },

  // Professor - Processo Seletivo
  {
    label: "Processo Seletivo",
    icon: ClipboardCheck,
    roles: ["professor"],
    items: [
      {
        label: "Gerenciar Candidatos",
        href: "/home/professor/candidatos",
        icon: Users,
        roles: ["professor"],
      },
      {
        label: "Avaliar Candidatos",
        href: "/home/professor/grade-applications",
        icon: FileCheck,
        roles: ["professor"],
      },
      {
        label: "Selecionar Monitores",
        href: "/home/professor/select-monitors",
        icon: Users,
        roles: ["professor"],
      },
      {
        label: "Publicar Resultados",
        href: "/home/professor/publicar-resultados",
        icon: FileCheck,
        roles: ["professor"],
      },
    ],
  },

  // Professor - Documentos
  {
    label: "Documentos",
    icon: FileSignature,
    roles: ["professor"],
    items: [
      {
        label: "Atas de Seleção",
        href: "/home/professor/atas-selecao",
        icon: FileText,
        roles: ["professor"],
      },
      {
        label: "Termos de Compromisso",
        href: "/home/professor/termos-compromisso",
        icon: FileText,
        roles: ["professor"],
      },
      {
        label: "Relatórios Finais",
        href: "/home/professor/relatorios-finais",
        icon: FileCheck,
        roles: ["professor"],
      },
    ],
  },

  // Professor - Gestão Acadêmica
  {
    label: "Gestão Acadêmica",
    icon: BookOpen,
    roles: ["professor"],
    items: [
      {
        label: "Gerenciar Voluntários",
        href: "/home/professor/volunteer-management",
        icon: Users,
        roles: ["professor"],
      },
    ],
  },

  // ============ STUDENT MENU ============
  // Student - Monitoria
  {
    label: "Monitoria",
    icon: GraduationCap,
    roles: ["student"],
    items: [
      {
        label: "Inscrição em Monitoria",
        href: "/home/student/inscricao-monitoria",
        icon: FilePlus,
        roles: ["student"],
      },
      {
        label: "Vagas Disponíveis",
        href: "/home/student/vagas",
        icon: Award,
        roles: ["student"],
      },
      {
        label: "Resultados das Seleções",
        href: "/home/student/resultados",
        icon: FileCheck,
        roles: ["student"],
      },
      {
        label: "Relatórios Finais",
        href: "/home/student/relatorios",
        icon: FileText,
        roles: ["student"],
      },
      {
        label: "Meu Status",
        href: "/home/student/status",
        icon: FileCheck,
        roles: ["student"],
      },
      {
        label: "Certificados",
        href: "/home/student/certificados",
        icon: Award,
        roles: ["student"],
      },
    ],
  },

  // ============ COMMON (TODOS) ============
  // 10. Perfil - sempre último
  {
    label: "Perfil",
    href: "/home/profile",
    icon: User,
    roles: ["admin", "professor", "student"],
  },
]

const SIDEBAR_OPEN_GROUPS_KEY = "sidebar_open_groups"

export function SidebarLayout({ pathname }: SidebarLayoutProps) {
  const { user } = useAuth()
  const { isLessThan3xl, setOpenCompactSidebarView } = useSidebar()
  const router = useRouter()
  const [openGroups, setOpenGroups] = useLocalStorage<string[]>(SIDEBAR_OPEN_GROUPS_KEY, [])

  function handleNavigate(to: string) {
    router.push(to)
    if (isLessThan3xl) setOpenCompactSidebarView(false)
  }

  function toggleGroup(groupLabel: string) {
    const newOpenGroups = new Set(openGroups)
    if (newOpenGroups.has(groupLabel)) {
      newOpenGroups.delete(groupLabel)
    } else {
      newOpenGroups.add(groupLabel)
    }
    setOpenGroups(Array.from(newOpenGroups))
  }

  function isItemActive(item: MenuItemConfig): boolean {
    const actualHref = typeof item.href === "function" ? item.href(user!.role as UserRole) : item.href

    const checkIsActive = item.isActive || ((currentPathname, itemHref) => currentPathname === itemHref)

    return checkIsActive(pathname, actualHref)
  }

  function isGroupActive(group: MenuGroupConfig): boolean {
    return group.items.some((item) => isItemActive(item))
  }

  function renderMenuItem(item: MenuItemConfig) {
    const actualHref = typeof item.href === "function" ? item.href(user!.role as UserRole) : item.href

    return (
      <SidebarMenuItem key={actualHref}>
        <SidebarMenuButton
          asChild
          isActive={isItemActive(item)}
          tooltip={item.label}
          onClick={() => handleNavigate(actualHref)}
          className="text-base py-3"
        >
          <Link href={actualHref}>
            <item.icon className="h-5 w-5" />
            <span className="text-base font-medium">{item.label}</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    )
  }

  function renderMenuGroup(group: MenuGroupConfig) {
    const isOpen = openGroups.includes(group.label)
    const isActive = isGroupActive(group)

    return (
      <Collapsible key={group.label} open={isOpen} onOpenChange={() => toggleGroup(group.label)}>
        <SidebarMenuItem>
          <CollapsibleTrigger asChild>
            <SidebarMenuButton tooltip={group.label} isActive={isActive} className="text-base py-3">
              <group.icon className="h-5 w-5" />
              <span className="text-base font-medium">{group.label}</span>
              <ChevronRight
                className={`ml-auto h-4 w-4 transition-transform duration-200 ${isOpen ? "rotate-90" : ""}`}
              />
            </SidebarMenuButton>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <SidebarMenuSub>
              {group.items.map((item) => {
                const actualHref = typeof item.href === "function" ? item.href(user!.role as UserRole) : item.href

                return (
                  <SidebarMenuSubItem key={actualHref}>
                    <SidebarMenuSubButton
                      asChild
                      isActive={isItemActive(item)}
                      onClick={() => handleNavigate(actualHref)}
                      className="text-sm py-2"
                    >
                      <Link href={actualHref}>
                        <item.icon className="h-4 w-4" />
                        <span className="text-sm font-medium">{item.label}</span>
                      </Link>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                )
              })}
            </SidebarMenuSub>
          </CollapsibleContent>
        </SidebarMenuItem>
      </Collapsible>
    )
  }

  const filteredMenuConfig = menuConfig.filter((config) => {
    if (!user?.role) return false
    return config.roles.includes(user.role as UserRole)
  })

  return (
    <Sidebar className="z-30">
      <SidebarHeader>
        <div className="flex flex-col items-center gap-2 mb-4">
          <img src="/images/ic-logo-clean.png" alt="Monitoria IC" className="h-32 w-18" />
          <span className="text-xl font-semibold">Monitoria IC</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu className="text-base">
          {filteredMenuConfig.map((config) => {
            if (isMenuGroup(config)) {
              return renderMenuGroup(config)
            } else {
              return renderMenuItem(config)
            }
          })}
        </SidebarMenu>
      </SidebarContent>
    </Sidebar>
  )
}
