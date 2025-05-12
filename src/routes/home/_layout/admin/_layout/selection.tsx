import SecaoDocumentosNecessarios from '@/components/features/inscricao/SecaoDocumentosNecessarios';
import { PagesLayout } from '@/components/layout/PagesLayout';
import { TableComponent } from '@/components/layout/TableComponent';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createFileRoute } from '@tanstack/react-router';
import { ColumnDef } from '@tanstack/react-table';
import { FileDown, Text } from 'lucide-react';
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
  const [dados, setDados] = useState<CandidatoData[]>([
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
          disabled
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
        <section>
          <TableComponent columns={colunasCandidatos} data={dados} />
        </section>
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
