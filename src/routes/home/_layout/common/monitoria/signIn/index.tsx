import AcoesInscricao from '@/components/features/inscricao/AcoesInscricao';
import DadosPessoaisForm from '@/components/features/inscricao/DadosPessoaisForm';
import SecaoDocumentosNecessarios from '@/components/features/inscricao/SecaoDocumentosNecessarios';
import SelecaoDeVagaTable from '@/components/features/inscricao/SelecaoDeVagaTable';
import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';

export const Route = createFileRoute('/home/_layout/common/monitoria/signIn/')({
  component: RouteComponent,
});

function RouteComponent() {
  const [vagas, setVagas] = useState([
    {
      id: '1',
      nome: 'Qualidade de Software',
      codigo: 'MATB02',
      tipo: 'Voluntários' as const,
      vagas: 2,
      selecionado: false,
    },
    {
      id: '2',
      nome: 'Qualidade de Software',
      codigo: 'MATB02',
      tipo: 'Bolsistas' as const,
      vagas: 3,
      selecionado: true,
    },
  ]);

  const [documentos] = useState([
    {
      id: 'termo',
      nome: 'Termo de compromisso assinado',
      status: 'pendente' as const,
    },
    {
      id: 'matricula',
      nome: 'Comprovante de matrícula',
      ultimaAtualizacao: '08/2024',
      status: 'expirado' as const,
    },
    {
      id: 'historico',
      nome: 'Histórico escolar',
      ultimaAtualizacao: '02/2025',
      status: 'válido' as const,
    },
  ]);

  const handleSelecionarVaga = (id: string) => {
    setVagas((prev) =>
      prev.map((vaga) => ({
        ...vaga,
        selecionado: vaga.id === id,
      })),
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 space-y-12">
      <section>
        <h1 className="text-3xl font-bold text-gray-900">
          Inscrição para monitoria
        </h1>
        <p className="text-gray-600">
          Preencha o formulário abaixo para se candidatar à vaga de monitoria.
        </p>
      </section>

      <section className="bg-gray-50 p-6 rounded-xl shadow-sm">
        <DadosPessoaisForm />
      </section>

      <section>
        <SelecaoDeVagaTable vagas={vagas} onSelecionar={handleSelecionarVaga} />
      </section>

      <section>
        <SecaoDocumentosNecessarios
          documentos={documentos}
          onUpload={(id) => console.log('upload', id)}
          onVisualizar={(id) => console.log('ver', id)}
        />
      </section>

      <AcoesInscricao
        onEnviar={() => console.log('enviar')}
        onCancelar={() => console.log('cancelar')}
      />
    </div>
  );
}
``;
