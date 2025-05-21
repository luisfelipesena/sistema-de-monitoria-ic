import AcoesInscricao from '@/components/features/inscricao/AcoesInscricao';
import DadosPessoaisForm from '@/components/features/inscricao/DadosPessoaisForm';
import SecaoDocumentosNecessarios from '@/components/features/inscricao/SecaoDocumentosNecessarios';
import SelecaoDeVagaTable from '@/components/features/inscricao/SelecaoDeVagaTable';
import { PagesLayout } from '@/components/layout/PagesLayout';
import { VagaDisponivel } from '@/routes/api/monitoria/-types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';

export const Route = createFileRoute('/home/_layout/common/monitoria/')({
  component: RouteComponent,
});

function RouteComponent() {
  const queryClient = useQueryClient();

  // --- Vagas disponíveis ---
  const { data: vagasDisponiveis = [], isLoading: loadingVagas } = useQuery<
    VagaDisponivel[]
  >({
    queryKey: ['vagas-disponiveis'],
    queryFn: async () => {
      const res = await fetch('/api/monitoria/vagas');
      if (!res.ok) throw new Error('Falha ao buscar vagas');
      return res.json();
    },
  });

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

  // --- Documentos ---
  const [documentos, setDocumentos] = useState([
    {
      id: 'termo',
      nome: 'Termo de compromisso assinado',
      status: 'pendente' as const,
    },
    {
      id: 'matricula',
      nome: 'Comprovante de matrícula',
      status: 'pendente' as const,
    },
    { id: 'historico', nome: 'Histórico escolar', status: 'pendente' as const },
  ]);

  const handleSelecionarVaga = (id: string) => {
    setSelectedVagaId(id);
  };

  const handleUploadDocumento = async (file: File, docId: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('entityType', 'inscricao_documento');
    formData.append('entityId', docId);

    const res = await fetch('/api/files/upload', {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) {
      alert('Falha ao enviar arquivo');
      return;
    }

    const data = await res.json();
    // Atualizar status e salvar fileId internamente
    setDocumentos((prev) =>
      prev.map((d) =>
        d.id === docId
          ? {
              ...d,
              status: 'válido' as const,
              fileId: data.fileId,
              ultimaAtualizacao: new Date().toLocaleDateString('pt-BR'),
            }
          : d,
      ),
    );
  };

  const enviarMutation = useMutation({
    mutationFn: async () => {
      if (!selectedVagaId) {
        throw new Error('Selecione uma vaga');
      }
      const vagaSelecionada = vagasDisponiveis.find(
        (v) => v.id === selectedVagaId,
      );
      if (!vagaSelecionada) throw new Error('Vaga inválida');

      const body = {
        projetoId: vagaSelecionada.projetoId,
        tipoVagaPretendida:
          vagaSelecionada.tipo === 'VOLUNTARIO' ? 'VOLUNTARIO' : 'BOLSISTA',
        documentos: documentos
          .filter((d: any) => d.fileId)
          .map((d: any) => ({ tipoDocumento: d.id, fileId: d.fileId })),
      };

      const res = await fetch('/api/monitoria/inscricao', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err?.error || 'Erro ao enviar inscrição');
      }

      return res.json();
    },
    onSuccess: () => {
      alert('Inscrição enviada com sucesso');
    },
  });

  return (
    <PagesLayout
      title="Inscrição para monitoria"
      subtitle="Preencha o formulário abaixo para se candidatar à vaga de monitoria."
    >
      <div className="max-w-7xl mx-auto  space-y-12">
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
            documentos={documentos as any}
            onUpload={handleUploadDocumento}
            onVisualizar={(id) => {
              const doc = documentos.find((d) => d.id === id);
              if (doc && (doc as any).fileId) {
                window.open(`/api/files/access/${(doc as any).fileId}`);
              }
            }}
          />
        </section>

        <AcoesInscricao
          onEnviar={() => enviarMutation.mutate()}
          onCancelar={() => window.history.back()}
          loading={enviarMutation.isLoading}
        />
      </div>
    </PagesLayout>
  );
}
