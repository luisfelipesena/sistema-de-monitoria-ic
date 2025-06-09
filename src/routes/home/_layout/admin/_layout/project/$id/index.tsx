import { PagesLayout } from '@/components/layout/PagesLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks/use-auth';
import { useInscricoesProjeto } from '@/hooks/use-inscricao';
import { useNotifyResults, useProjetoById } from '@/hooks/use-projeto';
import { createFileRoute, useRouter } from '@tanstack/react-router';
import { useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Calendar,
  CheckCircle,
  Clock,
  FileSignature,
  GraduationCap,
  Hand,
  Mail,
  MapPin,
  PenTool,
  School,
  User,
  Users,
  UserCheck,
  XCircle,
  Info,
  Download,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { apiClient } from '@/utils/api-client';
import type { DocumentResponse } from '@/routes/api/projeto/$id/documents';
import { QueryKeys } from '@/hooks/query-keys';

export const Route = createFileRoute(
  '/home/_layout/admin/_layout/project/$id/',
)({
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
  const { id: projetoId } = Route.useParams();
  const { user } = useAuth();
  const { data: projeto, isLoading: loadingProjeto } = useProjetoById(parseInt(projetoId));
  const { data: inscricoes, isLoading: loadingInscricoes } =
    useInscricoesProjeto(parseInt(projetoId));
  const [avaliacoes, setAvaliacoes] = useState<
    Record<number, CandidatoAvaliacao>
  >({});

  const router = useRouter();
  const queryClient = useQueryClient();

  const notifyResultsMutation = useNotifyResults();

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

  const handleViewPDF = async () => {
    toast('Preparando visualização...');
    try {
      const documents = await queryClient.fetchQuery<DocumentResponse[]>({
        queryKey: QueryKeys.projeto.documents(parseInt(projetoId)),
        queryFn: async () => {
          const response = await apiClient.get(
            `/projeto/${projetoId}/documents`,
          );
          return response.data;
        },
      });
      
      const adminSignedDoc = documents.find(
        (d: DocumentResponse) => d.tipoDocumento === 'PROPOSTA_ASSINADA_ADMIN',
      );
      const professorSignedDoc = documents.find(
        (d: DocumentResponse) =>
          d.tipoDocumento === 'PROPOSTA_ASSINADA_PROFESSOR',
      );
      const docToView = adminSignedDoc || professorSignedDoc;

      if (!docToView || !docToView.fileId) {
        toast.error('Documento não encontrado', {
          description: 'Nenhum documento assinado foi encontrado para visualização.',
        });
        return;
      }

          const accessResponse = await apiClient.post('/files/access', {
      fileId: docToView.fileId,
      action: 'view',
    });
    const { url } = accessResponse.data;

    const newWindow = window.open(url, '_blank', 'noopener,noreferrer');
    if (!newWindow) {
      toast.error('Popup bloqueado', {
        description: 'Permita popups para visualizar o PDF em nova aba.',
      });
      return;
    }
    
    toast.success('PDF aberto em nova aba');
    } catch (error) {
      toast.error('Erro ao abrir PDF', {
        description: 'Não foi possível abrir o documento para visualização.',
      });
      console.error("View PDF error:", error);
    }
  };

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
      const result = await notifyResultsMutation.mutateAsync(
        parseInt(projetoId),
      );

      toast.success(
        `Notificações enviadas! ${result.emailsEnviados || 0} emails enviados com sucesso.`,
      );

      if (result.emailsFalharam > 0) {
        toast.warning(`${result.emailsFalharam} emails falharam.`);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erro ao enviar notificações');
    }
  };

  const renderStatusBadge = (status: string) => {
    const statusConfig = {
      DRAFT: { variant: 'secondary' as const, label: 'Rascunho', icon: PenTool },
      SUBMITTED: { variant: 'warning' as const, label: 'Submetido', icon: Clock },
      PENDING_ADMIN_SIGNATURE: { variant: 'default' as const, label: 'Aguardando Assinatura', icon: FileSignature },
      APPROVED: { variant: 'success' as const, label: 'Aprovado', icon: CheckCircle },
      REJECTED: { variant: 'destructive' as const, label: 'Rejeitado', icon: XCircle },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || { 
      variant: 'secondary' as const, 
      label: status, 
      icon: Info 
    };
    
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const formatDate = (dateString: string | Date | null) => {
    if (!dateString) return 'Não informado';
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    return format(date, "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR });
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

  const disciplinaNome = projeto.disciplinas?.[0]?.disciplina?.codigo || 'Projeto';
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
        <div className="flex gap-2">
          <Button onClick={() => {
            if (projeto.status === 'APPROVED') {
              router.history.back()
            } else {
              router.navigate({
                to: '/home/admin/manage-projects',
              });
            }
          }} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>

          <Button onClick={handleNotificarResultados}>
            <Mail className="h-4 w-4 mr-2" />
            Notificar Resultados
          </Button>

          <Button
            variant="outline"
            onClick={handleViewPDF}
            className="text-green-600 border-green-300 hover:bg-green-50"
          >
            <FileSignature className="w-4 h-4 mr-2" />
            Ver PDF
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Informações Detalhadas do Projeto */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Card Principal do Projeto */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <School className="h-5 w-5 text-blue-500" />
                Informações do Projeto
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <div className="mt-1">
                  {renderStatusBadge(projeto.status)}
                </div>
              </div>

              <Separator />

              <div>
                <p className="text-sm text-muted-foreground">Descrição</p>
                <p className="text-sm mt-1">{projeto.descricao}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Ano/Semestre</p>
                  <p className="text-sm font-medium">
                    {projeto.ano}.{projeto.semestre === 'SEMESTRE_1' ? '1' : '2'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Tipo</p>
                  <p className="text-sm font-medium">{projeto.tipoProposicao}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Carga Horária</p>
                  <p className="text-sm font-medium">{projeto.cargaHorariaSemana}h/semana</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Duração</p>
                  <p className="text-sm font-medium">{projeto.numeroSemanas} semanas</p>
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Público Alvo</p>
                <p className="text-sm mt-1">{projeto.publicoAlvo}</p>
              </div>

              {projeto.estimativaPessoasBenificiadas && (
                <div>
                  <p className="text-sm text-muted-foreground">Estimativa de Pessoas Beneficiadas</p>
                  <p className="text-sm font-medium">{projeto.estimativaPessoasBenificiadas}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Card do Professor Responsável */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-green-500" />
                Professor Responsável
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Nome Completo</p>
                <p className="text-lg font-semibold">{projeto.professorResponsavel?.nomeCompleto}</p>
              </div>

              {projeto.professorResponsavel?.nomeSocial && (
                <div>
                  <p className="text-sm text-muted-foreground">Nome Social</p>
                  <p className="text-sm">{projeto.professorResponsavel.nomeSocial}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">SIAPE</p>
                  <p className="text-sm font-medium">{projeto.professorResponsavel?.matriculaSiape || 'Não informado'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Regime</p>
                  <p className="text-sm font-medium">{projeto.professorResponsavel?.regime}</p>
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Email Institucional</p>
                <p className="text-sm">{projeto.professorResponsavel?.emailInstitucional}</p>
              </div>

              {projeto.professorResponsavel?.telefone && (
                <div>
                  <p className="text-sm text-muted-foreground">Telefone</p>
                  <p className="text-sm">{projeto.professorResponsavel.telefone}</p>
                </div>
              )}

              {projeto.assinaturaProfessor && (
                <div>
                  <div className="flex items-center gap-2 text-green-600">
                    <UserCheck className="h-4 w-4" />
                    <span className="text-sm font-medium">Projeto assinado pelo professor</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Card de Departamento e Disciplinas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-purple-500" />
              Departamento e Disciplinas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-muted-foreground mb-2">Departamento</p>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-base px-3 py-1">
                    {projeto.departamento?.nome}
                  </Badge>
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-2">Disciplinas Vinculadas</p>
                <div className="flex flex-wrap gap-2">
                  {projeto.disciplinas?.map((pd: any) => (
                    <Badge key={pd.disciplina.id} variant="secondary" className="text-sm">
                      {pd.disciplina.codigo} - {pd.disciplina.nome}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card de Vagas e Controle */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-orange-500" />
              Controle de Vagas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {projeto.bolsasSolicitadas}
                </div>
                <div className="text-sm text-muted-foreground">
                  Bolsas Solicitadas
                </div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {projeto.bolsasDisponibilizadas || 0}
                </div>
                <div className="text-sm text-muted-foreground">
                  Bolsas Disponibilizadas
                </div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {projeto.voluntariosSolicitados}
                </div>
                <div className="text-sm text-muted-foreground">
                  Vagas Voluntário
                </div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-600">
                  {totalInscricoes}
                </div>
                <div className="text-sm text-muted-foreground">
                  Total Inscrições
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card de Datas e Histórico */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-indigo-500" />
              Histórico e Datas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Criado em</p>
                  <p className="text-sm font-medium">{formatDate(projeto.createdAt)}</p>
                </div>
                {projeto.updatedAt && (
                  <div>
                    <p className="text-sm text-muted-foreground">Última Atualização</p>
                    <p className="text-sm font-medium">{formatDate(projeto.updatedAt)}</p>
                  </div>
                )}
              </div>
              
              <div className="space-y-3">
                {projeto.feedbackAdmin && (
                  <div>
                    <p className="text-sm text-muted-foreground">Feedback do Admin</p>
                    <p className="text-sm bg-gray-50 p-2 rounded">{projeto.feedbackAdmin}</p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Resumo de Avaliações */}
        <Card>
          <CardHeader>
            <CardTitle>Resumo das Avaliações</CardTitle>
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
