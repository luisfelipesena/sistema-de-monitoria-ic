import { PagesLayout } from '@/components/layout/PagesLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/hooks/use-auth';
import { useInscricoesProjeto } from '@/hooks/use-inscricao';
import { useProjetos } from '@/hooks/use-projeto';
import { createFileRoute } from '@tanstack/react-router';
import {
  CheckCircle,
  Clock,
  Download,
  FileText,
  Hand,
  Upload,
  Users,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

export const Route = createFileRoute('/home/_layout/common/selecao-monitores/')(
  {
    component: SelecaoMonitoresPage,
  },
);

interface CandidatoAvaliacao {
  inscricaoId: number;
  notaDisciplina: number;
  notaFinal: number;
  status: 'PENDENTE' | 'AVALIADO';
}

function SelecaoMonitoresPage() {
  const { user } = useAuth();
  const { data: projetos, isLoading: loadingProjetos } = useProjetos();
  const [projetoSelecionado, setProjetoSelecionado] = useState<number | null>(
    null,
  );
  const { data: inscricoes, isLoading: loadingInscricoes } =
    useInscricoesProjeto(projetoSelecionado || 0);

  const [avaliacoes, setAvaliacoes] = useState<
    Record<number, CandidatoAvaliacao>
  >({});

  // Filtrar projetos baseado no role
  const projetosFiltrados =
    projetos?.filter((projeto) => {
      if (user?.role === 'admin') return true;
      // Para professores, mostrar apenas projetos aprovados onde é responsável
      return projeto.status === 'APPROVED';
    }) || [];

  const projetoAtual = projetosFiltrados.find(
    (p) => p.id === projetoSelecionado,
  );
  const disciplinaNome =
    projetoAtual?.disciplinas[0]?.codigo || 'Selecione um projeto';

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

  const handleAvaliarCandidato = (inscricaoId: number) => {
    setAvaliacoes((prev) => ({
      ...prev,
      [inscricaoId]: {
        ...prev[inscricaoId],
        inscricaoId,
        status: 'AVALIADO',
      },
    }));
  };

  const handleSalvarAvaliacoes = async () => {
    if (!projetoSelecionado) return;

    try {
      const avaliacoesArray = Object.values(avaliacoes).filter(
        (avaliacao) => avaliacao.notaDisciplina && avaliacao.notaFinal,
      );

      if (avaliacoesArray.length === 0) {
        toast.error('Nenhuma avaliação para salvar');
        return;
      }

      const response = await fetch(
        `/api/projeto/${projetoSelecionado}/avaliacoes`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(avaliacoesArray),
        },
      );

      if (!response.ok) {
        throw new Error('Erro ao salvar avaliações');
      }

      toast.success('Avaliações salvas com sucesso!');
    } catch (error) {
      toast.error('Erro ao salvar avaliações');
    }
  };

  const renderCandidatos = (
    candidatos: any[],
    tipo: 'BOLSISTA' | 'VOLUNTARIO',
  ) => {
    if (candidatos.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          <span>Sem inscritos</span>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {/* Header da tabela */}
        <div className="grid grid-cols-12 gap-4 p-4 border-b font-medium text-sm">
          <div className="col-span-3">Nome</div>
          <div className="col-span-2">Matrícula</div>
          <div className="col-span-1">CR</div>
          <div className="col-span-2">Nota Disciplina</div>
          <div className="col-span-2">Nota Final</div>
          <div className="col-span-2">Ações</div>
        </div>

        {/* Candidatos */}
        {candidatos.map((candidato) => {
          const avaliacao = avaliacoes[candidato.id];
          const isAvaliado = avaliacao?.status === 'AVALIADO';

          return (
            <div
              key={candidato.id}
              className="grid grid-cols-12 gap-4 p-4 border-b"
            >
              <div className="col-span-3 font-medium">
                {candidato.aluno.nomeCompleto}
              </div>
              <div className="col-span-2">{candidato.aluno.matricula}</div>
              <div className="col-span-1">{candidato.aluno.cr}</div>
              <div className="col-span-2">
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
                  disabled={isAvaliado}
                />
              </div>
              <div className="col-span-2">
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
                  disabled={isAvaliado}
                />
              </div>
              <div className="col-span-2">
                {isAvaliado ? (
                  <Badge variant="secondary" className="bg-gray-100">
                    Avaliado
                  </Badge>
                ) : (
                  <Button
                    size="sm"
                    className="bg-blue-500 hover:bg-blue-600"
                    onClick={() => handleAvaliarCandidato(candidato.id)}
                    disabled={
                      !avaliacao?.notaDisciplina || !avaliacao?.notaFinal
                    }
                  >
                    Avaliar
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const documentos = [
    {
      nome: 'Planilha Candidatos Bolsistas',
      status: user?.role === 'professor' ? 'Aguardando Assinatura' : 'download',
      tipo: 'PLANILHA_BOLSISTAS',
    },
    {
      nome: 'Ata da Seleção',
      status: user?.role === 'professor' ? 'download' : 'Assinatura Validada',
      tipo: 'ATA_SELECAO',
    },
  ];

  if (user?.role === 'professor') {
    documentos.push({
      nome: 'Ata da Seleção',
      status: 'Assinatura Aprovado',
      tipo: 'ATA_SELECAO_APROVADA',
    });
  }

  return (
    <PagesLayout title={disciplinaNome} subtitle="Seleção de monitores">
      <div className="space-y-6">
        {/* Seletor de Projeto */}
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
                    {projeto.disciplinas[0]?.codigo} -{' '}
                    {projeto.disciplinas[0]?.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {projetoSelecionado && (
          <>
            {/* Candidatos Bolsistas */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-500" />
                  Candidatos Bolsistas
                </CardTitle>
                {user?.role === 'professor' && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-blue-600 border-blue-600"
                  >
                    Gerar Documento
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                {loadingInscricoes ? (
                  <div className="text-center py-8">
                    Carregando candidatos...
                  </div>
                ) : (
                  renderCandidatos(candidatosBolsistas, 'BOLSISTA')
                )}
              </CardContent>
            </Card>

            {/* Candidatos Voluntários */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Hand className="h-5 w-5 text-green-500" />
                  Candidatos Voluntários
                </CardTitle>
                {user?.role === 'professor' && (
                  <div className="flex gap-2">
                    <Button
                      onClick={handleSalvarAvaliacoes}
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      Salvar Avaliações
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-green-600 border-green-600"
                    >
                      Gerar Documento
                    </Button>
                  </div>
                )}
              </CardHeader>
              <CardContent>
                {candidatosVoluntarios.length > 0 ? (
                  renderCandidatos(candidatosVoluntarios, 'VOLUNTARIO')
                ) : (
                  <Button
                    variant="outline"
                    className="w-full text-green-600 border-green-600"
                  >
                    Solicitar Voluntário
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Documentos */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Documentos
                </CardTitle>
                {user?.role === 'professor' && (
                  <Button variant="outline" size="sm" className="text-blue-600">
                    Adicionar Documento
                  </Button>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                {documentos.map((doc, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <span className="font-medium">{doc.nome}</span>
                    <div className="flex items-center gap-2">
                      {doc.status === 'download' && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-blue-600"
                        >
                          <Download className="h-4 w-4 mr-1" />
                          Baixar
                        </Button>
                      )}
                      {doc.status === 'Aguardando Assinatura' && (
                        <Badge
                          variant="secondary"
                          className="bg-yellow-100 text-yellow-800"
                        >
                          <Clock className="h-3 w-3 mr-1" />
                          Aguardando Assinatura
                        </Badge>
                      )}
                      {doc.status === 'Assinatura Validada' && (
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-blue-600"
                          >
                            <Download className="h-4 w-4 mr-1" />
                            Baixar
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-blue-600"
                          >
                            <Upload className="h-4 w-4 mr-1" />
                            Validar Assinatura
                          </Button>
                        </div>
                      )}
                      {doc.status === 'Assinatura Aprovado' && (
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="secondary"
                            className="bg-green-100 text-green-800"
                          >
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Assinatura Aprovado
                          </Badge>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-blue-600"
                          >
                            <Download className="h-4 w-4 mr-1" />
                            Baixar
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </PagesLayout>
  );
}
