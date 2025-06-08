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
  useCreateCurso,
  useDeleteCurso,
  useCursos,
  useUpdateCurso,
} from '@/hooks/use-curso';
import { createFileRoute } from '@tanstack/react-router';
import { ColumnDef } from '@tanstack/react-table';
import { GraduationCap, Loader, Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

export const Route = createFileRoute('/home/_layout/admin/_layout/cursos')({
  component: CursosPage,
});

interface CursoFormData {
  nome: string;
  codigo: number;
}

function CursosPage() {
  const { data: cursos, isLoading: loadingCursos } = useCursos();
  const createCursoMutation = useCreateCurso();
  const updateCursoMutation = useUpdateCurso();
  const deleteCursoMutation = useDeleteCurso();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingCursoId, setEditingCursoId] = useState<number | null>(null);
  const [formData, setFormData] = useState<Partial<CursoFormData>>({});

  const handleSaveCurso = async () => {
    if (!formData.nome || !formData.codigo) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    try {
      if (isEditMode && editingCursoId) {
        await updateCursoMutation.mutateAsync({
          id: editingCursoId,
          data: formData as CursoFormData,
        });
        toast.success('Curso atualizado com sucesso!');
      } else {
        await createCursoMutation.mutateAsync(formData as CursoFormData);
        toast.success('Curso criado com sucesso!');
      }

      setIsModalOpen(false);
      setFormData({});
      setIsEditMode(false);
      setEditingCursoId(null);
    } catch (error) {
      toast.error(
        isEditMode ? 'Erro ao atualizar curso' : 'Erro ao criar curso',
      );
    }
  };

  const handleEditCurso = (curso: any) => {
    setIsEditMode(true);
    setEditingCursoId(curso.id);
    setFormData({
      nome: curso.nome,
      codigo: curso.codigo,
    });
    setIsModalOpen(true);
  };

  const handleDeleteCurso = async (cursoId: number) => {
    if (confirm('Tem certeza que deseja excluir este curso?')) {
      try {
        await deleteCursoMutation.mutateAsync(cursoId);
        toast.success('Curso excluído com sucesso!');
      } catch (error) {
        toast.error('Erro ao excluir curso');
      }
    }
  };

  const columns: ColumnDef<any>[] = [
    {
      header: () => (
        <div className="flex items-center gap-2">
          <GraduationCap className="h-5 w-5 text-gray-400" />
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
      header: 'Ações',
      accessorKey: 'acoes',
      cell: ({ row }) => (
        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            className="rounded-full flex items-center gap-1"
            onClick={() => handleEditCurso(row.original)}
          >
            <Pencil className="h-4 w-4" />
            Editar
          </Button>
          <Button
            variant="destructive"
            size="sm"
            className="rounded-full flex items-center gap-1"
            onClick={() => handleDeleteCurso(row.original.id)}
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
        setEditingCursoId(null);
        setFormData({});
        setIsModalOpen(true);
      }}
    >
      <Plus className="w-4 h-4 mr-2" />
      Adicionar Curso
    </Button>
  );

  return (
    <PagesLayout title="Gerenciar Cursos" actions={actions}>
      {loadingCursos ? (
        <div className="flex justify-center items-center py-8">
          <Loader className="h-8 w-8 animate-spin" />
          <span className="ml-2">Carregando cursos...</span>
        </div>
      ) : (
        <TableComponent columns={columns} data={cursos || []} />
      )}

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {isEditMode ? 'Editar Curso' : 'Adicionar Curso'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Nome do Curso *</Label>
              <Input
                value={formData.nome || ''}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, nome: e.target.value }))
                }
                placeholder="Ex: Ciência da Computação"
              />
            </div>

            <div>
              <Label>Código do Curso *</Label>
              <Input
                type="number"
                value={formData.codigo || ''}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    codigo: Number(e.target.value),
                  }))
                }
                placeholder="Ex: 112140"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveCurso}>
              {isEditMode ? 'Atualizar Curso' : 'Criar Curso'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PagesLayout>
  );
}
