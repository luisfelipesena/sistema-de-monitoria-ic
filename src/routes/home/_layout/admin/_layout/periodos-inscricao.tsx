import { createFileRoute } from '@tanstack/react-router';
import { PlusCircle, Edit, Trash2, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { usePeriodosInscricao, useDeletePeriodoInscricao } from '@/hooks/use-periodo-inscricao';
import { useState } from 'react';
import type { PeriodoInscricaoComStatus } from '@/routes/api/periodo-inscricao/-types';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import PeriodoInscricaoFormModal from '@/components/features/admin/PeriodoInscricaoFormModal';

export const Route = createFileRoute('/home/_layout/admin/_layout/periodos-inscricao')({
  component: PeriodosInscricaoPage,
});

function PeriodosInscricaoPage() {
  const { data: periodos, isLoading, error } = usePeriodosInscricao();
  const deleteMutation = useDeletePeriodoInscricao();
  const { toast } = useToast();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPeriodo, setEditingPeriodo] = useState<PeriodoInscricaoComStatus | null>(null);
  
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [periodoToDelete, setPeriodoToDelete] = useState<PeriodoInscricaoComStatus | null>(null);

  const handleCreateNew = () => {
    setEditingPeriodo(null);
    setIsModalOpen(true);
  };

  const handleEdit = (periodo: PeriodoInscricaoComStatus) => {
    setEditingPeriodo(periodo);
    setIsModalOpen(true);
  };

  const handleDeletePrompt = (periodo: PeriodoInscricaoComStatus) => {
    setPeriodoToDelete(periodo);
    setIsAlertOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!periodoToDelete) return;
    try {
      await deleteMutation.mutateAsync(periodoToDelete.id);
      toast({ title: 'Sucesso', description: 'Período de inscrição excluído.' });
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message || 'Não foi possível excluir o período.', variant: 'destructive' });
    } finally {
      setIsAlertOpen(false);
      setPeriodoToDelete(null);
    }
  };

  const getStatusVariant = (status: 'ATIVO' | 'FUTURO' | 'FINALIZADO' | string) => {
    switch (status) {
      case 'ATIVO': return 'success';
      case 'FUTURO': return 'info';
      case 'FINALIZADO': return 'secondary';
      default: return 'outline';
    }
  };
  
  const formatDate = (dateString: string | Date) => {
    return new Date(dateString).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
  }

  if (isLoading) return <div>Carregando períodos de inscrição...</div>;
  if (error) return <div>Erro ao carregar dados: {error.message}</div>;

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Períodos de Inscrição</h1>
          <p className="text-muted-foreground">
            Gerencie os períodos para inscrição em projetos de monitoria.
          </p>
        </div>
        <Button onClick={handleCreateNew}>
          <PlusCircle className="mr-2 h-4 w-4" /> Criar Novo Período
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Períodos</CardTitle>
          <CardDescription>Visualize e gerencie todos os períodos de inscrição cadastrados.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ano/Semestre</TableHead>
                <TableHead>Data Início</TableHead>
                <TableHead>Data Fim</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-center">Projetos</TableHead>
                <TableHead className="text-center">Inscrições</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {periodos && periodos.length > 0 ? periodos.map((periodo) => (
                <TableRow key={periodo.id}>
                  <TableCell>{periodo.ano}.{periodo.semestre === 'SEMESTRE_1' ? '1' : '2'}</TableCell>
                  <TableCell>{formatDate(periodo.dataInicio)}</TableCell>
                  <TableCell>{formatDate(periodo.dataFim)}</TableCell>
                  <TableCell><Badge variant={getStatusVariant(periodo.status) as any}>{periodo.status}</Badge></TableCell>
                  <TableCell className="text-center">{periodo.totalProjetos}</TableCell>
                  <TableCell className="text-center">{periodo.totalInscricoes}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(periodo)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDeletePrompt(periodo)} disabled={periodo.totalProjetos > 0 || periodo.totalInscricoes > 0}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center">Nenhum período de inscrição encontrado.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {isModalOpen && (
        <PeriodoInscricaoFormModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          periodo={editingPeriodo}
        />
      )}
      
      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o período de inscrição {periodoToDelete?.ano}.{periodoToDelete?.semestre === 'SEMESTRE_1' ? '1' : '2'}? 
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsAlertOpen(false)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 