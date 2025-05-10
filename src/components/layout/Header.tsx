import { Link } from '@tanstack/react-router';
import { Bell, ChevronDown, Menu, MessageSquare, Search } from 'lucide-react';
import { useState } from 'react';

import { useAuth } from '@/hooks/use-auth';
import { Button } from '../ui/button';

interface HeaderProps {
  onMenuClick?: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const { user, signOut } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Toggle user dropdown menu
  const toggleUserMenu = () => {
    setShowUserMenu(!showUserMenu);
  };

  // Extrair o primeiro caractere do ID do usuário como fallback
  const userInitial = user?.id?.toString()?.[0] || 'U';
  // Nome de usuário extraído do email (parte antes do @)
  const userName = user?.email?.split('@')[0] || 'Usuário';

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center border-b border-border bg-background px-4 shadow-sm">
      <div className="flex w-full items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="transparent"
            size="icon"
            onClick={onMenuClick}
            className="md:hidden"
          >
            <Menu />
          </Button>

          <div className="relative hidden md:flex">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar..."
              className="h-10 rounded-md border border-input bg-background pl-10 pr-4 text-sm focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="transparent"
            size="icon"
            className="text-muted-foreground"
          >
            <Bell />
          </Button>
          <Button
            variant="transparent"
            size="icon"
            className="text-muted-foreground"
          >
            <MessageSquare />
          </Button>

          <div className="relative">
            <Button
              variant="transparent"
              className="flex items-center gap-2 px-2 py-1"
              onClick={toggleUserMenu}
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
                {userInitial}
              </div>
              <span className="hidden text-sm font-medium md:block">
                {userName}
              </span>
              <ChevronDown className="h-4 w-4" />
            </Button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-56 origin-top-right rounded-md border border-border bg-card py-1 shadow-md">
                <div className="border-b border-border px-4 py-2">
                  <p className="font-medium">{userName}</p>
                  <p className="text-sm text-muted-foreground">{user?.email}</p>
                </div>
                <Link
                  to="/home/profile"
                  className="block px-4 py-2 text-sm hover:bg-accent"
                >
                  Meu Perfil
                </Link>
                <Link
                  to="/"
                  className="block px-4 py-2 text-sm hover:bg-accent"
                  onClick={() => {
                    signOut();
                  }}
                >
                  Sair
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
