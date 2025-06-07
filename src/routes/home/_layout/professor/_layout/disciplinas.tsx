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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  useAddProfessorDisciplina,
  useCreateDisciplina,
  useDisciplinas,
  useProfessorDisciplinas,
  useRemoveProfessorDisciplina,
} from '@/hooks/use-disciplina';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Info, PlusCircle, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { createFileRoute } from '@tanstack/react-router';
import { ProfessorDisciplina } from '@/routes/api/disciplina/-types';

export const Route = createFileRoute(
  '/home/_layout/professor/_layout/disciplinas'
)({
  component: ProfessorDisciplinasPage,
});

function ProfessorDisciplinasPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedDisciplina, setSelectedDisciplina] = useState<string>('');
  const [newDisciplina, setNewDisciplina] = useState({ nome: '', codigo: '' });

  const {
    data: professorDisciplinas,
    isLoading,
    refetch,
  } = useProfessorDisciplinas();
  const { data: allDisciplinas } = useDisciplinas({
    departamentoId: user?.professor?.departamentoId,
  });

  const addMutation = useAddProfessorDisciplina();
  const removeMutation = useRemoveProfessorDisciplina();
  const createMutation = useCreateDisciplina();

  const handleAddDisciplina = () => {
    if (!selectedDisciplina) {
      toast({ title: 'Selecione uma disciplina', variant: 'destructive' });
      return;
    }
    addMutation.mutate(
      { disciplinaId: parseInt(selectedDisciplina) },
      {
        onSuccess: () => {
          toast({ title: 'Disciplina adicionada com sucesso' });
          setAddDialogOpen(false);
          setSelectedDisciplina('');
        },
        onError: (error: any) => {
          toast({
            title: 'Erro ao adicionar disciplina',
            description: error?.response?.data?.error,
            variant: 'destructive',
          });
        },
      }
    );
  };

  const handleRemoveDisciplina = (associationId: number) => {
    removeMutation.mutate(associationId, {
      onSuccess: () => {
        toast({ title: 'Disciplina removida com sucesso' });
      },
      onError: (error: any) => {
        toast({
          title: 'Erro ao remover disciplina',
          description: error?.response?.data?.error,
          variant: 'destructive',
        });
      },
    });
  };

  const handleCreateDisciplina = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.professor?.departamentoId) return;

    createMutation.mutate(
      { ...newDisciplina, departamentoId: user.professor.departamentoId },
      {
        onSuccess: (created) => {
          toast({ title: 'Disciplina criada com sucesso' });
          addMutation.mutate({ disciplinaId: created.id });
          setCreateDialogOpen(false);
          setNewDisciplina({ nome: '', codigo: '' });
        },
        onError: (error: any) => {
          toast({
            title: 'Erro ao criar disciplina',
            description: error?.response?.data?.error,
            variant: 'destructive',
          });
        },
      }
    );
  };

  const availableDisciplinas = allDisciplinas?.filter(
    (d) => !professorDisciplinas?.some((pd) => pd.disciplinaId === d.id)
  );

  const actions = (
    <Button onClick={() => setAddDialogOpen(true)} className="flex gap-2">
      <PlusCircle size={16} />
      <span>Adicionar Disciplina</span>
    </Button>
  );

  return (
    <PagesLayout
      title="Minhas Disciplinas"
      subtitle="Gerencie as disciplinas que você leciona neste semestre"
      actions={actions}
    >
      {isLoading ? (
        <div className="flex justify-center py-10">Carregando...</div>
      ) : !professorDisciplinas?.length ? (
        <div className="text-center py-20 border rounded-md bg-muted/20">
          <Info className="mx-auto h-10 w-10 text-muted-foreground mb-2" />
          <h3 className="text-lg font-medium">Nenhuma disciplina vinculada</h3>
          <p className="text-muted-foreground mb-4">
            Adicione as disciplinas que você leciona neste semestre.
          </p>
          <Button onClick={() => setAddDialogOpen(true)}>
            <PlusCircle size={16} className="mr-2" />
            Adicionar Disciplina
          </Button>
        </div>
      ) : (
        <div className="border rounded-md overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Departamento</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {professorDisciplinas.map((pd: ProfessorDisciplina) => (
                <TableRow key={pd.id}>
                  <TableCell>{pd.disciplina.codigo}</TableCell>
                  <TableCell>{pd.disciplina.nome}</TableCell>
                  <TableCell>{pd.disciplina.departamento?.sigla}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleRemoveDisciplina(pd.id)}
                      disabled={removeMutation.isPending}
                    >
                      <Trash2 size={16} className="mr-1" />
                      Remover
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Add Disciplina Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Disciplina</DialogTitle>
            <DialogDescription>
              Selecione uma disciplina do seu departamento para vincular ao seu
              perfil neste semestre.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Select
              onValueChange={setSelectedDisciplina}
              value={selectedDisciplina}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma disciplina" />
              </SelectTrigger>
              <SelectContent>
                {availableDisciplinas?.map((d) => (
                  <SelectItem key={d.id} value={d.id.toString()}>
                    {d.codigo} - {d.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-center text-muted-foreground">
              Não encontrou a disciplina?{' '}
              <Button
                variant="ghost"
                className="p-0 h-auto"
                onClick={() => {
                  setAddDialogOpen(false);
                  setCreateDialogOpen(true);
                }}
              >
                Cadastre uma nova.
              </Button>
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleAddDisciplina}
              disabled={addMutation.isPending}
            >
              Adicionar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Disciplina Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cadastrar Nova Disciplina</DialogTitle>
            <DialogDescription>
              Preencha os dados da nova disciplina. Ela será associada ao seu
              departamento.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateDisciplina} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="codigo">Código da Disciplina</Label>
              <Input
                id="codigo"
                value={newDisciplina.codigo}
                onChange={(e) =>
                  setNewDisciplina({ ...newDisciplina, codigo: e.target.value })
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nome">Nome da Disciplina</Label>
              <Input
                id="nome"
                value={newDisciplina.nome}
                onChange={(e) =>
                  setNewDisciplina({ ...newDisciplina, nome: e.target.value })
                }
                required
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreateDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                Criar e Adicionar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </PagesLayout>
  );
} 