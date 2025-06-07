import { PagesLayout } from '@/components/layout/PagesLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { useGenerateEdital, useEditalList, useDownloadEdital, usePublishEdital } from '@/hooks/use-edital';
import { usePeriodosInscricao } from '@/hooks/use-periodo-inscricao';
import { createFileRoute } from '@tanstack/react-router';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Download, FileText, Plus, Upload, Eye, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

export const Route = createFileRoute('/home/_layout/admin/_layout/edital-management')({
  component: EditalManagementComponent,
});

function EditalManagementComponent() {
  const [showGenerateDialog, setShowGenerateDialog] = useState(false);
  const [selectedPeriodoId, setSelectedPeriodoId] = useState<number | null>(null);
  const [numeroEdital, setNumeroEdital] = useState('');
  const [titulo, setTitulo] = useState('');
  const [descricaoHtml, setDescricaoHtml] = useState('');

  const { data: editais, isLoading: loadingEditais, refetch } = useEditalList();
  const { data: periodos, isLoading: loadingPeriodos } = usePeriodosInscricao();
  const generateMutation = useGenerateEdital();
  const downloadMutation = useDownloadEdital();
  const publishMutation = usePublishEdital();

  const handleGenerate = () => {
    if (!selectedPeriodoId || !numeroEdital) {
      toast.error('Período de inscrição e número do edital são obrigatórios');
      return;
    }

    toast.promise(
      generateMutation.mutateAsync({
        periodoInscricaoId: selectedPeriodoId,
        numeroEdital,
        titulo: titulo || undefined,
        descricaoHtml: descricaoHtml || undefined,
      }),
      {
        loading: 'Gerando edital...',
        success: (result) => {
          setShowGenerateDialog(false);
          setSelectedPeriodoId(null);
          setNumeroEdital('');
          setTitulo('');
          setDescricaoHtml('');
          refetch();
          return `Edital gerado com sucesso! ${result.totalProjetos} projetos incluídos.`;
        },
        error: (err) => `Erro ao gerar edital: ${err.message}`,
      },
    );
  };

  const handleDownload = (editalId: number, numeroEdital: string) => {
    downloadMutation.mutate({
      editalId,
      fileName: `edital-${numeroEdital}.pdf`,
    });
  };

  const handleTogglePublish = (editalId: number, currentStatus: boolean) => {
    const action = currentStatus ? 'despublicar' : 'publicar';
    
    toast.promise(
      publishMutation.mutateAsync({
        editalId,
        publicado: !currentStatus,
      }),
      {
        loading: `${action === 'publicar' ? 'Publicando' : 'Despublicando'} edital...`,
        success: `Edital ${action === 'publicar' ? 'publicado' : 'despublicado'} com sucesso!`,
        error: `Erro ao ${action} edital`,
      },
    );
  };

  const renderStatusBadge = (publicado: boolean) => {
    return publicado ? (
      <Badge variant="default">Publicado</Badge>
    ) : (
      <Badge variant="secondary">Rascunho</Badge>
    );
  };

  if (loadingEditais || loadingPeriodos) {
    return (
      <PagesLayout title="Gerenciamento de Editais">
        <div className="flex justify-center items-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </PagesLayout>
    );
  }

  return (
    <PagesLayout
      title="Gerenciamento de Editais"
      subtitle="Gerencie editais internos de seleção de monitores"
    >
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Editais Cadastrados
                </CardTitle>
                <CardDescription>
                  Lista de todos os editais gerados no sistema
                </CardDescription>
              </div>
              <Dialog open={showGenerateDialog} onOpenChange={setShowGenerateDialog}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Gerar Novo Edital
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Gerar Novo Edital</DialogTitle>
                    <DialogDescription>
                      Preencha as informações para gerar um novo edital interno de monitoria
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="periodo">Período de Inscrição *</Label>
                      <Select
                        value={selectedPeriodoId?.toString() || ''}
                        onValueChange={(value) => setSelectedPeriodoId(Number(value))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o período" />
                        </SelectTrigger>
                        <SelectContent>
                          {periodos?.map((periodo) => (
                            <SelectItem key={periodo.id} value={periodo.id.toString()}>
                              {periodo.ano}.{periodo.semestre === 'SEMESTRE_1' ? '1' : '2'} 
                              ({format(new Date(periodo.dataInicio), 'dd/MM/yyyy')} - {format(new Date(periodo.dataFim), 'dd/MM/yyyy')})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="numeroEdital">Número do Edital *</Label>
                      <Input
                        id="numeroEdital"
                        value={numeroEdital}
                        onChange={(e) => setNumeroEdital(e.target.value)}
                        placeholder="Ex: 001/2024"
                      />
                    </div>

                    <div>
                      <Label htmlFor="titulo">Título (Opcional)</Label>
                      <Input
                        id="titulo"
                        value={titulo}
                        onChange={(e) => setTitulo(e.target.value)}
                        placeholder="Edital Interno de Seleção de Monitores"
                      />
                    </div>

                    <div>
                      <Label htmlFor="descricao">Disposições Finais (Opcional)</Label>
                      <Textarea
                        id="descricao"
                        value={descricaoHtml}
                        onChange={(e) => setDescricaoHtml(e.target.value)}
                        placeholder="Informações adicionais para o edital..."
                        rows={4}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowGenerateDialog(false)}>
                      Cancelar
                    </Button>
                    <Button 
                      onClick={handleGenerate}
                      disabled={generateMutation.isPending || !selectedPeriodoId || !numeroEdital}
                    >
                      {generateMutation.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Gerando...
                        </>
                      ) : (
                        <>
                          <FileText className="h-4 w-4 mr-2" />
                          Gerar Edital
                        </>
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {editais && editais.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Número</TableHead>
                    <TableHead>Título</TableHead>
                    <TableHead>Período</TableHead>
                    <TableHead>Data de Publicação</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {editais.map((edital) => (
                    <TableRow key={edital.id}>
                      <TableCell className="font-medium">{edital.numeroEdital}</TableCell>
                      <TableCell>{edital.titulo}</TableCell>
                      <TableCell>
                        {/* Assuming we have period info in the edital object */}
                        2024.1
                      </TableCell>
                      <TableCell>
                        {edital.dataPublicacao && format(new Date(edital.dataPublicacao), 'dd/MM/yyyy', { locale: ptBR })}
                      </TableCell>
                      <TableCell>{renderStatusBadge(edital.publicado)}</TableCell>
                      <TableCell>
                        <div className="flex gap-2 justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownload(edital.id, edital.numeroEdital)}
                            disabled={downloadMutation.isPending}
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </Button>
                          <Button
                            variant={edital.publicado ? "destructive" : "primary"}
                            size="sm"
                            onClick={() => handleTogglePublish(edital.id, edital.publicado)}
                            disabled={publishMutation.isPending}
                          >
                            {edital.publicado ? (
                              <>
                                <Eye className="h-4 w-4 mr-2" />
                                Despublicar
                              </>
                            ) : (
                              <>
                                <Upload className="h-4 w-4 mr-2" />
                                Publicar
                              </>
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="mx-auto h-12 w-12 mb-4" />
                <h3 className="text-lg font-medium mb-2">Nenhum edital encontrado</h3>
                <p>Comece gerando seu primeiro edital interno de monitoria.</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Como Funciona</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <div className="flex items-start gap-2">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium">
                1
              </span>
              <p>Selecione o período de inscrição e defina o número do edital</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium">
                2
              </span>
              <p>O sistema agrega automaticamente todos os projetos aprovados do período</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium">
                3
              </span>
              <p>Um PDF é gerado com todas as vagas disponíveis</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="flex-shrink-0 w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-xs font-medium">
                4
              </span>
              <p>Publique o edital para torná-lo visível aos estudantes</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </PagesLayout>
  );
} 