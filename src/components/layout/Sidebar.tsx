import { useAuth } from '@/hooks/use-auth';
import { cn } from '@/lib/utils';
import { Link, useLocation, useNavigate } from '@tanstack/react-router';
import {
  Building2,
  CalendarDays,
  ChevronDown,
  FileCheck,
  Folder,
  GraduationCap,
  Home,
  Library,
  LogOut,
  Settings,
  User,
  Users,
} from 'lucide-react';
import React, { useState } from 'react';

import { Button } from '../ui/button';

// Define the type for navigation item
type NavItem = {
  label: string;
  href: string;
  icon: React.ReactNode;
  access: string[];
};

// Define the type for navigation group
type NavGroup = {
  label: string;
  icon: React.ReactNode;
  items: NavItem[];
  access: string[];
};

// Navigation items grouped by section
const navigation: (NavItem | NavGroup)[] = [
  {
    label: 'Início',
    href: '/home',
    icon: <Home />,
    access: ['admin', 'professor', 'student'],
  },
  {
    label: 'Projetos',
    href: '/home/projects',
    icon: <Folder />,
    access: ['admin', 'professor', 'student'],
  },
  {
    label: 'Teste',
    href: '/home/test',
    icon: <Folder />,
    access: ['admin', 'professor', 'student'],
  },
  {
    label: 'Monitores',
    href: '/home/monitors',
    icon: <Users />,
    access: ['admin', 'professor'],
  },
  {
    label: 'Relatório',
    icon: <FileCheck />,
    access: ['admin'],
    items: [
      {
        label: 'Por departamento',
        href: '/home/reports/department',
        icon: <Building2 />,
        access: ['admin'],
      },
      {
        label: 'Por semestre',
        href: '/home/reports/semester',
        icon: <CalendarDays />,
        access: ['admin'],
      },
    ],
  },
  {
    label: 'Admin',
    icon: <Settings />,
    access: ['admin'],
    items: [
      {
        label: 'Departamentos',
        href: '/home/admin/departments',
        icon: <Building2 />,
        access: ['admin'],
      },
      {
        label: 'Disciplinas',
        href: '/home/admin/disciplines',
        icon: <Library />,
        access: ['admin'],
      },
      {
        label: 'Semestres',
        href: '/home/admin/semesters',
        icon: <CalendarDays />,
        access: ['admin'],
      },
      {
        label: 'Usuários',
        href: '/home/admin/users',
        icon: <User />,
        access: ['admin'],
      },
    ],
  },
];

export function Sidebar() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [expandedGroups, setExpandedGroups] = useState<{
    [key: string]: boolean;
  }>({});

  // Filter navigation items based on user role
  const filteredNavigation = navigation.filter((item) =>
    item.access.includes(user?.role || ''),
  );

  // Toggle a navigation group expansion
  const toggleGroup = (label: string) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [label]: !prev[label],
    }));
  };

  // Check if a path is active
  const isPathActive = (path: string) => {
    return (
      location.pathname === path || location.pathname.startsWith(path + '/')
    );
  };

  // Check if a group is active (any of its items is active)
  const isGroupActive = (items: NavItem[]) => {
    return items.some((item) => isPathActive(item.href));
  };

  // Handle sign out
  const handleSignOut = async () => {
    await signOut();
    navigate({ to: '/' });
  };

  return (
    <aside className="flex min-h-screen w-64 flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex h-16 items-center border-b border-sidebar-border px-4">
        <Link to="/home" className="flex items-center gap-2">
          <GraduationCap size={24} className="text-sidebar-foreground" />
          <span className="text-lg font-semibold">Sistema de Monitoria</span>
        </Link>
      </div>

      <div className="flex-1 overflow-auto py-4">
        <nav className="space-y-1 px-2">
          {filteredNavigation.map((item, i) => {
            // Check if item is a group
            if ('items' in item) {
              const group = item as NavGroup;
              const isActive = isGroupActive(group.items);
              const isExpanded = expandedGroups[group.label] || isActive;

              return (
                <div key={i} className="space-y-1">
                  <button
                    className={cn(
                      'sidebar-link w-full justify-between',
                      isActive && 'font-medium text-white bg-sidebar-accent',
                    )}
                    onClick={() => toggleGroup(group.label)}
                  >
                    <span className="flex items-center gap-2">
                      {group.icon}
                      {group.label}
                    </span>
                    <ChevronDown
                      size={16}
                      className={cn(
                        'transition-transform',
                        isExpanded && 'rotate-180',
                      )}
                    />
                  </button>

                  {isExpanded && (
                    <div className="ml-4 space-y-1 border-l border-sidebar-border pl-4">
                      {group.items.map((subItem, j) => (
                        <Link
                          key={j}
                          to={subItem.href}
                          className={cn(
                            'sidebar-link',
                            isPathActive(subItem.href) && 'active',
                          )}
                        >
                          {subItem.icon}
                          {subItem.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            } else {
              // Regular nav item
              const navItem = item as NavItem;
              return (
                <Link
                  key={i}
                  to={navItem.href}
                  className={cn(
                    'sidebar-link',
                    isPathActive(navItem.href) && 'active',
                  )}
                >
                  {navItem.icon}
                  {navItem.label}
                </Link>
              );
            }
          })}
        </nav>
      </div>

      <div className="border-t border-sidebar-border p-4">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sidebar-accent text-lg font-semibold uppercase">
            {user?.username?.charAt(0) || 'U'}
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="truncate font-medium">
              {user?.username || 'Usuário'}
            </p>
            <p className="truncate text-sm text-sidebar-foreground/70">
              {user?.email || 'email@ufba.br'}
            </p>
          </div>
        </div>
        <Button
          onClick={handleSignOut}
          variant="transparent"
          className="w-full justify-start border-sidebar-foreground/20 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground"
        >
          <LogOut />
          Sair
        </Button>
      </div>
    </aside>
  );
}
