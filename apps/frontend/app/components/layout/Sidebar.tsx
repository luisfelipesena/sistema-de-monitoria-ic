'use client';

import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { cn } from '@/lib/utils';
import { BookOpen, Home, LogOut, Settings, User } from 'lucide-react';
import { Link, useLocation } from 'react-router';

interface SidebarItem {
  icon: React.ElementType;
  label: string;
  href: string;
}

const items: SidebarItem[] = [
  { icon: Home, label: 'Dashboard', href: '/home' },
  { icon: BookOpen, label: 'Projetos', href: '/home/projects' },
  { icon: User, label: 'Perfil', href: '/home/profile' },
  { icon: Settings, label: 'Configurações', href: '/home/settings' },
];

export function Sidebar() {
  const { user, signOut } = useAuth();
  const location = useLocation();

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className="fixed inset-y-0 left-0 flex flex-col w-64 h-screen pb-4 bg-white border-r border-gray-200">
      <div className="flex items-center h-16 px-6 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-blue-700">
          Sistema de Monitoria
        </h2>
      </div>

      {user && (
        <div className="flex items-center gap-3 p-4 border-b border-gray-200">
          <div className="flex items-center justify-center w-10 h-10 text-white bg-blue-500 rounded-full">
            {user.email?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-gray-900 truncate">{user.email}</p>
          </div>
        </div>
      )}

      <nav className="flex-1 px-3 mt-6 space-y-1">
        {items.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                'flex items-center px-3 py-2 text-sm font-medium rounded-md group',
                isActive
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-100',
              )}
            >
              <item.icon
                className={cn(
                  'mr-3 h-5 w-5',
                  isActive ? 'text-blue-700' : 'text-gray-400',
                )}
              />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 mt-6">
        <Button
          variant="outline"
          className="flex items-center justify-center w-full gap-2"
          onClick={handleSignOut}
        >
          <LogOut size={16} />
          <span>Sair</span>
        </Button>
      </div>
    </div>
  );
}
