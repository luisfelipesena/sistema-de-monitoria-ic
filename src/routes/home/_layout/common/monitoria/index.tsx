import AcoesInscricao from '@/components/features/inscricao/AcoesInscricao';
import DadosPessoaisForm from '@/components/features/inscricao/DadosPessoaisForm';
import SecaoDocumentosNecessarios from '@/components/features/inscricao/SecaoDocumentosNecessarios';
import SelecaoDeVagaTable from '@/components/features/inscricao/SelecaoDeVagaTable';
import { PagesLayout } from '@/components/layout/PagesLayout';
import { useFileUpload } from '@/hooks/use-files';
import { useCriarInscricao, useVagasDisponiveis } from '@/hooks/use-monitoria';
import { useToast } from '@/hooks/use-toast';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';

export const Route = createFileRoute('/home/_layout/common/monitoria/')({
  component: RouteComponent,
});

type DocumentoState = {
  id: string;
  nome: string;
  status: 'válido' | 'expirado' | 'pendente';
  fileId?: string;
  fileName?: string;
  ultimaAtualizacao?: string;
};

function RouteComponent() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const { data: vagasDisponiveis = [], isLoading: loadingVagas } =
    useVagasDisponiveis();
  const fileUploadMutation = useFileUpload();
  const criarInscricaoMutation = useCriarInscricao();

  const [selectedVagaId, setSelectedVagaId] = useState<string | null>(null);

  const vagas = vagasDisponiveis.map((v) => ({
    id: v.id,
    nome: v.nome,
    codigo: v.codigo,
    tipo:
      v.tipo === 'VOLUNTARIO'
        ? ('Voluntários' as const)
        : ('Bolsistas' as const),
    vagas: v.vagas,
    selecionado: v.id === selectedVagaId,
  }));

  const [documentos, setDocumentos] = useState<DocumentoState[]>([
    {
      id: 'termo',
      nome: 'Termo de compromisso assinado',
      status: 'pendente',
    },
    {
      id: 'matricula',
      nome: 'Comprovante de matrícula',
      status: 'pendente',
    },
    {
      id: 'historico',
      nome: 'Histórico escolar',
      status: 'pendente',
    },
  ]);

  const handleSelecionarVaga = (id: string) => {
    setSelectedVagaId(id);
  };

  const handleUploadDocumento = async (file: File, docId: string) => {
    try {
      const response = await fileUploadMutation.mutateAsync({
        file,
        entityType: 'inscricao_documento',
        entityId: docId,
      });

      setDocumentos((prev) =>
        prev.map((d) =>
          d.id === docId
            ? {
                ...d,
                status: 'válido' as const,
                fileId: response.fileId,
                fileName: file.name,
                ultimaAtualizacao: new Date().toLocaleDateString('pt-BR'),
              }
            : d,
        ),
      );

      toast({
        title: 'Upload realizado',
        description: `${file.name} foi enviado com sucesso`,
      });
    } catch (error) {
      toast({
        title: 'Erro no upload',
        description: 'Não foi possível enviar o arquivo',
        variant: 'destructive',
      });
    }
  };

  const handleEnviarInscricao = async () => {
    if (!selectedVagaId) {
      toast({
        title: 'Vaga não selecionada',
        description: 'Por favor, selecione uma vaga antes de enviar',
        variant: 'destructive',
      });
      return;
    }

    const termoCompromisso = documentos.find((d) => d.id === 'termo');
    if (!termoCompromisso?.fileId) {
      toast({
        title: 'Documento obrigatório',
        description: 'O termo de compromisso assinado é obrigatório',
        variant: 'destructive',
      });
      return;
    }

    const vagaSelecionada = vagasDisponiveis.find(
      (v) => v.id === selectedVagaId,
    );
    if (!vagaSelecionada) {
      toast({
        title: 'Erro',
        description: 'Vaga selecionada não encontrada',
        variant: 'destructive',
      });
      return;
    }

    try {
      const documentosComFileId = documentos
        .filter((d) => d.fileId)
        .map((d) => ({
          tipoDocumento: d.id,
          fileId: d.fileId!,
        }));

      await criarInscricaoMutation.mutateAsync({
        projetoId: vagaSelecionada.projetoId,
        tipoVagaPretendida:
          vagaSelecionada.tipo === 'VOLUNTARIO' ? 'VOLUNTARIO' : 'BOLSISTA',
        documentos: documentosComFileId,
      });

      toast({
        title: 'Inscrição enviada',
        description: 'Sua inscrição foi enviada com sucesso!',
      });

      navigate({ to: '/home/common/status' });
    } catch (error: any) {
      toast({
        title: 'Erro ao enviar inscrição',
        description:
          error.message || 'Ocorreu um erro ao processar sua inscrição',
        variant: 'destructive',
      });
    }
  };

  if (loadingVagas) {
    return (
      <PagesLayout
        title="Inscrição para monitoria"
        subtitle="Carregando vagas disponíveis..."
      >
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </PagesLayout>
    );
  }

  return (
    <PagesLayout
      title="Inscrição para monitoria"
      subtitle="Preencha o formulário abaixo para se candidatar à vaga de monitoria."
    >
      <div className="max-w-7xl mx-auto space-y-12">
        <section className="bg-gray-50 p-6 rounded-xl shadow-sm">
          <DadosPessoaisForm />
        </section>

        <section>
          <SelecaoDeVagaTable
            vagas={vagas}
            onSelecionar={handleSelecionarVaga}
          />
        </section>

        <section>
          <SecaoDocumentosNecessarios
            documentos={documentos.map((d) => ({
              ...d,
              selectedFileName: d.fileName,
            }))}
            onUpload={handleUploadDocumento}
            onVisualizar={(id) => {
              const doc = documentos.find((d) => d.id === id);
              if (doc && doc.fileId) {
                window.open(`/api/files/access/${doc.fileId}`);
              }
            }}
          />
        </section>

        <AcoesInscricao
          onEnviar={handleEnviarInscricao}
          onCancelar={() => window.history.back()}
          loading={criarInscricaoMutation.isPending}
        />
      </div>
    </PagesLayout>
  );
}
