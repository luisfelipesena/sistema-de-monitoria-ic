import { Link } from '@tanstack/react-router';
import { Bell, MessageSquare } from 'lucide-react';

import { SidebarTrigger } from '@/components/ui/sidebar';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';

export function Header() {
  const { user, signOut } = useAuth();

  const userInitials = user?.username?.slice(0, 2);
  const userName = user?.username;

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center border-b border-border bg-background px-4 shadow-sm">
      <div className="flex w-full items-center justify-between">
        <div className="flex items-center gap-4">
          <SidebarTrigger />
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

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="transparent"
                className="flex items-center gap-2 px-2 py-1"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  {userInitials}
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <p className="font-medium">{userName}</p>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/home/profile">Meu Perfil</Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => signOut()} asChild>
                <div>Sair</div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
