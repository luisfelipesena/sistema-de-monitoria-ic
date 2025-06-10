"use client"

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
import {
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
import { usePathname } from "next/navigation"
import * as React from "react"

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
  // Dashboard
  {
    label: "Dashboard",
    href: (role) => `/dashboard/${role}`,
    icon: LayoutDashboard,
    roles: ["admin", "student"],
  },

  // Admin - Projetos
  {
    label: "Projetos",
    icon: FileText,
    roles: ["admin"],
    items: [
      {
        label: "Gerenciar Projetos",
        href: "/dashboard/admin/projetos",
        icon: FileText,
        roles: ["admin"],
      },
      {
        label: "Assinatura de Documentos",
        href: "/dashboard/admin/assinatura",
        icon: FileSignature,
        roles: ["admin"],
      },
      {
        label: "Importar Planejamento",
        href: "/dashboard/admin/importar",
        icon: Upload,
        roles: ["admin"],
      },
      {
        label: "Alocação de Bolsas",
        href: "/dashboard/admin/bolsas",
        icon: Award,
        roles: ["admin"],
      },
    ],
  },

  // Admin - Usuários
  {
    label: "Usuários",
    icon: Users,
    roles: ["admin"],
    items: [
      {
        label: "Todos os Usuários",
        href: "/dashboard/admin/usuarios",
        icon: Users,
        roles: ["admin"],
      },
      {
        label: "Professores",
        href: "/dashboard/admin/professores",
        icon: UserCog,
        roles: ["admin"],
      },
      {
        label: "Alunos",
        href: "/dashboard/admin/alunos",
        icon: UserPlus,
        roles: ["admin"],
      },
      {
        label: "Convidar Professor",
        href: "/dashboard/admin/convidar",
        icon: UserPlus,
        roles: ["admin"],
      },
    ],
  },

  // Admin - Configurações Acadêmicas
  {
    label: "Configurações",
    icon: Settings,
    roles: ["admin"],
    items: [
      {
        label: "Cursos",
        href: "/dashboard/admin/cursos",
        icon: GraduationCap,
        roles: ["admin"],
      },
      {
        label: "Departamentos",
        href: "/dashboard/admin/departamentos",
        icon: Building,
        roles: ["admin"],
      },
      {
        label: "Disciplinas",
        href: "/dashboard/admin/disciplinas",
        icon: BookOpen,
        roles: ["admin"],
      },
      {
        label: "Gerenciar Editais",
        href: "/dashboard/admin/editais",
        icon: FileText,
        roles: ["admin"],
      },
      {
        label: "Períodos de Inscrição",
        href: "/dashboard/admin/periodos",
        icon: FilePlus,
        roles: ["admin"],
      },
      {
        label: "Templates de Projeto",
        href: "/dashboard/admin/templates",
        icon: FileText,
        roles: ["admin"],
      },
    ],
  },

  // Admin - Sistema
  {
    label: "Sistema",
    icon: TrendingUp,
    roles: ["admin"],
    items: [
      {
        label: "Analytics",
        href: "/dashboard/admin/analytics",
        icon: TrendingUp,
        roles: ["admin"],
      },
      {
        label: "Relatórios PROGRAD",
        href: "/dashboard/admin/relatorios",
        icon: FileSpreadsheet,
        roles: ["admin"],
      },
      {
        label: "Arquivos",
        href: "/dashboard/admin/arquivos",
        icon: FileText,
        roles: ["admin"],
      },
    ],
  },

  // Professor - Meus Projetos
  {
    label: "Meus Projetos",
    icon: FileText,
    roles: ["professor"],
    items: [
      {
        label: "Dashboard",
        href: "/dashboard/professor",
        icon: LayoutDashboard,
        roles: ["professor"],
      },
      {
        label: "Gerenciar Projetos",
        href: "/dashboard/professor/projetos",
        icon: FilePlus,
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
        href: "/dashboard/professor/candidatos",
        icon: Users,
        roles: ["professor"],
      },
      {
        label: "Seleção de Monitores",
        href: "/dashboard/professor/selecao",
        icon: UserCog,
        roles: ["professor"],
      },
      {
        label: "Avaliar Candidatos",
        href: "/dashboard/professor/avaliacoes",
        icon: FileCheck,
        roles: ["professor"],
      },
      {
        label: "Publicar Resultados",
        href: "/dashboard/professor/resultados",
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
        label: "Assinatura de Documentos",
        href: "/dashboard/professor/assinatura",
        icon: FileSignature,
        roles: ["professor"],
      },
      {
        label: "Gerar Ata de Seleção",
        href: "/dashboard/professor/atas",
        icon: FileText,
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
        label: "Minhas Disciplinas",
        href: "/dashboard/professor/disciplinas",
        icon: BookOpen,
        roles: ["professor"],
      },
      {
        label: "Gerenciar Voluntários",
        href: "/dashboard/professor/voluntarios",
        icon: Users,
        roles: ["professor"],
      },
    ],
  },

  // Student - Monitoria
  {
    label: "Monitoria",
    icon: GraduationCap,
    roles: ["student"],
    items: [
      {
        label: "Inscrição em Monitoria",
        href: "/dashboard/student/inscricao",
        icon: FilePlus,
        roles: ["student"],
      },
      {
        label: "Resultados das Seleções",
        href: "/dashboard/student/resultados",
        icon: FileCheck,
        roles: ["student"],
      },
      {
        label: "Meu Status",
        href: "/dashboard/student/status",
        icon: FileCheck,
        roles: ["student"],
      },
    ],
  },

  // Perfil - sempre último
  {
    label: "Perfil",
    href: "/dashboard/profile",
    icon: User,
    roles: ["admin", "professor", "student"],
  },
]

