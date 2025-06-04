import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useImportPlanejamento, useImportHistory } from '@/hooks/use-import-planejamento';
import { useToast } from '@/hooks/use-toast';
import { Upload, FileText, CheckCircle, XCircle, AlertCircle, Download, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const Route = createFileRoute('/home/_layout/admin/_layout/importar-planejamento')({
  component: ImportarPlanejamentoPage,
});

function ImportarPlanejamentoPage() {
  const [file, setFile] = useState<File | null>(null);
  const [ano, setAno] = useState<string>('');
  const [semestre, setSemestre] = useState<string>('');
  const [isDragOver, setIsDragOver] = useState(false);

  const { toast } = useToast();
  const importMutation = useImportPlanejamento();
  const { data: history = [], isLoading: historyLoading } = useImportHistory();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      const allowedTypes = [
        'text/csv',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      ];
      
      if (!allowedTypes.includes(selectedFile.type) && !selectedFile.name.match(/\.(csv|xlsx|xls)$/i)) {
        toast({
          title: 'Arquivo inválido',
          description: 'Por favor, selecione um arquivo CSV ou Excel (.xlsx, .xls)',
          variant: 'destructive',
        });
        return;
      }
      
      setFile(selectedFile);
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragOver(false);
    
    const droppedFile = event.dataTransfer.files?.[0];
    if (droppedFile) {
      const allowedTypes = [
        'text/csv',
        'application/vnd.ms-excel', 
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      ];
      
      if (!allowedTypes.includes(droppedFile.type) && !droppedFile.name.match(/\.(csv|xlsx|xls)$/i)) {
        toast({
          title: 'Arquivo inválido',
          description: 'Por favor, selecione um arquivo CSV ou Excel (.xlsx, .xls)',
          variant: 'destructive',
        });
        return;
      }
      
      setFile(droppedFile);
    }
  };

  const handleSubmit = async () => {
    if (!file || !ano || !semestre) {
      toast({
        title: 'Dados incompletos',
        description: 'Por favor, preencha todos os campos obrigatórios.',
        variant: 'destructive',
      });
      return;
    }

    const fileType = file.name.endsWith('.csv') ? 'csv' : 'xlsx';

    try {
      const result = await importMutation.mutateAsync({
        file,
        metadata: {
          fileName: file.name,
          fileType,
          ano: parseInt(ano),
          semestre: semestre as 'SEMESTRE_1' | 'SEMESTRE_2',
        },
      });

      toast({
        title: 'Importação realizada com sucesso!',
        description: result.message,
      });

      setFile(null);
      setAno('');
      setSemestre('');
    } catch (error) {
      toast({
        title: 'Erro na importação',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive',
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'CONCLUIDO':
        return <Badge variant="default" className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Concluído</Badge>;
      case 'CONCLUIDO_COM_ERROS':
        return <Badge variant="destructive"><AlertCircle className="w-3 h-3 mr-1" />Com Erros</Badge>;
      case 'ERRO':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Erro</Badge>;
      case 'PROCESSANDO':
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Processando</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getSemestreLabel = (semestre: string) => {
    return semestre === 'SEMESTRE_1' ? '1º Semestre' : '2º Semestre';
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Importar Planejamento Semestral</h1>
        <p className="text-muted-foreground">
          Importe planilhas de planejamento para gerar projetos de monitoria automaticamente
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Nova Importação
            </CardTitle>
            <CardDescription>
              Faça upload de uma planilha CSV ou Excel com o planejamento semestral
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="ano">Ano</Label>
                <Select value={ano} onValueChange={setAno}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o ano" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2024">2024</SelectItem>
                    <SelectItem value="2025">2025</SelectItem>
                    <SelectItem value="2026">2026</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="semestre">Semestre</Label>
                <Select value={semestre} onValueChange={setSemestre}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o semestre" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SEMESTRE_1">1º Semestre</SelectItem>
                    <SelectItem value="SEMESTRE_2">2º Semestre</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div
              className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                isDragOver 
                  ? 'border-primary bg-primary/5' 
                  : file 
                    ? 'border-green-500 bg-green-50' 
                    : 'border-gray-300 hover:border-gray-400'
              }`}
              onDrop={handleDrop}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragOver(true);
              }}
              onDragLeave={() => setIsDragOver(false)}
            >
              <input
                type="file"
                id="file-upload"
                className="hidden"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileChange}
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <div className="space-y-2">
                  {file ? (
                    <>
                      <FileText className="h-8 w-8 mx-auto text-green-600" />
                      <p className="text-sm font-medium text-green-600">{file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </>
                  ) : (
                    <>
                      <Upload className="h-8 w-8 mx-auto text-gray-400" />
                      <p className="text-sm">
                        <span className="font-medium text-primary">Clique para selecionar</span> ou
                        arraste um arquivo aqui
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Formatos suportados: CSV, XLSX, XLS
                      </p>
                    </>
                  )}
                </div>
              </label>
            </div>

            <Button 
              onClick={handleSubmit} 
              disabled={!file || !ano || !semestre || importMutation.isPending}
              className="w-full"
            >
              {importMutation.isPending ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Processando...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Importar Planejamento
                </>
              )}
            </Button>

            {importMutation.isPending && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Processando arquivo...</span>
                </div>
                <Progress value={undefined} className="w-full" />
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Formato da Planilha</CardTitle>
            <CardDescription>
              Estrutura esperada para o arquivo de importação
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Colunas Obrigatórias</AlertTitle>
              <AlertDescription className="mt-2">
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li><strong>Código Disciplina:</strong> Código da disciplina</li>
                  <li><strong>Nome Disciplina:</strong> Nome completo da disciplina</li>
                  <li><strong>SIAPE Professor:</strong> Matrícula SIAPE do professor</li>
                  <li><strong>Nome Professor:</strong> Nome completo do professor</li>
                  <li><strong>Email Professor:</strong> Email institucional</li>
                  <li><strong>Departamento:</strong> Nome do departamento</li>
                  <li><strong>Carga Horária:</strong> Horas semanais</li>
                  <li><strong>Número Semanas:</strong> Duração em semanas</li>
                  <li><strong>Bolsas Solicitadas:</strong> Quantidade de bolsas</li>
                  <li><strong>Voluntários:</strong> Quantidade de voluntários</li>
                  <li><strong>Público Alvo:</strong> Descrição do público</li>
                  <li><strong>Estimativa Pessoas:</strong> Número estimado</li>
                  <li><strong>Objetivos:</strong> Descrição dos objetivos</li>
                </ul>
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Histórico de Importações</CardTitle>
          <CardDescription>
            Visualize todas as importações realizadas anteriormente
          </CardDescription>
        </CardHeader>
        <CardContent>
          {historyLoading ? (
            <div className="flex justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma importação realizada ainda
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Arquivo</TableHead>
                  <TableHead>Período</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Projetos</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Importado por</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.nomeArquivo}</TableCell>
                    <TableCell>
                      {getSemestreLabel(item.semestre)} {item.ano}
                    </TableCell>
                    <TableCell>{getStatusBadge(item.status)}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div className="text-green-600">{item.projetosCriados} criados</div>
                        {item.projetosComErro > 0 && (
                          <div className="text-red-600">{item.projetosComErro} com erro</div>
                        )}
                        <div className="text-muted-foreground">
                          Total: {item.totalProjetos}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {format(new Date(item.createdAt), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                    </TableCell>
                    <TableCell>{item.importadoPor.username}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}