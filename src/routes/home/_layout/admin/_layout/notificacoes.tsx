import { PagesLayout } from '@/components/layout/PagesLayout';
import { TableComponent } from '@/components/layout/TableComponent';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useInscricoesProjeto } from '@/hooks/use-inscricao';
import { useProjetos } from '@/hooks/use-projeto';
import { createFileRoute } from '@tanstack/react-router';
import { ColumnDef } from '@tanstack/react-table';
import {
  Bell,
  CheckCircle,
  Clock,
  Mail,
  MessageSquare,
  Send,
  Users,
  XCircle,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

export const Route = createFileRoute(
  '/home/_layout/admin/_layout/notificacoes',
)({
  component: NotificacoesPage,
});

interface NotificacaoHistorico {
  id: number;
  tipo: 'SELECAO_RESULTADO' | 'PROJETO_APROVADO' | 'INSCRICAO_CONFIRMADA';
  destinatario: string;
  assunto: string;
  status: 'ENVIADO' | 'FALHOU' | 'PENDENTE';
  dataEnvio: Date;
  projetoId?: number;
}

interface NotificacaoForm {
  tipo:
    | 'SELECAO_RESULTADO'
    | 'PROJETO_APROVADO'
    | 'INSCRICAO_CONFIRMADA'
    | 'MANUAL';
  projetoId?: number;
  destinatarios: string[];
  assunto: string;
  conteudo: string;
}

// Mock data - Em produção virá da API
const mockHistorico: NotificacaoHistorico[] = [
  {
    id: 1,
    tipo: 'SELECAO_RESULTADO',
    destinatario: 'joao.silva@ufba.br',
    assunto: 'Resultado da Seleção - Monitoria MATA01',
    status: 'ENVIADO',
    dataEnvio: new Date('2024-01-15T10:30:00'),
    projetoId: 1,
  },
  {
    id: 2,
    tipo: 'PROJETO_APROVADO',
    destinatario: 'prof.santos@ufba.br',
    assunto: 'Projeto de Monitoria Aprovado',
    status: 'ENVIADO',
    dataEnvio: new Date('2024-01-14T14:20:00'),
    projetoId: 2,
  },
];

function NotificacoesPage() {
  const { data: projetos } = useProjetos();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(
    null,
  );
  const [formData, setFormData] = useState<Partial<NotificacaoForm>>({
    tipo: 'MANUAL',
    destinatarios: [],
    assunto: '',
    conteudo: '',
  });

  const { data: inscricoes } = useInscricoesProjeto(selectedProjectId || 0);

  const handleEnviarNotificacao = async () => {
    try {
      // TODO: Implementar API call para enviar notificação
      // await sendNotificationAPI(formData);

      console.log('Enviando notificação:', formData);
      toast.success('Notificação enviada com sucesso!');
      setIsModalOpen(false);
      setFormData({
        tipo: 'MANUAL',
        destinatarios: [],
        assunto: '',
        conteudo: '',
      });
    } catch (error) {
      toast.error('Erro ao enviar notificação');
    }
  };

  const handleEnviarResultadosProjeto = async (projetoId: number) => {
    try {
      // TODO: Implementar API call para enviar resultados
      // await sendProjectResultsAPI(projetoId);

      console.log('Enviando resultados do projeto:', projetoId);
      toast.success('Resultados enviados para todos os candidatos!');
    } catch (error) {
      toast.error('Erro ao enviar resultados');
    }
  };

  const colunas: ColumnDef<NotificacaoHistorico>[] = [
    {
      header: () => (
        <div className="flex items-center gap-2">
          <Mail className="h-5 w-5 text-gray-400" />
          Destinatário
        </div>
      ),
      accessorKey: 'destinatario',
      cell: ({ row }) => (
        <span className="font-medium">{row.original.destinatario}</span>
      ),
    },
    {
      header: () => (
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-gray-400" />
          Assunto
        </div>
      ),
      accessorKey: 'assunto',
      cell: ({ row }) => (
        <span className="text-sm">{row.original.assunto}</span>
      ),
    },
    {
      header: () => (
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-gray-400" />
          Tipo
        </div>
      ),
      accessorKey: 'tipo',
      cell: ({ row }) => {
        const tipo = row.original.tipo;
        const labels = {
          SELECAO_RESULTADO: 'Resultado Seleção',
          PROJETO_APROVADO: 'Projeto Aprovado',
          INSCRICAO_CONFIRMADA: 'Inscrição Confirmada',
        };
        return <Badge variant="outline">{labels[tipo]}</Badge>;
      },
    },
    {
      header: () => (
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-gray-400" />
          Status
        </div>
      ),
      accessorKey: 'status',
      cell: ({ row }) => {
        const status = row.original.status;
        if (status === 'ENVIADO') {
          return (
            <Badge variant="success">
              <CheckCircle className="h-3 w-3 mr-1" />
              Enviado
            </Badge>
          );
        } else if (status === 'FALHOU') {
          return (
            <Badge variant="destructive">
              <XCircle className="h-3 w-3 mr-1" />
              Falhou
            </Badge>
          );
        }
        return (
          <Badge variant="warning">
            <Clock className="h-3 w-3 mr-1" />
            Pendente
          </Badge>
        );
      },
    },
    {
      header: 'Data',
      accessorKey: 'dataEnvio',
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.original.dataEnvio.toLocaleDateString('pt-BR')} às{' '}
          {row.original.dataEnvio.toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
      ),
    },
  ];

  const actions = (
    <Button
      variant="primary"
      className="bg-[#1B2A50] text-white hover:bg-[#24376c] transition-colors"
      onClick={() => setIsModalOpen(true)}
    >
      <Send className="w-4 h-4 mr-2" />
      Nova Notificação
    </Button>
  );

  return (
    <PagesLayout title="Gerenciar Notificações" actions={actions}>
      <div className="space-y-6">
        {/* Cards de Ações Rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Send className="h-5 w-5" />
                Enviar Resultados por Projeto
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Select
                  onValueChange={(value) =>
                    setSelectedProjectId(parseInt(value))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um projeto" />
                  </SelectTrigger>
                  <SelectContent>
                    {projetos
                      ?.filter((p) => p.status === 'APPROVED')
                      .map((projeto) => (
                        <SelectItem
                          key={projeto.id}
                          value={projeto.id.toString()}
                        >
                          {projeto.titulo}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <Button
                  className="w-full"
                  size="sm"
                  disabled={!selectedProjectId}
                  onClick={() =>
                    selectedProjectId &&
                    handleEnviarResultadosProjeto(selectedProjectId)
                  }
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Enviar para Candidatos
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-5 w-5" />
                Estatísticas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    Enviados hoje:
                  </span>
                  <Badge variant="success">12</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Falhas:</span>
                  <Badge variant="destructive">2</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    Pendentes:
                  </span>
                  <Badge variant="warning">5</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Templates
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">
                Gerencie templates de email para diferentes tipos de
                notificação.
              </p>
              <Button variant="outline" size="sm" className="w-full">
                Gerenciar Templates
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Histórico de Notificações */}
        <Card>
          <CardHeader>
            <CardTitle>Histórico de Notificações</CardTitle>
          </CardHeader>
          <CardContent>
            <TableComponent columns={colunas} data={mockHistorico} />
          </CardContent>
        </Card>
      </div>

      {/* Modal de Nova Notificação */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Nova Notificação</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Tipo de Notificação</Label>
              <Select
                value={formData.tipo}
                onValueChange={(value: any) =>
                  setFormData((prev) => ({ ...prev, tipo: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MANUAL">Manual</SelectItem>
                  <SelectItem value="SELECAO_RESULTADO">
                    Resultado de Seleção
                  </SelectItem>
                  <SelectItem value="PROJETO_APROVADO">
                    Projeto Aprovado
                  </SelectItem>
                  <SelectItem value="INSCRICAO_CONFIRMADA">
                    Inscrição Confirmada
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Assunto</Label>
              <Input
                value={formData.assunto || ''}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, assunto: e.target.value }))
                }
                placeholder="Assunto do email"
              />
            </div>

            <div>
              <Label>Destinatários</Label>
              <Textarea
                value={formData.destinatarios?.join(', ') || ''}
                onChange={(e) => {
                  const emails = e.target.value
                    .split(',')
                    .map((email) => email.trim())
                    .filter(Boolean);
                  setFormData((prev) => ({ ...prev, destinatarios: emails }));
                }}
                placeholder="Digite os emails separados por vírgula"
                rows={3}
              />
            </div>

            <div>
              <Label>Conteúdo</Label>
              <Textarea
                value={formData.conteudo || ''}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, conteudo: e.target.value }))
                }
                placeholder="Conteúdo do email (HTML permitido)"
                rows={6}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleEnviarNotificacao}>
              <Send className="h-4 w-4 mr-2" />
              Enviar Notificação
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PagesLayout>
  );
}
