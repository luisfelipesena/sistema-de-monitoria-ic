import { PagesLayout } from '@/components/layout/PagesLayout';
import { TableComponent } from '@/components/layout/TableComponent';
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
import { useDepartamentoList } from '@/hooks/use-departamento';
import {
  useCreateDisciplina,
  useDeleteDisciplina,
  useDisciplinas,
  useUpdateDisciplina,
} from '@/hooks/use-disciplina';
import { createFileRoute } from '@tanstack/react-router';
import { ColumnDef } from '@tanstack/react-table';
import { BookOpen, Loader, Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

export const Route = createFileRoute(
  '/home/_layout/admin/_layout/disciplinas',
)({
  component: DisciplinasPage,
});

interface DisciplinaFormData {
  nome: string;
  codigo: string;
  departamentoId: number;
}

function DisciplinasPage() {
  const { data: disciplinas, isLoading: loadingDisciplinas } = useDisciplinas();
  const { data: departamentos } = useDepartamentoList();
  const createDisciplinaMutation = useCreateDisciplina();
  const updateDisciplinaMutation = useUpdateDisciplina();
  const deleteDisciplinaMutation = useDeleteDisciplina();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingDisciplinaId, setEditingDisciplinaId] = useState<
    number | null
  >(null);
  const [formData, setFormData] = useState<Partial<DisciplinaFormData>>({});

  const handleSaveDisciplina = async () => {
    if (!formData.nome || !formData.codigo || !formData.departamentoId) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    try {
      if (isEditMode && editingDisciplinaId) {
        await updateDisciplinaMutation.mutateAsync({
          id: editingDisciplinaId,
          data: formData as DisciplinaFormData,
        });
        toast.success('Disciplina atualizada com sucesso!');
      } else {
        await createDisciplinaMutation.mutateAsync(
          formData as DisciplinaFormData,
        );
        toast.success('Disciplina criada com sucesso!');
      }

      setIsModalOpen(false);
      setFormData({});
      setIsEditMode(false);
      setEditingDisciplinaId(null);
    } catch (error) {
      toast.error(
        isEditMode
          ? 'Erro ao atualizar disciplina'
          : 'Erro ao criar disciplina',
      );
    }
  };

  const handleEditDisciplina = (disciplina: any) => {
    setIsEditMode(true);
    setEditingDisciplinaId(disciplina.id);
    setFormData({
      nome: disciplina.nome,
      codigo: disciplina.codigo,
      departamentoId: disciplina.departamentoId,
    });
    setIsModalOpen(true);
  };

  const handleDeleteDisciplina = async (disciplinaId: number) => {
    if (confirm('Tem certeza que deseja excluir esta disciplina?')) {
      try {
        await deleteDisciplinaMutation.mutateAsync(disciplinaId);
        toast.success('Disciplina excluída com sucesso!');
      } catch (error) {
        toast.error('Erro ao excluir disciplina');
      }
    }
  };

  const columns: ColumnDef<any>[] = [
    {
      header: () => (
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-gray-400" />
          Nome
        </div>
      ),
      accessorKey: 'nome',
      cell: ({ row }) => (
        <span className="font-semibold text-base text-gray-900">
          {row.original.nome}
        </span>
      ),
    },
    {
      header: 'Código',
      accessorKey: 'codigo',
    },
    {
      header: 'Departamento',
      accessorKey: 'departamento.nome',
    },
    {
      header: 'Ações',
      accessorKey: 'acoes',
      cell: ({ row }) => (
        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            className="rounded-full flex items-center gap-1"
            onClick={() => handleEditDisciplina(row.original)}
          >
            <Pencil className="h-4 w-4" />
            Editar
          </Button>
          <Button
            variant="destructive"
            size="sm"
            className="rounded-full flex items-center gap-1"
            onClick={() => handleDeleteDisciplina(row.original.id)}
          >
            <Trash2 className="h-4 w-4" />
            Excluir
          </Button>
        </div>
      ),
    },
  ];

  const actions = (
    <Button
      variant="primary"
      className="bg-[#1B2A50] text-white hover:bg-[#24376c] transition-colors"
      onClick={() => {
        setIsEditMode(false);
        setEditingDisciplinaId(null);
        setFormData({});
        setIsModalOpen(true);
      }}
    >
      <Plus className="w-4 h-4 mr-2" />
      Adicionar Disciplina
    </Button>
  );

  return (
    <PagesLayout title="Gerenciar Disciplinas" actions={actions}>
      {loadingDisciplinas ? (
        <div className="flex justify-center items-center py-8">
          <Loader className="h-8 w-8 animate-spin" />
          <span className="ml-2">Carregando disciplinas...</span>
        </div>
      ) : (
        <TableComponent columns={columns} data={disciplinas || []} />
      )}

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {isEditMode ? 'Editar Disciplina' : 'Adicionar Disciplina'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Nome da Disciplina *</Label>
              <Input
                value={formData.nome || ''}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, nome: e.target.value }))
                }
                placeholder="Ex: Algoritmos e Estruturas de Dados I"
              />
            </div>

            <div>
              <Label>Código da Disciplina *</Label>
              <Input
                value={formData.codigo || ''}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, codigo: e.target.value }))
                }
                placeholder="Ex: MATA40"
              />
            </div>

            <div>
              <Label>Departamento *</Label>
              <Select
                value={formData.departamentoId?.toString()}
                onValueChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    departamentoId: Number(value),
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um departamento" />
                </SelectTrigger>
                <SelectContent>
                  {departamentos?.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id.toString()}>
                      {dept.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveDisciplina}>
              {isEditMode ? 'Atualizar Disciplina' : 'Criar Disciplina'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PagesLayout>
  );
}
