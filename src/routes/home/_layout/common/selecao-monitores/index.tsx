import { PagesLayout } from '@/components/layout/PagesLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/use-auth';
import { useNotifyProjectResults } from '@/hooks/use-notificacoes';
import { useGenerateAta, useProjetos } from '@/hooks/use-projeto';
import {
  AvaliacaoCandidato,
  CriteriosAvaliacao,
  useBulkEvaluation,
  useFinalizeSelection,
  useSelectionProcess,
  useSelectionStatus,
} from '@/hooks/use-selection-process';
import { createFileRoute } from '@tanstack/react-router';
import {
  BarChart3,
  CheckCircle,
  Clock,
  FileText,
  Hand,
  Mail,
  Star,
  UserCheck,
  Users,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

export const Route = createFileRoute('/home/_layout/common/selecao-monitores/')(
  {
    component: SelecaoMonitoresPage,
  },
);

interface CandidatoEvaluation {
  inscricaoId: number;
  criterios: CriteriosAvaliacao;
  observacoes?: string;
}

function SelecaoMonitoresPage() {
  const { user } = useAuth();
  const { data: projetos, isLoading: loadingProjetos } = useProjetos();
  const [projetoSelecionado, setProjetoSelecionado] = useState<number | null>(
    null,
  );

  const { data: selectionData, isLoading: loadingSelection } =
    useSelectionProcess(projetoSelecionado || 0);
  const { data: selectionStatus } = useSelectionStatus(projetoSelecionado || 0);

  const bulkEvaluation = useBulkEvaluation();
  const finalizeSelection = useFinalizeSelection();
  const generateAtaMutation = useGenerateAta();
  const notifyResultsMutation = useNotifyProjectResults();

  const handleGerarAta = async () => {
    if (!projetoSelecionado) return;

    try {
      await generateAtaMutation.mutateAsync(projetoSelecionado);
      toast.success('Ata de seleção gerada com sucesso!');
    } catch (error) {
      toast.error('Erro ao gerar ata de seleção');
    }
  };

  const handleEnviarResultadosProjeto = async (projetoId: number) => {
    try {
      await notifyResultsMutation.mutateAsync(projetoId);
      toast.success('Resultados enviados para todos os candidatos!');
    } catch (error) {
      toast.error('Erro ao enviar resultados');
    }
  };

  const [activeTab, setActiveTab] = useState('candidatos');
  const [avaliacoes, setAvaliacoes] = useState<
    Record<number, CandidatoEvaluation>
  >({});
  const [candidatosSelecionados, setCandidatosSelecionados] = useState<
    Set<number>
  >(new Set());
  const [enviarNotificacoes, setEnviarNotificacoes] = useState(true);
  const [observacoesGerais, setObservacoesGerais] = useState('');

  const projetosFiltrados =
    projetos?.filter((projeto) => {
      if (user?.role === 'admin') return true;
      return projeto.status === 'APPROVED';
    }) || [];

  const candidatosBolsistas =
    selectionData?.candidatos.filter(
      (c) =>
        c.tipoVagaPretendida === 'BOLSISTA' || c.tipoVagaPretendida === 'ANY',
    ) || [];

  const candidatosVoluntarios =
    selectionData?.candidatos.filter(
      (c) =>
        c.tipoVagaPretendida === 'VOLUNTARIO' || c.tipoVagaPretendida === 'ANY',
    ) || [];

  const handleUpdateCriterios = (
    inscricaoId: number,
    criterio: keyof CriteriosAvaliacao,
    valor: number,
  ) => {
    setAvaliacoes((prev) => ({
      ...prev,
      [inscricaoId]: {
        ...prev[inscricaoId],
        inscricaoId,
        criterios: {
          ...prev[inscricaoId]?.criterios,
          [criterio]: valor,
        },
      },
    }));
  };

  const handleUpdateObservacoes = (
    inscricaoId: number,
    observacoes: string,
  ) => {
    setAvaliacoes((prev) => ({
      ...prev,
      [inscricaoId]: {
        ...prev[inscricaoId],
        inscricaoId,
        observacoes,
      },
    }));
  };

  const handleSelecionarCandidato = (
    inscricaoId: number,
    selecionado: boolean,
  ) => {
    setCandidatosSelecionados((prev) => {
      const newSet = new Set(prev);
      if (selecionado) {
        newSet.add(inscricaoId);
      } else {
        newSet.delete(inscricaoId);
      }
      return newSet;
    });
  };

  const handleSalvarAvaliacoes = async () => {
    if (!projetoSelecionado) return;

    try {
      const avaliacoesArray: AvaliacaoCandidato[] = Object.values(avaliacoes)
        .filter((av) => av.criterios)
        .map((av) => ({
          inscricaoId: av.inscricaoId,
          criterios: av.criterios,
          notaFinal: 0,
          status: 'AVALIADO',
          observacoes: av.observacoes,
        }));

      if (avaliacoesArray.length === 0) {
        toast.error('Nenhuma avaliação para salvar');
        return;
      }

      await bulkEvaluation.mutateAsync({
        projetoId: projetoSelecionado,
        avaliacoes: avaliacoesArray,
        autoCalcularNota: true,
      });

      toast.success('Avaliações salvas com sucesso!');
      setAvaliacoes({});
    } catch (error) {
      toast.error('Erro ao salvar avaliações');
    }
  };

  const handleFinalizarSelecao = async () => {
    if (!projetoSelecionado || candidatosSelecionados.size === 0) return;

    try {
      const selecionados = Array.from(candidatosSelecionados).map(
        (inscricaoId) => {
          const candidato = selectionData?.candidatos.find(
            (c) => c.inscricaoId === inscricaoId,
          );

          let tipoVaga: 'BOLSISTA' | 'VOLUNTARIO' = 'VOLUNTARIO';
          if (
            candidato?.tipoVagaPretendida === 'BOLSISTA' ||
            (candidato?.tipoVagaPretendida === 'ANY' &&
              candidatosBolsistas.some((c) => c.inscricaoId === inscricaoId))
          ) {
            tipoVaga = 'BOLSISTA';
          }

          return {
            inscricaoId,
            tipoVaga,
          };
        },
      );

      await finalizeSelection.mutateAsync({
        projetoId: projetoSelecionado,
        selecionados,
        enviarNotificacoes,
        observacoesGerais: observacoesGerais || undefined,
      });

      toast.success('Seleção finalizada com sucesso!');
      setCandidatosSelecionados(new Set());
      setObservacoesGerais('');
    } catch (error) {
      toast.error('Erro ao finalizar seleção');
    }
  };

  const renderCriteriosAvaliacao = (inscricaoId: number, candidato: any) => {
    const avaliacao =
      avaliacoes[inscricaoId] ||
      selectionData?.candidatos.find((c) => c.inscricaoId === inscricaoId)
        ?.avaliacao;
    const isReadOnly = !!selectionData?.candidatos.find(
      (c) => c.inscricaoId === inscricaoId,
    )?.avaliacao;

    return (
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mt-3">
        <div>
          <Label className="text-xs font-medium">CR (30%)</Label>
          <Input
            type="number"
            step="0.1"
            min="0"
            max="10"
            placeholder="0.0"
            value={avaliacao?.criterios?.cr || ''}
            onChange={(e) =>
              handleUpdateCriterios(
                inscricaoId,
                'cr',
                parseFloat(e.target.value) || 0,
              )
            }
            disabled={isReadOnly}
            className="text-sm"
          />
        </div>
        <div>
          <Label className="text-xs font-medium">Experiência (20%)</Label>
          <Input
            type="number"
            step="0.1"
            min="0"
            max="10"
            placeholder="0.0"
            value={avaliacao?.criterios?.experienciaPrevia || ''}
            onChange={(e) =>
              handleUpdateCriterios(
                inscricaoId,
                'experienciaPrevia',
                parseFloat(e.target.value) || 0,
              )
            }
            disabled={isReadOnly}
            className="text-sm"
          />
        </div>
        <div>
          <Label className="text-xs font-medium">Motivação (20%)</Label>
          <Input
            type="number"
            step="0.1"
            min="0"
            max="10"
            placeholder="0.0"
            value={avaliacao?.criterios?.motivacao || ''}
            onChange={(e) =>
              handleUpdateCriterios(
                inscricaoId,
                'motivacao',
                parseFloat(e.target.value) || 0,
              )
            }
            disabled={isReadOnly}
            className="text-sm"
          />
        </div>
        <div>
          <Label className="text-xs font-medium">Disponibilidade (15%)</Label>
          <Input
            type="number"
            step="0.1"
            min="0"
            max="10"
            placeholder="0.0"
            value={avaliacao?.criterios?.disponibilidade || ''}
            onChange={(e) =>
              handleUpdateCriterios(
                inscricaoId,
                'disponibilidade',
                parseFloat(e.target.value) || 0,
              )
            }
            disabled={isReadOnly}
            className="text-sm"
          />
        </div>
        <div>
          <Label className="text-xs font-medium">Entrevista (15%)</Label>
          <Input
            type="number"
            step="0.1"
            min="0"
            max="10"
            placeholder="0.0"
            value={avaliacao?.criterios?.entrevista || ''}
            onChange={(e) =>
              handleUpdateCriterios(
                inscricaoId,
                'entrevista',
                parseFloat(e.target.value) || 0,
              )
            }
            disabled={isReadOnly}
            className="text-sm"
          />
        </div>
      </div>
    );
  };

  const renderCandidatos = (
    candidatos: any[],
    tipo: 'BOLSISTA' | 'VOLUNTARIO',
  ) => {
    if (candidatos.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <span>Nenhum candidato para {tipo.toLowerCase()}</span>
        </div>
      );
    }

    const limite =
      tipo === 'BOLSISTA'
        ? selectionData?.projeto.vagasDisponiveis.bolsistas || 0
        : selectionData?.projeto.vagasDisponiveis.voluntarios || 0;

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <span className="text-sm font-medium">
            Vagas disponíveis: {limite}
          </span>
          <span className="text-sm text-gray-600">
            Selecionados:{' '}
            {
              candidatos.filter((c) =>
                candidatosSelecionados.has(c.inscricaoId),
              ).length
            }
            /{limite}
          </span>
        </div>

        {candidatos.map((candidato) => {
          const isSelecionado = candidatosSelecionados.has(
            candidato.inscricaoId,
          );
          const hasAvaliacao =
            candidato.avaliacao || avaliacoes[candidato.inscricaoId]?.criterios;

          return (
            <Card
              key={candidato.inscricaoId}
              className={isSelecionado ? 'ring-2 ring-green-500' : ''}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <Checkbox
                      checked={isSelecionado}
                      onCheckedChange={(checked) =>
                        handleSelecionarCandidato(
                          candidato.inscricaoId,
                          !!checked,
                        )
                      }
                    />
                    <div>
                      <h3 className="font-semibold">{candidato.aluno.nome}</h3>
                      <p className="text-sm text-gray-600">
                        {candidato.aluno.matricula} • CR: {candidato.aluno.cr}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {candidato.avaliacao && (
                      <Badge
                        variant="secondary"
                        className="bg-green-100 text-green-800"
                      >
                        <Star className="h-3 w-3 mr-1" />
                        Nota: {candidato.avaliacao.notaFinal.toFixed(1)}
                      </Badge>
                    )}
                    <Badge
                      variant={
                        candidato.status.includes('SELECTED')
                          ? 'default'
                          : 'secondary'
                      }
                    >
                      {candidato.status}
                    </Badge>
                  </div>
                </div>

                {renderCriteriosAvaliacao(candidato.inscricaoId, candidato)}

                <div className="mt-3">
                  <Label className="text-xs font-medium">Observações</Label>
                  <Textarea
                    placeholder="Observações sobre o candidato..."
                    value={
                      avaliacoes[candidato.inscricaoId]?.observacoes ||
                      candidato.avaliacao?.observacoes ||
                      ''
                    }
                    onChange={(e) =>
                      handleUpdateObservacoes(
                        candidato.inscricaoId,
                        e.target.value,
                      )
                    }
                    disabled={!!candidato.avaliacao}
                    className="text-sm mt-1"
                    rows={2}
                  />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  };

  const renderEstatisticas = () => (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-500" />
            <div>
              <p className="text-sm font-medium">Total Candidatos</p>
              <p className="text-2xl font-bold">
                {selectionData?.estatisticas.totalCandidatos || 0}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <div>
              <p className="text-sm font-medium">Avaliados</p>
              <p className="text-2xl font-bold">
                {selectionData?.estatisticas.avaliados || 0}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-purple-500" />
            <div>
              <p className="text-sm font-medium">Selecionados</p>
              <p className="text-2xl font-bold">
                {candidatosSelecionados.size}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-orange-500" />
            <div>
              <p className="text-sm font-medium">Status</p>
              <p className="text-sm font-bold">
                {selectionStatus?.processoFinalizado
                  ? 'Finalizado'
                  : 'Em Andamento'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <PagesLayout
      title={selectionData?.projeto.titulo || 'Seleção de Monitores'}
      subtitle="Processo de avaliação e seleção de candidatos"
    >
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <Select
              value={projetoSelecionado?.toString() || ''}
              onValueChange={(value) => setProjetoSelecionado(parseInt(value))}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione um projeto de monitoria" />
              </SelectTrigger>
              <SelectContent>
                {projetosFiltrados.map((projeto) => (
                  <SelectItem key={projeto.id} value={projeto.id.toString()}>
                    {projeto.titulo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {projetoSelecionado && (
          <>
            {renderEstatisticas()}

            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="candidatos">Candidatos</TabsTrigger>
                <TabsTrigger value="finalizacao">Finalização</TabsTrigger>
                <TabsTrigger value="resultados">Resultados</TabsTrigger>
              </TabsList>

              <TabsContent value="candidatos" className="space-y-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-blue-500" />
                      Candidatos Bolsistas
                    </CardTitle>
                    <Button
                      onClick={handleSalvarAvaliacoes}
                      disabled={
                        Object.keys(avaliacoes).length === 0 ||
                        bulkEvaluation.isPending
                      }
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      Salvar Avaliações
                    </Button>
                  </CardHeader>
                  <CardContent>
                    {loadingSelection ? (
                      <div className="text-center py-8">
                        Carregando candidatos...
                      </div>
                    ) : (
                      renderCandidatos(candidatosBolsistas, 'BOLSISTA')
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Hand className="h-5 w-5 text-green-500" />
                      Candidatos Voluntários
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {renderCandidatos(candidatosVoluntarios, 'VOLUNTARIO')}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="finalizacao" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Finalizar Processo de Seleção</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="notificacoes"
                        checked={enviarNotificacoes}
                        onCheckedChange={(checked) =>
                          setEnviarNotificacoes(checked === true)
                        }
                      />
                      <Label
                        htmlFor="notificacoes"
                        className="flex items-center gap-2"
                      >
                        <Mail className="h-4 w-4" />
                        Enviar notificações por email aos candidatos
                      </Label>
                    </div>

                    <div>
                      <Label>Observações Gerais</Label>
                      <Textarea
                        placeholder="Observações que serão incluídas nas notificações..."
                        value={observacoesGerais}
                        onChange={(e) => setObservacoesGerais(e.target.value)}
                        rows={3}
                      />
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <h4 className="font-semibold">Resumo da Seleção:</h4>
                      <p className="text-sm text-gray-600">
                        • Candidatos selecionados: {candidatosSelecionados.size}
                      </p>
                      <p className="text-sm text-gray-600">
                        • Bolsistas:{' '}
                        {
                          candidatosBolsistas.filter((c) =>
                            candidatosSelecionados.has(c.inscricaoId),
                          ).length
                        }
                      </p>
                      <p className="text-sm text-gray-600">
                        • Voluntários:{' '}
                        {
                          candidatosVoluntarios.filter((c) =>
                            candidatosSelecionados.has(c.inscricaoId),
                          ).length
                        }
                      </p>
                    </div>

                    <Button
                      onClick={handleFinalizarSelecao}
                      disabled={
                        candidatosSelecionados.size === 0 ||
                        finalizeSelection.isPending
                      }
                      className="w-full bg-green-600 hover:bg-green-700"
                      size="lg"
                    >
                      Finalizar Seleção
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="resultados" className="space-y-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      Status do Processo
                    </CardTitle>
                    <Button
                      onClick={handleGerarAta}
                      variant="outline"
                      className="flex items-center gap-2"
                    >
                      <FileText className="h-4 w-4" />
                      Gerar Ata de Seleção
                    </Button>
                  </CardHeader>
                  <CardContent>
                    {selectionStatus && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-blue-600">
                            {selectionStatus.estatisticas.pendentes}
                          </p>
                          <p className="text-sm text-gray-600">Pendentes</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-green-600">
                            {selectionStatus.estatisticas.selecionadosBolsista}
                          </p>
                          <p className="text-sm text-gray-600">Bolsistas</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-purple-600">
                            {
                              selectionStatus.estatisticas
                                .selecionadosVoluntario
                            }
                          </p>
                          <p className="text-sm text-gray-600">Voluntários</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-red-600">
                            {selectionStatus.estatisticas.rejeitados}
                          </p>
                          <p className="text-sm text-gray-600">Rejeitados</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </PagesLayout>
  );
}
