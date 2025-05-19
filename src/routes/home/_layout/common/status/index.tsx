import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { createFileRoute, useNavigate } from '@tanstack/react-router';

export const Route = createFileRoute('/home/_layout/common/status/')({
  component: RouteComponent,
});

function RouteComponent() {
  const status = 'em análise'; // pode vir de API futuramente
  const navigate = useNavigate();

  return (
    <div className="max-w-4xl mx-auto px-6 py-12 space-y-8">
      <h1 className="text-3xl font-bold">Status da sua inscrição</h1>

      <Card className="p-6 space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-lg font-medium">Inscrição para Monitoria</p>
            <p className="text-muted-foreground">
              Código: MATB02 – Qualidade de Software
            </p>
          </div>
          <Badge variant="outline">{status}</Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Sua inscrição foi enviada e está aguardando análise pela coordenação
          do curso. Em breve você será notificada por e-mail.
        </p>
      </Card>

      <div className="flex justify-end">
        <Button
          variant="outline"
          onClick={() => navigate({ to: '/home/common/monitoria/signIn' })}
        >
          Voltar à inscrição
        </Button>
      </div>
    </div>
  );
}
