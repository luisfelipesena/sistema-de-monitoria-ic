import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { cn } from '@/lib/utils';

export function Header(p: { className?: string }) {
  const { signIn } = useAuth();

  return (
    <header
      className={cn(
        'sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60',
        p.className,
      )}
    >
      <nav className="flex items-center justify-between px-6 py-4 bg-white shadow-sm">
        <div className="text-xl font-bold text-blue-700">
          Sistema de Monitoria IC
        </div>
        <div className="flex gap-4">
          <Button className="bg-blue-700 hover:bg-blue-800" onClick={signIn}>
            Entrar com Email UFBA
          </Button>
        </div>
      </nav>
    </header>
  );
}