interface SidebarLayoutProps {
  user?: {
    role: UserRole
  }
}

export function SidebarLayout({ user }: SidebarLayoutProps) {
  const pathname = usePathname()
  const { setOpenCompactSidebarView } = useSidebar()
  const [openGroups, setOpenGroups] = React.useState<string[]>([])

  React.useEffect(() => {
    const storedOpenGroups = localStorage.getItem("sidebarOpenGroups")
    if (storedOpenGroups) {
      setOpenGroups(JSON.parse(storedOpenGroups))
    }
  }, [])

  function toggleGroup(groupLabel: string) {
    const newOpenGroups = new Set(openGroups)
    if (newOpenGroups.has(groupLabel)) {
      newOpenGroups.delete(groupLabel)
    } else {
      newOpenGroups.add(groupLabel)
    }
    const openGroupsArray = Array.from(newOpenGroups)
    setOpenGroups(openGroupsArray)
    localStorage.setItem("sidebarOpenGroups", JSON.stringify(openGroupsArray))
  }

  function isItemActive(item: MenuItemConfig): boolean {
    const actualHref = typeof item.href === "function" ? item.href(user?.role || "student") : item.href

    const checkIsActive = item.isActive || ((currentPathname, itemHref) => currentPathname === itemHref)

    return checkIsActive(pathname, actualHref)
  }

  function isGroupActive(group: MenuGroupConfig): boolean {
    return group.items.some((item) => isItemActive(item))
  }

  function renderMenuItem(item: MenuItemConfig) {
    const actualHref = typeof item.href === "function" ? item.href(user?.role || "student") : item.href

    return (
      <SidebarMenuItem key={actualHref}>
        <SidebarMenuButton
          asChild
          isActive={isItemActive(item)}
          tooltip={item.label}
          className="text-base py-3"
          onClick={() => setOpenCompactSidebarView(false)}
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
                const actualHref = typeof item.href === "function" ? item.href(user?.role || "student") : item.href

                return (
                  <SidebarMenuSubItem key={actualHref}>
                    <SidebarMenuSubButton
                      asChild
                      isActive={isItemActive(item)}
                      className="text-sm py-2"
                      onClick={() => setOpenCompactSidebarView(false)}
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
    return config.roles.includes(user.role)
  })

  return (
    <Sidebar className="border-r">
      <SidebarHeader className="border-b">
        <div className="flex flex-col items-center gap-2 py-4">
          <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center">
            <img src="/images/ic-logo-clean.png" alt="Monitoria IC" className="h-12 w-12 object-contain" />
          </div>
          <div className="text-center">
            <h2 className="text-lg font-semibold text-sidebar-foreground">Monitoria IC</h2>
            <p className="text-xs text-sidebar-foreground/70">Sistema de Monitoria</p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent className="py-2">
        <SidebarMenu>
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
