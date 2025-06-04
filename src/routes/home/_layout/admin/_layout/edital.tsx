import { PagesLayout } from '@/components/layout/PagesLayout';
import { TableComponent } from '@/components/layout/TableComponent';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  useCreatePeriodoInscricao,
  useDeletePeriodoInscricao,
  usePeriodosInscricao,
  useUpdatePeriodoInscricao,
} from '@/hooks/use-periodo-inscricao';
import { PeriodoInscricaoInput } from '@/routes/api/periodo-inscricao/-types';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { ColumnDef } from '@tanstack/react-table';
import { FileText, Loader, Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useEditaisList, useDeleteEdital, usePublishEdital, useGenerateEditalPdf, useUploadSignedEditalPdf } from '@/hooks/use-edital';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, Edit, Eye, UploadCloud, Send } from 'lucide-react';
import { EditalListItem } from '@/routes/api/edital/-types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import EditalFormModal from '@/components/features/admin/EditalFormModal';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

export const Route = createFileRoute('/home/_layout/admin/_layout/edital')({
  component: EditalManagementPage,
});

function EditalManagementPage() {
  const { data: editais, isLoading, error } = useEditaisList();
  const deleteEditalMutation = useDeleteEdital();
  const publishEditalMutation = usePublishEdital();
  const generatePdfMutation = useGenerateEditalPdf();
  const uploadSignedPdfMutation = useUploadSignedEditalPdf();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentEdital, setCurrentEdital] = useState<EditalListItem | null>(null);

  const handleCreateNew = () => {
    setCurrentEdital(null);
    setIsModalOpen(true);
  };

  const handleEdit = (edital: EditalListItem) => {
    setCurrentEdital(edital);
    setIsModalOpen(true);
  };

  const handleDelete = (editalId: number) => {
    deleteEditalMutation.mutate(editalId, {
      onSuccess: () => toast({ title: 'Edital excluído com sucesso!' }),
      onError: (err) => toast({ title: 'Erro ao excluir edital', description: err.message, variant: 'destructive' }),
    });
  };

  const handlePublish = (editalId: number) => {
    publishEditalMutation.mutate(editalId, {
      onSuccess: () => toast({ title: 'Edital publicado com sucesso!' }),
      onError: (err) => toast({ title: 'Erro ao publicar edital', description: err.message, variant: 'destructive' }),
    });
  };

  const handleGeneratePdf = (editalId: number) => {
    generatePdfMutation.mutate(editalId);
  };

  const handleFileSelectedAndUpload = async (event: React.ChangeEvent<HTMLInputElement>, editalId: number) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        toast({ title: 'Arquivo inválido', description: 'Apenas arquivos PDF são permitidos.', variant: 'destructive' });
        event.target.value = '';
        return;
      }
      try {
        await uploadSignedPdfMutation.mutateAsync({ editalId, file });
        toast({ title: 'PDF assinado enviado com sucesso!' });
      } catch (err: any) {
        toast({ title: 'Erro ao enviar PDF assinado', description: err.message, variant: 'destructive' });
      }
      event.target.value = '';
    }
  };

  const getStatusBadgeVariant = (status?: 'ATIVO' | 'FUTURO' | 'FINALIZADO') => {
    if (status === 'ATIVO') return 'success' as const;
    if (status === 'FUTURO') return 'default' as const;
    if (status === 'FINALIZADO') return 'outline' as const;
    return 'secondary' as const;
  };

  if (isLoading) return <div className="p-6">Carregando editais...</div>;
  if (error) return <div className="p-6 text-red-600">Erro ao carregar editais: {error.message}</div>;

  return (
    <PagesLayout
      title="Gerenciamento de Editais"
      subtitle="Crie, edite e publique os editais de monitoria."
    >
      <div className="mb-4 flex justify-end">
        <Button onClick={handleCreateNew}>
          <PlusCircle className="mr-2 h-4 w-4" /> Novo Edital
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Lista de Editais</CardTitle>
          <CardDescription>
            Total de {editais?.length || 0} editais cadastrados.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {editais && editais.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Número</TableHead>
                  <TableHead>Título</TableHead>
                  <TableHead>Período Inscrição</TableHead>
                  <TableHead>Status Período</TableHead>
                  <TableHead>Publicado</TableHead>
                  <TableHead>Data Publicação</TableHead>
                  <TableHead className="text-right w-[280px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {editais.map((edital) => (
                  <TableRow key={edital.id}>
                    <TableCell className="font-medium">{edital.numeroEdital}</TableCell>
                    <TableCell>{edital.titulo}</TableCell>
                    <TableCell>
                      {edital.periodoInscricao ? 
                        `${new Date(edital.periodoInscricao.dataInicio).toLocaleDateString('pt-BR')} - ${new Date(edital.periodoInscricao.dataFim).toLocaleDateString('pt-BR')}`
                        : 'N/A'}
                    </TableCell>
                    <TableCell>
                      {edital.periodoInscricao?.status ? (
                        <Badge variant={getStatusBadgeVariant(edital.periodoInscricao.status)}>
                          {edital.periodoInscricao.status}
                        </Badge>
                      ) : 'N/A'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={edital.publicado ? 'success' : 'outline'}>
                        {edital.publicado ? 'Sim' : 'Não'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {edital.dataPublicacao ? format(new Date(edital.dataPublicacao), 'dd/MM/yyyy', { locale: ptBR }) : '-'}
                    </TableCell>
                    <TableCell className="text-right space-x-1">
                      <input 
                        type="file" 
                        id={`file-upload-${edital.id}`} 
                        className="hidden" 
                        accept=".pdf"
                        onChange={(e) => handleFileSelectedAndUpload(e, edital.id)}
                      />
                      <Button variant="outline" size="icon" title="Editar" onClick={() => handleEdit(edital)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="icon" title="Visualizar/Gerar PDF" onClick={() => handleGeneratePdf(edital.id)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      {!edital.publicado && (
                        <Button variant="outline" size="icon" title="Publicar Edital" onClick={() => handlePublish(edital.id)} disabled={publishEditalMutation.isPending && publishEditalMutation.variables === edital.id}>
                          <Send className="h-4 w-4" />
                        </Button>
                      )}
                      {edital.publicado && (
                        <Button variant="outline" size="icon" title="Enviar PDF Assinado" onClick={() => document.getElementById(`file-upload-${edital.id}`)?.click()} disabled={uploadSignedPdfMutation.isPending && uploadSignedPdfMutation.variables?.editalId === edital.id}>
                            <UploadCloud className="h-4 w-4" />
                        </Button>
                      )}
                      {!edital.publicado && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="icon" title="Excluir" disabled={deleteEditalMutation.isPending && deleteEditalMutation.variables === edital.id}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                              <AlertDialogDescription>
                                Tem certeza que deseja excluir o edital "{edital.titulo}"? Esta ação não pode ser desfeita.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(edital.id)} className="bg-destructive hover:bg-destructive/90">
                                Excluir
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-10">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-sm font-medium text-muted-foreground">
                Nenhum edital encontrado.
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Crie um novo edital para começar.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {isModalOpen && (
        <EditalFormModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setCurrentEdital(null);
          }}
          edital={currentEdital}
        />
      )}
    </PagesLayout>
  );
}
