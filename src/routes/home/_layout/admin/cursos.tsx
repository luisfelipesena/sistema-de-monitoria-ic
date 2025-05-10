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
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/utils/api-client';
import { logger } from '@/utils/logger';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { z } from 'zod';

const log = logger.child({
  context: 'admin-cursos',
});

interface Curso {
  id: number;
  nome: string;
  codigo: number | null;
  createdAt: string;
  updatedAt: string | null;
}

interface CursoInput {
  id?: number;
  nome: string;
  codigo: number | null;
}

export const Route = createFileRoute('/home/_layout/admin/cursos')({
  component: CursosPage,
});

const schema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  codigo: z.coerce.number().nullable(),
});

function CursosPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentCurso, setCurrentCurso] = useState<CursoInput>({
    nome: '',
    codigo: null,
  });
  const [cursoToDelete, setCursoToDelete] = useState<Curso | null>(null);

  // Fetch cursos
  const { data: cursos, isLoading } = useQuery({
    queryKey: ['cursos'],
    queryFn: async (): Promise<Curso[]> => {
      const response = await apiClient.get('/curso');
      return response.data;
    },
  });

  // Create/update curso
  const saveCursoMutation = useMutation({
    mutationFn: async (data: CursoInput) => {
      if (isEditing && currentCurso.id) {
        return apiClient.put(`/curso/${currentCurso.id}`, data);
      }
      return apiClient.post('/curso', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cursos'] });
      toast({
        title: isEditing ? 'Curso atualizado' : 'Curso criado',
        description: isEditing
          ? 'O curso foi atualizado com sucesso'
          : 'O curso foi criado com sucesso',
      });
      closeDialog();
    },
    onError: (error: any) => {
      log.error({ error }, 'Erro ao salvar curso');
      toast({
        title: 'Erro',
        description: error?.response?.data?.error || 'Erro ao salvar o curso',
        variant: 'destructive',
      });
    },
  });

  // Delete curso
  const deleteCursoMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiClient.delete(`/curso/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cursos'] });
      toast({
        title: 'Curso removido',
        description: 'O curso foi removido com sucesso',
      });
      closeDeleteDialog();
    },
    onError: (error: any) => {
      log.error({ error }, 'Erro ao remover curso');
      toast({
        title: 'Erro',
        description: error?.response?.data?.error || 'Erro ao remover o curso',
        variant: 'destructive',
      });
    },
  });

  // Create initial seed cursos
  const seedCursosMutation = useMutation({
    mutationFn: async () => {
      return apiClient.post('/curso');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cursos'] });
      toast({
        title: 'Cursos iniciais criados',
        description: 'Os cursos iniciais foram criados com sucesso',
      });
    },
    onError: (error: any) => {
      log.error({ error }, 'Erro ao criar cursos iniciais');
      toast({
        title: 'Erro',
        description:
          error?.response?.data?.error || 'Erro ao criar cursos iniciais',
        variant: 'destructive',
      });
    },
  });

  const openDialog = (curso?: Curso) => {
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

  const openDeleteDialog = (curso: Curso) => {
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
      saveCursoMutation.mutate(validatedData);
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
      deleteCursoMutation.mutate(cursoToDelete.id);
    }
  };

  const handleCreateInitialCursos = () => {
    seedCursosMutation.mutate();
  };

  return (
    <div className="container mx-auto py-10 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Gerenciar Cursos</h1>
        <div className="flex gap-2">
          <Button onClick={() => openDialog()}>Adicionar Curso</Button>
          <Button
            variant="secondary"
            onClick={handleCreateInitialCursos}
            disabled={seedCursosMutation.isPending}
          >
            {seedCursosMutation.isPending
              ? 'Criando cursos...'
              : 'Criar Cursos Iniciais'}
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-10">Carregando cursos...</div>
      ) : !cursos?.length ? (
        <div className="text-center py-10 border rounded-md">
          <p className="text-gray-500">Nenhum curso cadastrado</p>
          <Button variant="secondary" onClick={() => openDialog()}>
            Adicionar o primeiro curso
          </Button>
          <p className="text-gray-400 text-sm mt-2">
            Ou use o botão "Criar Cursos Iniciais" para adicionar cursos padrão
          </p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Código</TableHead>
              <TableHead>Data de Criação</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {cursos.map((curso) => (
              <TableRow key={curso.id}>
                <TableCell className="font-medium">{curso.nome}</TableCell>
                <TableCell>{curso.codigo || '-'}</TableCell>
                <TableCell>
                  {new Date(curso.createdAt).toLocaleDateString('pt-BR')}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => openDialog(curso)}
                    >
                      Editar
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => openDeleteDialog(curso)}
                    >
                      Remover
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Modal de criação/edição */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {isEditing ? 'Editar Curso' : 'Adicionar Curso'}
            </DialogTitle>
            <DialogDescription>
              Preencha os dados do curso abaixo.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="nome">Nome do Curso*</Label>
                <Input
                  id="nome"
                  name="nome"
                  value={currentCurso.nome}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="codigo">Código do Curso</Label>
                <Input
                  id="codigo"
                  name="codigo"
                  type="number"
                  value={
                    currentCurso.codigo === null ? '' : currentCurso.codigo
                  }
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="secondary"
                onClick={closeDialog}
                disabled={saveCursoMutation.isPending}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={saveCursoMutation.isPending}>
                {saveCursoMutation.isPending
                  ? 'Salvando...'
                  : isEditing
                    ? 'Salvar'
                    : 'Adicionar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal de confirmação de exclusão */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remover Curso</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja remover o curso{' '}
              <strong>{cursoToDelete?.nome}</strong>? Esta ação não pode ser
              desfeita.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button
              variant="secondary"
              onClick={closeDeleteDialog}
              disabled={deleteCursoMutation.isPending}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteCursoMutation.isPending}
            >
              {deleteCursoMutation.isPending ? 'Removendo...' : 'Remover'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
