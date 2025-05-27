import { PagesLayout } from '@/components/layout/PagesLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/use-auth';
import { useInscricoesProjeto } from '@/hooks/use-inscricao';
import { useProjetos } from '@/hooks/use-projeto';
import { createFileRoute } from '@tanstack/react-router';
import { CheckCircle, Clock, Hand, Mail, Users, XCircle } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

export const Route = createFileRoute('/home/_layout/common/projects/$projeto/inscricoes')({
  component: InscricoesProjetoPage,
});

interface CandidatoAvaliacao {
  inscricaoId: number;
  notaDisciplina: number;
  notaFinal: number;
  status: 'PENDENTE' | 'SELECIONADO' | 'REJEITADO';
  observacoes?: string;
}

function InscricoesProjetoPage() {
  const { projeto: projetoId } = Route.useParams();
  const { user } = useAuth();
  const { data: projetos, isLoading: loadingProjeto } = useProjetos();
  const projeto = projetos?.find((p) => p.id === parseInt(projetoId));
  const { data: inscricoes, isLoading: loadingInscricoes } =
    useInscricoesProjeto(parseInt(projetoId));
  const [avaliacoes, setAvaliacoes] = useState<
    Record<number, CandidatoAvaliacao>
  >({});

  // Verificar permissões
  if (user?.role !== 'admin' && user?.role !== 'professor') {
    return (
      <PagesLayout title="Acesso Negado">
        <div className="text-center py-12">
          <p>Você não tem permissão para acessar esta página.</p>
        </div>
      </PagesLayout>
    );
  }

  if (loadingProjeto || loadingInscricoes) {
    return (
      <PagesLayout title="Carregando...">
        <div className="text-center py-12">
          <p>Carregando dados do projeto...</p>
        </div>
      </PagesLayout>
    );
  }

  if (!projeto) {
    return (
      <PagesLayout title="Projeto não encontrado">
        <div className="text-center py-12">
          <p>O projeto solicitado não foi encontrado.</p>
        </div>
      </PagesLayout>
    );
  }

  // Separar candidatos por tipo
  const candidatosBolsistas =
    inscricoes?.filter(
      (i) =>
        i.tipoVagaPretendida === 'BOLSISTA' || i.tipoVagaPretendida === 'ANY',
    ) || [];

  const candidatosVoluntarios =
    inscricoes?.filter(
      (i) =>
        i.tipoVagaPretendida === 'VOLUNTARIO' || i.tipoVagaPretendida === 'ANY',
    ) || [];

  const handleAtualizarNota = (
    inscricaoId: number,
    campo: 'notaDisciplina' | 'notaFinal',
    valor: number,
  ) => {
    setAvaliacoes((prev) => ({
      ...prev,
      [inscricaoId]: {
        ...prev[inscricaoId],
        inscricaoId,
        [campo]: valor,
        status: prev[inscricaoId]?.status || 'PENDENTE',
      },
    }));
  };

  const handleSelecionarCandidato = async (inscricaoId: number) => {
    setAvaliacoes((prev) => ({
      ...prev,
      [inscricaoId]: {
        ...prev[inscricaoId],
        inscricaoId,
        status: 'SELECIONADO',
      },
    }));
    toast.success('Candidato selecionado! Notificação será enviada.');
  };

  const handleRejeitarCandidato = async (inscricaoId: number) => {
    setAvaliacoes((prev) => ({
      ...prev,
      [inscricaoId]: {
        ...prev[inscricaoId],
        inscricaoId,
        status: 'REJEITADO',
      },
    }));
    toast.success('Candidato rejeitado.');
  };

  const handleNotificarResultados = async () => {
    try {
      const response = await fetch(`/api/projeto/${projetoId}/notify-results`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao enviar notificações');
      }

      toast.success(
        `Notificações enviadas! ${result.emailsEnviados} emails enviados com sucesso.`,
      );

      if (result.emailsFalharam > 0) {
        toast.warning(`${result.emailsFalharam} emails falharam.`);
      }
    } catch (error) {
      toast.error('Erro ao enviar notificações');
    }
  };

  const renderCandidatos = (
    candidatos: any[],
    tipo: 'BOLSISTA' | 'VOLUNTARIO',
  ) => {
    if (candidatos.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          <span>Nenhuma inscrição encontrada</span>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {candidatos.map((candidato) => {
          const avaliacao = avaliacoes[candidato.id];
          const status = avaliacao?.status || 'PENDENTE';

          return (
            <Card key={candidato.id} className="border">
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {/* Informações do Candidato */}
                  <div className="md:col-span-2">
                    <h3 className="font-semibold text-lg">
                      {candidato.aluno.nomeCompleto}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-2">
                      Matrícula: {candidato.aluno.matricula}
                    </p>
                    <div className="flex items-center gap-4 text-sm">
                      <span>
                        CR: <strong>{candidato.aluno.cr}</strong>
                      </span>
                      <span>
                        Período:{' '}
                        <strong>{candidato.aluno.periodo || 'N/A'}</strong>
                      </span>
                    </div>
                    {candidato.motivacao && (
                      <div className="mt-3">
                        <p className="text-sm text-muted-foreground">
                          Motivação:
                        </p>
                        <p className="text-sm">{candidato.motivacao}</p>
                      </div>
                    )}
                  </div>

                  {/* Notas */}
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium">
                        Nota Disciplina
                      </label>
                      <Input
                        type="number"
                        step="0.1"
                        min="0"
                        max="10"
                        placeholder="0.0"
                        value={avaliacao?.notaDisciplina || ''}
                        onChange={(e) =>
                          handleAtualizarNota(
                            candidato.id,
                            'notaDisciplina',
                            parseFloat(e.target.value) || 0,
                          )
                        }
                        disabled={status !== 'PENDENTE'}
                        className="h-8"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Nota Final</label>
                      <Input
                        type="number"
                        step="0.1"
                        min="0"
                        max="10"
                        placeholder="0.0"
                        value={avaliacao?.notaFinal || ''}
                        onChange={(e) =>
                          handleAtualizarNota(
                            candidato.id,
                            'notaFinal',
                            parseFloat(e.target.value) || 0,
                          )
                        }
                        disabled={status !== 'PENDENTE'}
                        className="h-8"
                      />
                    </div>
                  </div>

                  {/* Status e Ações */}
                  <div className="space-y-3">
                    <div>
                      {status === 'PENDENTE' && (
                        <Badge
                          variant="secondary"
                          className="bg-yellow-100 text-yellow-800"
                        >
                          <Clock className="h-3 w-3 mr-1" />
                          Pendente
                        </Badge>
                      )}
                      {status === 'SELECIONADO' && (
                        <Badge
                          variant="default"
                          className="bg-green-100 text-green-800"
                        >
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Selecionado
                        </Badge>
                      )}
                      {status === 'REJEITADO' && (
                        <Badge
                          variant="destructive"
                          className="bg-red-100 text-red-800"
                        >
                          <XCircle className="h-3 w-3 mr-1" />
                          Rejeitado
                        </Badge>
                      )}
                    </div>

                    {status === 'PENDENTE' && (
                      <div className="flex flex-col gap-2">
                        <Button
                          size="sm"
                          onClick={() =>
                            handleSelecionarCandidato(candidato.id)
                          }
                          disabled={
                            !avaliacao?.notaDisciplina || !avaliacao?.notaFinal
                          }
                          className="bg-green-600 hover:bg-green-700 text-white h-8"
                        >
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Selecionar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRejeitarCandidato(candidato.id)}
                          className="border-red-300 text-red-600 hover:bg-red-50 h-8"
                        >
                          <XCircle className="h-3 w-3 mr-1" />
                          Rejeitar
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  };

  const disciplinaNome = projeto.disciplinas[0]?.codigo || 'Projeto';
  const totalInscricoes = inscricoes?.length || 0;
  const selecionados = Object.values(avaliacoes).filter(
    (a) => a.status === 'SELECIONADO',
  ).length;
  const rejeitados = Object.values(avaliacoes).filter(
    (a) => a.status === 'REJEITADO',
  ).length;

  return (
    <PagesLayout
      title={`${disciplinaNome} - Gerenciar Inscrições`}
      subtitle={projeto.titulo}
      actions={
        <Button
          onClick={handleNotificarResultados}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Mail className="h-4 w-4 mr-2" />
          Notificar Resultados
        </Button>
      }
    >
      <div className="space-y-6">
        {/* Resumo do Projeto */}
        <Card>
          <CardHeader>
            <CardTitle>Resumo do Projeto</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {totalInscricoes}
                </div>
                <div className="text-sm text-muted-foreground">
                  Total de Inscrições
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {selecionados}
                </div>
                <div className="text-sm text-muted-foreground">
                  Selecionados
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {rejeitados}
                </div>
                <div className="text-sm text-muted-foreground">Rejeitados</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">
                  {totalInscricoes - selecionados - rejeitados}
                </div>
                <div className="text-sm text-muted-foreground">Pendentes</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Candidatos Bolsistas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-500" />
              Candidatos a Bolsista ({candidatosBolsistas.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {renderCandidatos(candidatosBolsistas, 'BOLSISTA')}
          </CardContent>
        </Card>

        {/* Candidatos Voluntários */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Hand className="h-5 w-5 text-green-500" />
              Candidatos a Voluntário ({candidatosVoluntarios.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {renderCandidatos(candidatosVoluntarios, 'VOLUNTARIO')}
          </CardContent>
        </Card>
      </div>
    </PagesLayout>
  );
}
