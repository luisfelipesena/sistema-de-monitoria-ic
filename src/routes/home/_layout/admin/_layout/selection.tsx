import AdminDocuments from '@/components/features/selection/AdminDocuments';
import { PagesLayout } from '@/components/layout/PagesLayout';
import { TableComponent } from '@/components/layout/TableComponent';
import { Input } from '@/components/ui/input';
import { createFileRoute } from '@tanstack/react-router';
import { ColumnDef } from '@tanstack/react-table';
import { FileDown, Hand, Text, UsersRound } from 'lucide-react';
import { useState } from 'react';

export const Route = createFileRoute('/home/_layout/admin/_layout/selection')({
  component: SelectionAdmin,
});

interface DocumentItem {
  id: number;
  title: string;
  status: string;
  statusColor?: string;
  actions: ('download' | 'validate')[];
}

interface CandidatoData {
  id: number;
  tipo: 'bolsista' | 'voluntario';
  nome: string;
  matricula: string;
  cr: string;
  notaDisciplina: string;
  notaFinal: string;
}

function SelectionAdmin() {
  const [bolsistas, setBolsistas] = useState<CandidatoData[]>([
    {
      id: 1,
      tipo: 'bolsista',
      nome: 'Bruno Mota',
      matricula: '222229999',
      cr: '0.0',
      notaDisciplina: '0.0',
      notaFinal: '0.0',
    },
    {
      id: 2,
      tipo: 'bolsista',
      nome: 'Lucas Fernandes',
      matricula: '222118888',
      cr: '10.0',
      notaDisciplina: '10.0',
      notaFinal: '10.0',
    },
  ]);

  const [voluntarios, setVoluntarios] = useState<CandidatoData[]>([]);

  const atualizarCampo = (
    id: number,
    campo: keyof CandidatoData,
    e: React.ChangeEvent<HTMLInputElement>,
    tipo: 'bolsista' | 'voluntario',
  ) => {
    const valor = e.target.value.replace(',', '.');

    let num = parseFloat(valor);

    if (isNaN(num)) {
      num = 0;
    }

    // Limita entre 0 e 10
    if (num < 0) num = 0;
    if (num > 10) num = num / 10;

    // Limita para uma casa decimal
    num = Math.round(num * 10) / 10;

    const novaStr = num.toFixed(1);

    const lista = tipo === 'bolsista' ? bolsistas : voluntarios;
    const atualizarLista = tipo === 'bolsista' ? setBolsistas : setVoluntarios;

    const novaLista = lista.map((candidato) =>
      candidato.id === id ? { ...candidato, [campo]: novaStr } : candidato,
    );

    atualizarLista(novaLista);
  };

  const colunasCandidatos: ColumnDef<CandidatoData>[] = [
    {
      header: () => (
        <div className="flex items-center gap-2">
          <Text className="h-5 w-5 text-gray-400" />
          Nome
        </div>
      ),
      accessorKey: 'nome',
      cell: ({ row }) => (
        <span className="text-gray-900">{row.original.nome}</span>
      ),
    },
    {
      header: 'Matrícula',
      accessorKey: 'matricula',
    },
    {
      header: 'CR',
      accessorKey: 'cr',
      cell: ({ row }) => (
        <Input
          type="text"
          inputMode="decimal"
          pattern="[0-9]*[.,]?[0-9]*"
          defaultValue={row.original.cr}
          className="text-center px-0 w-16"
          onBlur={(e) =>
            atualizarCampo(row.original.id, 'cr', e, row.original.tipo)
          }
        />
      ),
    },
    {
      header: 'Nota Disciplina',
      accessorKey: 'notaDisciplina',
      cell: ({ row }) => (
        <Input
          type="text"
          inputMode="decimal"
          pattern="[0-9]*[.,]?[0-9]*"
          defaultValue={row.original.notaDisciplina}
          className="text-center px-0 w-16"
          onBlur={(e) =>
            atualizarCampo(
              row.original.id,
              'notaDisciplina',
              e,
              row.original.tipo,
            )
          }
        />
      ),
    },
    {
      header: 'Nota Final',
      accessorKey: 'notaFinal',
      cell: ({ row }) => (
        <Input
          type="text"
          inputMode="decimal"
          pattern="[0-9]*[.,]?[0-9]*"
          defaultValue={row.original.notaFinal}
          className="text-center px-0 w-16"
          onBlur={(e) =>
            atualizarCampo(row.original.id, 'notaFinal', e, row.original.tipo)
          }
        />
      ),
    },
  ];

  const documents: DocumentItem[] = [
    {
      id: 1,
      title: 'Planilha Candidatos Bolsistas',
      status: 'Aguardando',
      statusColor: 'bg-gray-400',
      actions: [],
    },
    {
      id: 2,
      title: 'Ata da Seleção',
      status: 'Pendente',
      statusColor: '',
      actions: ['download', 'validate'],
    },
    {
      id: 3,
      title: 'Ata da Seleção',
      status: 'Aprovado',
      statusColor: 'bg-green-200 text-green-900',
      actions: ['download'],
    },
  ];

  return (
    <PagesLayout title="MATA045" subtitle="Seleção de monitores">
      <div>
        {/* candidatos bolsistas */}
        <section className="py-5 w-full max-w-5xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <div className="bg-blue-900 bg-opacity-20 p-1.5 rounded-full">
                <UsersRound className="text-blue-900 w-4 h-4" />
              </div>
              <h2 className="text-lg font-bold">Candidatos Bolsistas</h2>
            </div>
            <button
              className={`flex items-center gap-2 text-white px-4 py-2 rounded-full text-sm transition
              ${
                bolsistas.length === 0
                  ? 'bg-gray-400 text-white cursor-default'
                  : 'bg-blue-900 text-white hover:bg-blue-800'
              }
              `}
              disabled={bolsistas.length === 0}
            >
              <FileDown className="w-4 h-4" />
              Gerar Documento
            </button>
          </div>

          <TableComponent columns={colunasCandidatos} data={bolsistas} />
        </section>

        {/* candidatos voluntários */}
        <section className="py-5 w-full max-w-5xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <div className="bg-blue-900 bg-opacity-20 p-1.5 rounded-full">
                <Hand className="text-blue-900 w-4 h-4" />
              </div>
              <h2 className="text-lg font-bold">Candidatos Voluntários</h2>
            </div>
            <button
              className={`flex items-center gap-2 text-white px-4 py-2 rounded-full text-sm transition
              ${
                voluntarios.length === 0
                  ? 'bg-gray-400 text-white cursor-default'
                  : 'bg-blue-900 text-white hover:bg-blue-800'
              }
              `}
              disabled={voluntarios.length === 0}
            >
              <FileDown className="w-4 h-4" />
              Gerar Documento
            </button>
          </div>

          <TableComponent columns={colunasCandidatos} data={voluntarios} />
        </section>

        {/* Documentos */}
        <section className="py-5 w-full max-w-5xl">
          <AdminDocuments documents={documents} />
        </section>
      </div>
    </PagesLayout>
  );
}
