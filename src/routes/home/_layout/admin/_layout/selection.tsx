import SecaoDocumentosNecessarios from '@/components/features/inscricao/SecaoDocumentosNecessarios';
import { PagesLayout } from '@/components/layout/PagesLayout';
import { TableComponent } from '@/components/layout/TableComponent';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createFileRoute } from '@tanstack/react-router';
import { ColumnDef } from '@tanstack/react-table';
import { FileDown, Hand, Text, UsersRound } from 'lucide-react';
import { useState } from 'react';

export const Route = createFileRoute('/home/_layout/admin/_layout/selection')({
  component: SelectionAdmin,
});

interface CandidatoData {
  id: number;
  nome: string;
  matricula: string;
  cr: number;
  notaDisciplina: number;
  notaFinal: number;
}

function SelectionAdmin() {
  const [bolsistas, setBolsistas] = useState<CandidatoData[]>([
    {
      id: 1,
      nome: 'Bruno Mota',
      matricula: '222229999',
      cr: 0.0,
      notaDisciplina: 0.0,
      notaFinal: 0.0,
    },
    {
      id: 2,
      nome: 'Lucas Fernandes',
      matricula: '222118888',
      cr: 10.0,
      notaDisciplina: 10.0,
      notaFinal: 10.0,
    },
  ]);

  const [voluntarios, setVoluntarios] = useState<CandidatoData[]>([]);

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
          type="number"
          min={0}
          max={10}
          step={0.1}
          value={row.original.cr}
          className="text-center px-0 w-16"
          disabled
        />
      ),
    },
    {
      header: 'Nota Disciplina',
      accessorKey: 'notaDisciplina',
      cell: ({ row }) => (
        <Input
          type="number"
          min={0}
          max={10}
          step={0.1}
          value={row.original.notaDisciplina}
          className="text-center px-0 w-16"
          disabled
        />
      ),
    },
    {
      header: 'Nota Final',
      accessorKey: 'notaFinal',
      cell: ({ row }) => (
        <Input
          type="number"
          min={0}
          max={10}
          step={0.1}
          value={row.original.notaFinal}
          className="text-center px-0 w-16"
        />
      ),
    },
  ];

  const headerActions = (
    <Button variant="outline" className="text-gray-600">
      <FileDown className="w-4 h-4 mr-2" />
      Gerar Documento
    </Button>
  );

  const [documentos] = useState([
    {
      id: 'planilha',
      nome: 'Planilha Candidatos Bolsistas',
      status: 'pendente' as const,
    },
    {
      id: 'ata',
      nome: 'Ata da Seleção',
      status: 'expirado' as const,
    },
    {
      id: 'ata2',
      nome: 'Ata da Seleção',
      status: 'válido' as const,
    },
  ]);

  return (
    <PagesLayout title="MATA045" subtitle="Seleção de monitores">
      <div>
        {/* candidatos bolsistas */}
        <section className="p-4 w-full max-w-5xl mx-auto">
          {/* Cabeçalho */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <UsersRound />
              <h2 className="text-lg font-semibold">Candidatos Bolsistas</h2>
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
              <FileDown />
              Gerar Documento
            </button>
          </div>
          <TableComponent columns={colunasCandidatos} data={bolsistas} />
        </section>

        {/* candidatos voluntários */}
        <section className="p-4 w-full max-w-5xl mx-auto">
          {/* Cabeçalho */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Hand />
              <h2 className="text-lg font-semibold">Candidatos Voluntários</h2>
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
              <FileDown />
              Gerar Documento
            </button>
          </div>
          <TableComponent columns={colunasCandidatos} data={voluntarios} />
        </section>

        {/* Documentos */}
        <section>
          <SecaoDocumentosNecessarios
            documentos={documentos}
            onUpload={(id) => console.log('upload', id)}
            onVisualizar={(id) => console.log('ver', id)}
          />
        </section>
      </div>
    </PagesLayout>
  );
}
