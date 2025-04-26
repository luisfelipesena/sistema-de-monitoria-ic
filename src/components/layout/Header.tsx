import { SidebarTrigger } from '@/components/ui/sidebar';
import { useAuth } from '@/hooks/use-auth';

export function Header() {
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-10 flex items-center justify-between h-12 px-4 border-b bg-background md:px-6">
      <SidebarTrigger />
      <div className="flex items-center gap-2">
        <p className="text-sm text-muted-foreground">{user?.email}</p>
      </div>
    </header>
  );
}
