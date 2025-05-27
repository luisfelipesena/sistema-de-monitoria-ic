import { PagesLayout } from '@/components/layout/PagesLayout';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  useCreateCurso,
  useCursos,
  useDeleteCurso,
  useUpdateCurso,
} from '@/hooks/use-curso';
import { useToast } from '@/hooks/use-toast';
import { CursoInput, CursoResponse } from '@/routes/api/course/-types';
import { logger } from '@/utils/logger';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { Info, Pencil, PlusCircle, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { z } from 'zod';

const log = logger.child({
  context: 'admin-cursos',
});

export const Route = createFileRoute('/home/_layout/admin/_layout/cursos')({
  component: CursosPage,
});

const schema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  codigo: z.coerce.number().nullable(),
});

function CursosPage() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentCurso, setCurrentCurso] = useState<
    CursoInput & { id?: number }
  >({
    nome: '',
    codigo: null,
  });
  const [cursoToDelete, setCursoToDelete] = useState<CursoResponse | null>(
    null,
  );

  // Hooks de curso
  const { data: cursos, isLoading } = useCursos();
  const createCursoMutation = useCreateCurso();
  const updateCursoMutation = useUpdateCurso();
  const deleteCursoMutation = useDeleteCurso();

  const openDialog = (curso?: CursoResponse) => {
    if (curso) {
      setIsEditing(true);
      setCurrentCurso({
        id: curso.id,
        nome: curso.nome,
        codigo: curso.codigo,
      });
    } else {
      setIsEditing(false);
      setCurrentCurso({
        nome: '',
        codigo: null,
      });
    }
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setCurrentCurso({
      nome: '',
      codigo: null,
    });
  };

  const openDeleteDialog = (curso: CursoResponse) => {
    setCursoToDelete(curso);
    setDeleteDialogOpen(true);
  };

  const closeDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setCursoToDelete(null);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      // Validar dados
      const validatedData = schema.parse(currentCurso);

      if (isEditing && currentCurso.id) {
        updateCursoMutation.mutate(
          { id: currentCurso.id, data: validatedData },
          {
            onSuccess: () => {
              toast({
                title: 'Curso atualizado',
                description: 'O curso foi atualizado com sucesso',
              });
              closeDialog();
            },
            onError: (error: any) => {
              toast({
                title: 'Erro',
                description:
                  error?.response?.data?.error || 'Erro ao atualizar o curso',
                variant: 'destructive',
              });
            },
          },
        );
      } else {
        createCursoMutation.mutate(validatedData, {
          onSuccess: () => {
            toast({
              title: 'Curso criado',
              description: 'O curso foi criado com sucesso',
            });
            closeDialog();
          },
          onError: (error: any) => {
            toast({
              title: 'Erro',
              description:
                error?.response?.data?.error || 'Erro ao criar o curso',
              variant: 'destructive',
            });
          },
        });
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        // Mostrar erros de validação
        const errors = error.errors
          .map((err) => `${err.path}: ${err.message}`)
          .join(', ');
        toast({
          title: 'Erro de validação',
          description: errors,
          variant: 'destructive',
        });
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCurrentCurso((prev) => ({
      ...prev,
      [name]: name === 'codigo' ? (value ? parseInt(value) : null) : value,
    }));
  };

  const handleDelete = () => {
    if (cursoToDelete) {
      deleteCursoMutation.mutate(cursoToDelete.id, {
        onSuccess: () => {
          toast({
            title: 'Curso removido',
            description: 'O curso foi removido com sucesso',
          });
          closeDeleteDialog();
        },
        onError: (error: any) => {
          toast({
            title: 'Erro',
            description:
              error?.response?.data?.error || 'Erro ao remover o curso',
            variant: 'destructive',
          });
        },
      });
    }
  };

  // Actions to pass to PagesLayout
  const actions = (
    <div className="flex gap-2">
      <Button onClick={() => openDialog()} className="flex items-center gap-2">
        <PlusCircle size={16} />
        <span>Adicionar Curso</span>
      </Button>
    </div>
  );

  return (
    <PagesLayout
      title="Gerenciar Cursos"
      subtitle="Crie e gerencie os cursos disponíveis no sistema"
      actions={actions}
    >
      {isLoading ? (
        <div className="flex justify-center py-10">Carregando cursos...</div>
      ) : !cursos?.length ? (
        <div className="text-center py-20 border rounded-md bg-muted/20">
          <Info className="mx-auto h-10 w-10 text-muted-foreground mb-2" />
          <h3 className="text-lg font-medium">Nenhum curso cadastrado</h3>
          <p className="text-muted-foreground mb-4">
            Adicione cursos para que os alunos possam selecioná-los durante o
            cadastro.
          </p>
          <Button onClick={() => openDialog()}>
            <PlusCircle size={16} className="mr-2" />
            Adicionar Curso
          </Button>
        </div>
      ) : (
        <div className="border rounded-md overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-[50px]">ID</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Código</TableHead>
                <TableHead>Data de Criação</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cursos.map((curso) => (
                <TableRow key={curso.id} className="hover:bg-muted/10">
                  <TableCell className="font-mono text-sm">
                    {curso.id}
                  </TableCell>
                  <TableCell className="font-medium">{curso.nome}</TableCell>
                  <TableCell>{curso.codigo || '-'}</TableCell>
                  <TableCell>
                    {curso.createdAt &&
                      new Date(curso.createdAt).toLocaleDateString('pt-BR')}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => openDialog(curso)}
                        disabled={updateCursoMutation.isPending}
                      >
                        <Pencil size={16} className="mr-1" />
                        Editar
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => openDeleteDialog(curso)}
                        disabled={deleteCursoMutation.isPending}
                      >
                        <Trash2 size={16} className="mr-1" />
                        Remover
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Modal de criação/edição */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {isEditing ? 'Editar Curso' : 'Adicionar Curso'}
            </DialogTitle>
            <DialogDescription>
              {isEditing
                ? 'Altere as informações do curso selecionado'
                : 'Preencha os dados para adicionar um novo curso'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nome" className="text-sm font-semibold">
                  Nome do Curso <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="nome"
                  name="nome"
                  value={currentCurso.nome}
                  onChange={handleInputChange}
                  placeholder="Ex: Ciência da Computação"
                  className="w-full"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Nome completo do curso como aparecerá para os alunos
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="codigo" className="text-sm font-semibold">
                  Código do Curso
                </Label>
                <Input
                  id="codigo"
                  name="codigo"
                  type="number"
                  value={
                    currentCurso.codigo === null ? '' : currentCurso.codigo
                  }
                  onChange={handleInputChange}
                  placeholder="Ex: 112"
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">
                  Código numérico do curso (opcional)
                </p>
              </div>
            </div>

            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={closeDialog}
                disabled={
                  createCursoMutation.isPending || updateCursoMutation.isPending
                }
                className="mr-2"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={
                  createCursoMutation.isPending || updateCursoMutation.isPending
                }
              >
                {createCursoMutation.isPending || updateCursoMutation.isPending
                  ? 'Salvando...'
                  : isEditing
                    ? 'Salvar Alterações'
                    : 'Criar Curso'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal de confirmação de exclusão */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-500">
              <Trash2 size={18} />
              Remover Curso
            </DialogTitle>
            <DialogDescription>
              Tem certeza que deseja remover o curso{' '}
              <strong>{cursoToDelete?.nome}</strong>? Esta ação não pode ser
              desfeita.
            </DialogDescription>
          </DialogHeader>

          <p className="text-sm text-muted-foreground">
            Ao remover um curso, você impede que novos alunos o selecionem
            durante o cadastro. Esta ação não afetará os alunos que já estão
            vinculados a este curso.
          </p>

          <DialogFooter className="pt-4">
            <Button
              variant="outline"
              onClick={closeDeleteDialog}
              disabled={deleteCursoMutation.isPending}
              className="mr-2"
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteCursoMutation.isPending}
            >
              {deleteCursoMutation.isPending
                ? 'Removendo...'
                : 'Confirmar Exclusão'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PagesLayout>
  );
}
