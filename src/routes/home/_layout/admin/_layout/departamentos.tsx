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
  useCreateDepartamento,
  useDeleteDepartamento,
  useDepartamentoList,
  useUpdateDepartamento,
} from '@/hooks/use-departamento';
import { createFileRoute } from '@tanstack/react-router';
import { ColumnDef } from '@tanstack/react-table';
import { Building, Loader, Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

export const Route = createFileRoute(
  '/home/_layout/admin/_layout/departamentos',
)({
  component: DepartamentosPage,
});

interface DepartamentoFormData {
  nome: string;
  sigla?: string;
  unidadeUniversitaria?: string;
}

function DepartamentosPage() {
  const { data: departamentos, isLoading: loadingDepartamentos } =
    useDepartamentoList();
  const createDepartamentoMutation = useCreateDepartamento();
  const updateDepartamentoMutation = useUpdateDepartamento();
  const deleteDepartamentoMutation = useDeleteDepartamento();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingDepartamentoId, setEditingDepartamentoId] = useState<
    number | null
  >(null);
  const [formData, setFormData] = useState<Partial<DepartamentoFormData>>({});

  const handleCreateDepartamento = async () => {
    if (!formData.nome) {
      toast.error('Preencha o campo nome obrigatório');
      return;
    }

    try {
      if (isEditMode && editingDepartamentoId) {
        await updateDepartamentoMutation.mutateAsync({
          id: editingDepartamentoId,
          data: formData as DepartamentoFormData,
        });
        toast.success('Departamento atualizado com sucesso!');
      } else {
        await createDepartamentoMutation.mutateAsync(
          formData as DepartamentoFormData,
        );
        toast.success('Departamento criado com sucesso!');
      }

      setIsModalOpen(false);
      setFormData({});
      setIsEditMode(false);
      setEditingDepartamentoId(null);
    } catch (error) {
      toast.error(
        isEditMode
          ? 'Erro ao atualizar departamento'
          : 'Erro ao criar departamento',
      );
    }
  };

  const handleEditDepartamento = (departamento: any) => {
    setIsEditMode(true);
    setEditingDepartamentoId(departamento.id);
    setFormData({
      nome: departamento.nome,
      sigla: departamento.sigla,
      unidadeUniversitaria: departamento.unidadeUniversitaria,
    });
    setIsModalOpen(true);
  };

  const handleDeleteDepartamento = async (departamentoId: number) => {
    if (confirm('Tem certeza que deseja excluir este departamento?')) {
      try {
        await deleteDepartamentoMutation.mutateAsync(departamentoId);
        toast.success('Departamento excluído com sucesso!');
      } catch (error) {
        toast.error('Erro ao excluir departamento');
      }
    }
  };

  const columns: ColumnDef<any>[] = [
    {
      header: () => (
        <div className="flex items-center gap-2">
          <Building className="h-5 w-5 text-gray-400" />
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
      header: 'Sigla',
      accessorKey: 'sigla',
      cell: ({ row }) => (
        <Badge variant="outline">{row.original.sigla || 'N/A'}</Badge>
      ),
    },
    {
      header: 'Unidade Universitária',
      accessorKey: 'unidadeUniversitaria',
      cell: ({ row }) => (
        <span className="text-sm">
          {row.original.unidadeUniversitaria || 'N/A'}
        </span>
      ),
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
            onClick={() => handleEditDepartamento(row.original)}
          >
            <Pencil className="h-4 w-4" />
            Editar
          </Button>
          <Button
            variant="destructive"
            size="sm"
            className="rounded-full flex items-center gap-1"
            onClick={() => handleDeleteDepartamento(row.original.id)}
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
        setEditingDepartamentoId(null);
        setFormData({});
        setIsModalOpen(true);
      }}
    >
      <Plus className="w-4 h-4 mr-2" />
      Adicionar Departamento
    </Button>
  );

  return (
    <PagesLayout title="Gerenciar Departamentos" actions={actions}>
      {loadingDepartamentos ? (
        <div className="flex justify-center items-center py-8">
          <Loader className="h-8 w-8 animate-spin" />
          <span className="ml-2">Carregando departamentos...</span>
        </div>
      ) : (
        <TableComponent columns={columns} data={departamentos || []} />
      )}

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {isEditMode ? 'Editar Departamento' : 'Adicionar Departamento'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Nome do Departamento *</Label>
              <Input
                value={formData.nome || ''}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, nome: e.target.value }))
                }
                placeholder="Ex: Departamento de Ciência da Computação"
              />
            </div>

            <div>
              <Label>Sigla</Label>
              <Input
                value={formData.sigla || ''}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, sigla: e.target.value }))
                }
                placeholder="Ex: DCC"
              />
            </div>

            <div>
              <Label>Unidade Universitária</Label>
              <Input
                value={formData.unidadeUniversitaria || ''}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    unidadeUniversitaria: e.target.value,
                  }))
                }
                placeholder="Ex: Instituto de Computação"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateDepartamento}>
              {isEditMode ? 'Atualizar Departamento' : 'Criar Departamento'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PagesLayout>
  );
}
