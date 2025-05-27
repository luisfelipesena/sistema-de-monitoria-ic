import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { useAuth } from '@/hooks/use-auth';
import { useDownloadTermoCompromisso } from '@/hooks/use-vaga';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { FileText } from 'lucide-react';
import { toast } from 'sonner';

export const Route = createFileRoute('/home/_layout/common/status/')({
  component: RouteComponent,
});

type StatusInscricao = 'em análise' | 'aprovado' | 'rejeitado';

function RouteComponent() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const downloadTermoMutation = useDownloadTermoCompromisso();

  const hasInscription = true;

  const handleDownloadTermoCompromisso = async (vagaId: number) => {
    try {
      await downloadTermoMutation.mutateAsync(vagaId);
      toast.success('Termo de compromisso baixado com sucesso!');
    } catch (error) {
      toast.error('Erro ao baixar termo de compromisso. Tente novamente.');
    }
  };

  const getStatus = (): StatusInscricao => {
    return 'em análise';
  };

  const status = getStatus();
  const projeto = {
    codigo: 'MATB02',
    nome: 'Qualidade de Software',
  };

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-12 space-y-8">
        <div className="flex justify-center">
          <Spinner />
        </div>
      </div>
    );
  }

  if (!hasInscription) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-12 space-y-8">
        <h1 className="text-3xl font-bold">Status da sua inscrição</h1>

        <Card className="p-6 text-center space-y-4">
          <p className="text-lg text-muted-foreground">
            Você ainda não possui inscrições ativas para monitoria.
          </p>
          <Button onClick={() => navigate({ to: '/home/common/monitoria' })}>
            Fazer inscrição
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-12 space-y-8">
      <h1 className="text-3xl font-bold">Status da sua inscrição</h1>

      <Card className="p-6 space-y-4">
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <p className="text-lg font-medium">Inscrição para Monitoria</p>
            <p className="text-muted-foreground">
              {projeto.codigo} – {projeto.nome}
            </p>
            <p className="text-sm text-muted-foreground">
              Aluno: {user.username}
            </p>
          </div>
          <Badge
            variant={
              status === 'aprovado'
                ? 'default'
                : status === 'rejeitado'
                  ? 'destructive'
                  : 'outline'
            }
          >
            {status}
          </Badge>
        </div>

        <div className="pt-4 border-t">
          {status === 'em análise' && (
            <p className="text-sm text-muted-foreground">
              Sua inscrição foi enviada e está aguardando análise pela
              coordenação do curso. Em breve você será notificado por e-mail
              sobre o resultado.
            </p>
          )}
          {status === 'aprovado' && (
            <div className="space-y-4">
              <p className="text-sm text-green-700 bg-green-50 p-3 rounded">
                🎉 Parabéns! Sua inscrição foi aprovada. Verifique seu e-mail
                para as próximas instruções.
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownloadTermoCompromisso(1)}
                  className="flex items-center gap-2"
                >
                  <FileText className="h-4 w-4" />
                  Baixar Termo de Compromisso
                </Button>
              </div>
            </div>
          )}
          {status === 'rejeitado' && (
            <p className="text-sm text-red-700 bg-red-50 p-3 rounded">
              Sua inscrição não foi aprovada desta vez. Você pode tentar
              novamente no próximo período de inscrições.
            </p>
          )}
        </div>
      </Card>

      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => navigate({ to: '/home/common/monitoria' })}
        >
          Nova inscrição
        </Button>
        <Button variant="outline" onClick={() => navigate({ to: '/home' })}>
          Voltar ao início
        </Button>
      </div>
    </div>
  );
}
