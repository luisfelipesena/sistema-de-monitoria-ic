'use client';

import { PagesLayout } from '@/components/layout/PagesLayout';
import { TableComponent } from '@/components/layout/TableComponent';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { FileUploader } from '@/components/ui/FileUploader';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { useImportHistory, useImportPlanejamento } from '@/hooks/use-planejamento';
import { useToast } from '@/hooks/use-toast';
import { ResponseType } from '@/routes/api/projeto/importar-planejamento';
import { createFileRoute } from '@tanstack/react-router';
import { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { AlertCircle, CheckCircle, FileUp, ListChecks, Upload } from 'lucide-react';
import { useState } from 'react';

export const Route = createFileRoute(
  '/home/_layout/admin/_layout/importar-planejamento',
)({
  component: ImportarPlanejamentoPage,
});

function ImportarPlanejamentoPage() {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [ano, setAno] = useState<number>(new Date().getFullYear());
  const [semestre, setSemestre] = useState<'SEMESTRE_1' | 'SEMESTRE_2'>(
    new Date().getMonth() < 6 ? 'SEMESTRE_1' : 'SEMESTRE_2',
  );
  const [importResult, setImportResult] = useState<ResponseType['result'] | null>(
    null,
  );

  const {
    data: history,
    isLoading: historyLoading,
    error: historyError,
  } = useImportHistory();
  const importMutation = useImportPlanejamento();

  const handleImport = () => {
    if (!file || !ano || !semestre) {
      toast({
        title: 'Dados incompletos',
        description: 'Por favor, selecione ano, semestre e um arquivo.',
        variant: 'destructive',
      });
      return;
    }

    setImportResult(null); // Limpa resultados anteriores
    importMutation.mutate(
      { file, ano, semestre },
      {
        onSuccess: (data) => {
          toast({
            title: 'Importação Concluída',
            description: data.message,
          });
          setImportResult(data.result || null);
        },
        onError: (error) => {
          toast({
            title: 'Erro na Importação',
            description:
              error.message || 'Ocorreu um erro ao processar o arquivo.',
            variant: 'destructive',
          });
        },
      },
    );
  };

  const historyColumns: ColumnDef<any>[] = [
    { accessorKey: 'nomeArquivo', header: 'Arquivo' },
    {
      accessorKey: 'createdAt',
      header: 'Data',
      cell: ({ row }) => format(new Date(row.original.createdAt), 'dd/MM/yyyy HH:mm'),
    },
    { accessorKey: 'ano', header: 'Ano' },
    { accessorKey: 'semestre', header: 'Semestre', cell: ({row}) => row.original.semestre.replace('SEMESTRE_', '') },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <Badge
          variant={
            row.original.status === 'CONCLUIDO' ? 'success' : 'destructive'
          }
        >
          {row.original.status}
        </Badge>
      ),
    },
    { accessorKey: 'projetosCriados', header: 'Projetos Criados' },
    { accessorKey: 'projetosComErro', header: 'Linhas com Erro' },
    { accessorKey: 'importadoPor.username', header: 'Importado por' },
  ];

  return (
    <PagesLayout
      title="Importar Planejamento"
      subtitle="Crie projetos de monitoria em massa a partir de uma planilha"
    >
      <div className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'><FileUp /> Nova Importação</CardTitle>
            <CardDescription>
              Selecione o ano, semestre e a planilha (CSV ou XLSX) para criar
              os projetos de monitoria.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="ano">Ano</Label>
                <Input
                  id="ano"
                  type="number"
                  value={ano}
                  onChange={(e) => setAno(Number(e.target.value))}
                />
              </div>
              <div>
                <Label htmlFor="semestre">Semestre</Label>
                <Select
                  value={semestre}
                  onValueChange={(v) =>
                    setSemestre(v as 'SEMESTRE_1' | 'SEMESTRE_2')
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SEMESTRE_1">1º Semestre</SelectItem>
                    <SelectItem value="SEMESTRE_2">2º Semestre</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <FileUploader
              onFileSelect={setFile}
              selectedFile={file}
              allowedTypes={['text/csv', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']}
            />
            <Button
              onClick={handleImport}
              disabled={importMutation.isPending}
              className="w-full"
            >
              {importMutation.isPending ? (
                <>
                  <Spinner /> Processando...
                </>
              ) : (
                <><Upload className="mr-2 h-4 w-4" /> Importar e Criar Projetos</>
              )}
            </Button>
          </CardContent>
        </Card>

        {importResult && (
          <Card>
            <CardHeader>
              <CardTitle>Resultado da Importação</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="text-green-500" />
                  <span>
                    <strong>{importResult.projectsCreated}</strong> projetos criados com
                    sucesso.
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <AlertCircle className="text-red-500" />
                  <span>
                    <strong>{importResult.errors.length}</strong> linhas com erros.
                  </span>
                </div>
              </div>
              {importResult.errors.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">Detalhes dos Erros:</h4>
                  <div className="max-h-60 overflow-y-auto border rounded-md p-2 bg-muted/50">
                    <ul className="space-y-2">
                      {importResult.errors.map((err, index) => (
                        <li key={index} className="text-sm text-red-700">
                          <strong>Linha {err.row}:</strong> {err.error} -{' '}
                          <pre className="inline-block bg-red-100 p-1 rounded text-xs">{JSON.stringify(err.data)}</pre>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'><ListChecks /> Histórico de Importações</CardTitle>
          </CardHeader>
          <CardContent>
            {historyLoading ? (
              <Spinner />
            ) : historyError ? (
              <p className="text-red-500">Erro ao carregar histórico.</p>
            ) : (
              <TableComponent
                columns={historyColumns}
                data={history || []}
                searchableColumn='nomeArquivo'
                searchPlaceholder='Buscar por nome de arquivo...'
              />
            )}
          </CardContent>
        </Card>
      </div>
    </PagesLayout>
  );
}