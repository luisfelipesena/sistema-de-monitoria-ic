import { createFileRoute } from '@tanstack/react-router';
import { PlusCircle, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useProjetoTemplates, useDeleteProjetoTemplate } from '@/hooks/use-projeto-template';
import { useState } from 'react';
import type { ProjetoTemplateWithRelations } from '@/routes/api/admin/projeto-template/-types';
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
import ProjetoTemplateFormModal from '@/components/features/admin/ProjetoTemplateFormModal';

export const Route = createFileRoute('/home/_layout/admin/_layout/projeto-templates')({
  component: ProjetoTemplatesPage,
});

function ProjetoTemplatesPage() {
  const { data: templates, isLoading, error } = useProjetoTemplates();
  const deleteMutation = useDeleteProjetoTemplate();
  const { toast } = useToast();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ProjetoTemplateWithRelations | null>(null);
  
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<ProjetoTemplateWithRelations | null>(null);

  const handleCreateNew = () => {
    setEditingTemplate(null);
    setIsModalOpen(true);
  };

  const handleEdit = (template: ProjetoTemplateWithRelations) => {
    setEditingTemplate(template);
    setIsModalOpen(true);
  };

  const handleDeletePrompt = (template: ProjetoTemplateWithRelations) => {
    setTemplateToDelete(template);
    setIsAlertOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!templateToDelete) return;
    try {
      await deleteMutation.mutateAsync(templateToDelete.id);
      toast({ title: 'Sucesso', description: 'Template de projeto excluído.' });
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message || 'Não foi possível excluir o template.', variant: 'destructive' });
    } finally {
      setIsAlertOpen(false);
      setTemplateToDelete(null);
    }
  };
  
  const formatDate = (dateString: string | Date | null | undefined) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
  }

  if (isLoading) return <div>Carregando templates de projeto...</div>;
  if (error) return <div>Erro ao carregar dados: {error.message}</div>;

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Templates de Projeto</h1>
          <p className="text-muted-foreground">
            Gerencie templates para pré-preenchimento de projetos de monitoria.
          </p>
        </div>
        <Button onClick={handleCreateNew}>
          <PlusCircle className="mr-2 h-4 w-4" /> Criar Novo Template
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Templates</CardTitle>
          <CardDescription>Visualize e gerencie todos os templates de projeto cadastrados.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Disciplina (Default)</TableHead>
                <TableHead>Título Default</TableHead>
                <TableHead>C.H. Semanal</TableHead>
                <TableHead>Nº Semanas</TableHead>
                <TableHead>Atualizado em</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {templates && templates.length > 0 ? templates.map((template) => (
                <TableRow key={template.id}>
                  <TableCell>{template.disciplina?.nome || 'N/A'} ({template.disciplina?.codigo || '-'})</TableCell>
                  <TableCell>{template.tituloDefault || '-'}</TableCell>
                  <TableCell className="text-center">{template.cargaHorariaSemanaDefault || '-'}</TableCell>
                  <TableCell className="text-center">{template.numeroSemanasDefault || '-'}</TableCell>
                  <TableCell>{formatDate(template.updatedAt)}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(template)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDeletePrompt(template)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center">Nenhum template de projeto encontrado.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {isModalOpen && (
        <ProjetoTemplateFormModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          template={editingTemplate}
        />
      )}
      
      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o template para a disciplina {templateToDelete?.disciplina?.nome || 'desconhecida'}? 
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