import { PagesLayout } from '@/components/layout/PagesLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useMinhasInscricoes } from '@/hooks/use-inscricao';
import { InscricaoComDetalhes } from '@/routes/api/inscricao/-types';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import {
  Award,
  Calendar,
  CheckCircle,
  Clock,
  FileText,
  Loader,
  School,
  User,
  XCircle,
} from 'lucide-react';
import { useMemo } from 'react';

export const Route = createFileRoute(
  '/home/_layout/student/_layout/resultados',
)({
  component: ResultadosPage,
});

function ResultadosPage() {
  const navigate = useNavigate();
  const { data: inscricoes, isLoading } = useMinhasInscricoes();

  // Separar inscrições por status
  const { aprovadas, pendentes, rejeitadas, aguardandoResposta } = useMemo(() => {
    if (!inscricoes) {
      return {
        aprovadas: [],
        pendentes: [],
        rejeitadas: [],
        aguardandoResposta: [],
      };
    }

    return inscricoes.reduce(
      (acc, inscricao) => {
        if (
          inscricao.status === 'ACCEPTED_BOLSISTA' ||
          inscricao.status === 'ACCEPTED_VOLUNTARIO'
        ) {
          acc.aprovadas.push(inscricao);
        } else if (inscricao.status === 'SUBMITTED') {
          acc.pendentes.push(inscricao);
        } else if (
          inscricao.status === 'REJECTED_BY_PROFESSOR' ||
          inscricao.status === 'REJECTED_BY_STUDENT'
        ) {
          acc.rejeitadas.push(inscricao);
        } else if (
          inscricao.status === 'SELECTED_BOLSISTA' ||
          inscricao.status === 'SELECTED_VOLUNTARIO'
        ) {
          acc.aguardandoResposta.push(inscricao);
        }
        return acc;
      },
      {
        aprovadas: [] as InscricaoComDetalhes[],
        pendentes: [] as InscricaoComDetalhes[],
        rejeitadas: [] as InscricaoComDetalhes[],
        aguardandoResposta: [] as InscricaoComDetalhes[],
      },
    );
  }, [inscricoes]);

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'ACCEPTED_BOLSISTA':
        return {
          label: 'Aceito como Bolsista',
          icon: <CheckCircle className="h-5 w-5 text-green-500" />,
          color: 'bg-green-50 border-green-200',
          textColor: 'text-green-700',
        };
      case 'ACCEPTED_VOLUNTARIO':
        return {
          label: 'Aceito como Voluntário',
          icon: <CheckCircle className="h-5 w-5 text-blue-500" />,
          color: 'bg-blue-50 border-blue-200',
          textColor: 'text-blue-700',
        };
      case 'SELECTED_BOLSISTA':
        return {
          label: 'Selecionado para Bolsa - Aguardando sua resposta',
          icon: <Award className="h-5 w-5 text-yellow-500" />,
          color: 'bg-yellow-50 border-yellow-200',
          textColor: 'text-yellow-700',
        };
      case 'SELECTED_VOLUNTARIO':
        return {
          label: 'Selecionado como Voluntário - Aguardando sua resposta',
          icon: <Award className="h-5 w-5 text-yellow-500" />,
          color: 'bg-yellow-50 border-yellow-200',
          textColor: 'text-yellow-700',
        };
      case 'SUBMITTED':
        return {
          label: 'Aguardando avaliação',
          icon: <Clock className="h-5 w-5 text-gray-500" />,
          color: 'bg-gray-50 border-gray-200',
          textColor: 'text-gray-700',
        };
      case 'REJECTED_BY_PROFESSOR':
        return {
          label: 'Não selecionado',
          icon: <XCircle className="h-5 w-5 text-red-500" />,
          color: 'bg-red-50 border-red-200',
          textColor: 'text-red-700',
        };
      case 'REJECTED_BY_STUDENT':
        return {
          label: 'Recusado por você',
          icon: <XCircle className="h-5 w-5 text-orange-500" />,
          color: 'bg-orange-50 border-orange-200',
          textColor: 'text-orange-700',
        };
      default:
        return {
          label: status,
          icon: <FileText className="h-5 w-5 text-gray-500" />,
          color: 'bg-gray-50 border-gray-200',
          textColor: 'text-gray-700',
        };
    }
  };

  const ResultCard = ({ inscricao }: { inscricao: InscricaoComDetalhes }) => {
    const statusConfig = getStatusConfig(inscricao.status);
    const disciplinas = inscricao.disciplinas || [];
    const shouldShowActions =
      inscricao.status === 'SELECTED_BOLSISTA' ||
      inscricao.status === 'SELECTED_VOLUNTARIO';

    return (
      <Card className={`border ${statusConfig.color}`}>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-lg">{inscricao.projeto.titulo}</CardTitle>
              <div className="mt-2 space-y-1 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span>{inscricao.projeto.professorResponsavel.nomeCompleto}</span>
                </div>
                <div className="flex items-center gap-2">
                  <School className="h-4 w-4" />
                  <span>
                    {disciplinas.map((d) => `${d.codigo} - ${d.nome}`).join(', ')}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>
                    Inscrito em:{' '}
                    {new Date(inscricao.createdAt).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {statusConfig.icon}
              <Badge className={statusConfig.textColor} variant="outline">
                {statusConfig.label}
              </Badge>
            </div>
          </div>
        </CardHeader>
        {(shouldShowActions || inscricao.feedbackProfessor) && (
          <CardContent>
            {inscricao.feedbackProfessor && (
              <div className="mb-4 p-3 bg-gray-50 rounded-md">
                <p className="text-sm text-gray-700">
                  <strong>Feedback do professor:</strong>{' '}
                  {inscricao.feedbackProfessor}
                </p>
              </div>
            )}
            {shouldShowActions && (
              <div className="flex gap-3">
                <Button
                  onClick={() => navigate({ to: '/home/student/dashboard' })}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Responder à Seleção
                </Button>
              </div>
            )}
          </CardContent>
        )}
      </Card>
    );
  };

  if (isLoading) {
    return (
      <PagesLayout title="Resultados das Seleções">
        <div className="flex justify-center items-center py-12">
          <Loader className="h-8 w-8 animate-spin" />
          <span className="ml-2">Carregando resultados...</span>
        </div>
      </PagesLayout>
    );
  }

  return (
    <PagesLayout
      title="Resultados das Seleções"
      subtitle="Acompanhe o resultado das suas inscrições em monitoria"
    >
      <div className="space-y-8">
        {/* Cards de resumo */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-green-600">
                    {aprovadas.length}
                  </div>
                  <p className="text-sm text-muted-foreground">Aprovadas</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-yellow-500">
                    {aguardandoResposta.length}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Aguardando Resposta
                  </p>
                </div>
                <Award className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-gray-600">
                    {pendentes.length}
                  </div>
                  <p className="text-sm text-muted-foreground">Em Análise</p>
                </div>
                <Clock className="h-8 w-8 text-gray-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-red-600">
                    {rejeitadas.length}
                  </div>
                  <p className="text-sm text-muted-foreground">Não Selecionadas</p>
                </div>
                <XCircle className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Seções de resultados */}
        {aguardandoResposta.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Award className="h-6 w-6 text-yellow-500" />
              Seleções Aguardando sua Resposta
            </h2>
            <div className="space-y-4">
              {aguardandoResposta.map((inscricao) => (
                <ResultCard key={inscricao.id} inscricao={inscricao} />
              ))}
            </div>
          </div>
        )}

        {aprovadas.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <CheckCircle className="h-6 w-6 text-green-500" />
              Monitorias Aprovadas
            </h2>
            <div className="space-y-4">
              {aprovadas.map((inscricao) => (
                <ResultCard key={inscricao.id} inscricao={inscricao} />
              ))}
            </div>
          </div>
        )}

        {pendentes.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Clock className="h-6 w-6 text-gray-500" />
              Inscrições em Análise
            </h2>
            <div className="space-y-4">
              {pendentes.map((inscricao) => (
                <ResultCard key={inscricao.id} inscricao={inscricao} />
              ))}
            </div>
          </div>
        )}

        {rejeitadas.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <XCircle className="h-6 w-6 text-red-500" />
              Inscrições Não Selecionadas
            </h2>
            <div className="space-y-4">
              {rejeitadas.map((inscricao) => (
                <ResultCard key={inscricao.id} inscricao={inscricao} />
              ))}
            </div>
          </div>
        )}

        {(!inscricoes || inscricoes.length === 0) && (
          <Card>
            <CardContent className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-700 mb-2">
                Nenhuma inscrição encontrada
              </h3>
              <p className="text-gray-500 mb-4">
                Você ainda não se inscreveu em nenhum projeto de monitoria.
              </p>
              <Button
                onClick={() => navigate({ to: '/home/student/inscricao-monitoria' })}
              >
                Ver Vagas Disponíveis
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </PagesLayout>
  );
}