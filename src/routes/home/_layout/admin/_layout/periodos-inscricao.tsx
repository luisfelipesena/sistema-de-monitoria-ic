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
import { createFileRoute } from '@tanstack/react-router';
import { ColumnDef } from '@tanstack/react-table';
import { Calendar, Loader, Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

export const Route = createFileRoute(
  '/home/_layout/admin/_layout/periodos-inscricao',
)({
  component: PeriodosInscricaoPage,
});

function PeriodosInscricaoPage() {
  const { data: periodos, isLoading: loadingPeriodos } = usePeriodosInscricao();
  const createPeriodoMutation = useCreatePeriodoInscricao();
  const updatePeriodoMutation = useUpdatePeriodoInscricao();
  const deletePeriodoMutation = useDeletePeriodoInscricao();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingPeriodoId, setEditingPeriodoId] = useState<number | null>(null);
  const [formData, setFormData] = useState<Partial<PeriodoInscricaoInput>>({});

  const handleCreatePeriodo = async () => {
    if (
      !formData.semestre ||
      !formData.ano ||
      !formData.dataInicio ||
      !formData.dataFim
    ) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    try {
      if (isEditMode && editingPeriodoId) {
        await updatePeriodoMutation.mutateAsync({
          id: editingPeriodoId,
          data: formData as PeriodoInscricaoInput,
        });
        toast.success('Período atualizado com sucesso!');
      } else {
        await createPeriodoMutation.mutateAsync(
          formData as PeriodoInscricaoInput,
        );
        toast.success('Período criado com sucesso!');
      }

      setIsModalOpen(false);
      setFormData({});
      setIsEditMode(false);
      setEditingPeriodoId(null);
    } catch (error) {
      toast.error(
        isEditMode ? 'Erro ao atualizar período' : 'Erro ao criar período',
      );
    }
  };

  const handleEditPeriodo = (periodo: any) => {
    setIsEditMode(true);
    setEditingPeriodoId(periodo.id);
    setFormData({
      semestre: periodo.semestre,
      ano: periodo.ano,
      dataInicio: periodo.dataInicio,
      dataFim: periodo.dataFim,
    });
    setIsModalOpen(true);
  };

  const handleDeletePeriodo = async (periodoId: number) => {
    if (confirm('Tem certeza que deseja excluir este período de inscrição?')) {
      try {
        await deletePeriodoMutation.mutateAsync(periodoId);
        toast.success('Período excluído com sucesso!');
      } catch (error) {
        toast.error('Erro ao excluir período');
      }
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ATIVO':
        return <Badge className="bg-green-100 text-green-800">Ativo</Badge>;
      case 'FUTURO':
        return <Badge className="bg-blue-100 text-blue-800">Futuro</Badge>;
      case 'FINALIZADO':
        return <Badge className="bg-gray-100 text-gray-800">Finalizado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const columns: ColumnDef<any>[] = [
    {
      header: () => (
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-gray-400" />
          Período
        </div>
      ),
      accessorKey: 'semestre',
      cell: ({ row }) => (
        <span className="font-semibold text-base">
          {row.original.ano}.
          {row.original.semestre === 'SEMESTRE_1' ? '1' : '2'}
        </span>
      ),
    },
    {
      header: 'Data de Início',
      accessorKey: 'dataInicio',
      cell: ({ row }) => (
        <span className="text-sm">
          {new Date(row.original.dataInicio).toLocaleDateString('pt-BR')}
        </span>
      ),
    },
    {
      header: 'Data de Fim',
      accessorKey: 'dataFim',
      cell: ({ row }) => (
        <span className="text-sm">
          {new Date(row.original.dataFim).toLocaleDateString('pt-BR')}
        </span>
      ),
    },
    {
      header: 'Status',
      accessorKey: 'status',
      cell: ({ row }) => getStatusBadge(row.original.status),
    },
    {
      header: 'Projetos',
      accessorKey: 'totalProjetos',
      cell: ({ row }) => (
        <span className="font-medium">{row.original.totalProjetos}</span>
      ),
    },
    {
      header: 'Inscrições',
      accessorKey: 'totalInscricoes',
      cell: ({ row }) => (
        <span className="font-medium">{row.original.totalInscricoes}</span>
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
            onClick={() => handleEditPeriodo(row.original)}
            disabled={row.original.totalInscricoes > 0}
          >
            <Pencil className="h-4 w-4" />
            Editar
          </Button>
          <Button
            variant="destructive"
            size="sm"
            className="rounded-full flex items-center gap-1"
            onClick={() => handleDeletePeriodo(row.original.id)}
            disabled={row.original.totalInscricoes > 0}
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
        setEditingPeriodoId(null);
        setFormData({});
        setIsModalOpen(true);
      }}
    >
      <Plus className="w-4 h-4 mr-2" />
      Novo Período
    </Button>
  );

  return (
    <PagesLayout title="Períodos de Inscrição" actions={actions}>
      {loadingPeriodos ? (
        <div className="flex justify-center items-center py-8">
          <Loader className="h-8 w-8 animate-spin" />
          <span className="ml-2">Carregando períodos...</span>
        </div>
      ) : (
        <TableComponent columns={columns} data={periodos || []} />
      )}

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {isEditMode ? 'Editar Período' : 'Novo Período de Inscrição'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Ano *</Label>
                <Input
                  type="number"
                  value={formData.ano || ''}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      ano: parseInt(e.target.value),
                    }))
                  }
                  placeholder="Ex: 2025"
                />
              </div>

              <div>
                <Label>Semestre *</Label>
                <Select
                  value={formData.semestre || ''}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, semestre: value as any }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SEMESTRE_1">2025.1</SelectItem>
                    <SelectItem value="SEMESTRE_2">2025.2</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Data de Início *</Label>
                <Input
                  type="date"
                  value={
                    formData.dataInicio
                      ? new Date(formData.dataInicio)
                          .toISOString()
                          .split('T')[0]
                      : ''
                  }
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      dataInicio: new Date(e.target.value),
                    }))
                  }
                />
              </div>

              <div>
                <Label>Data de Fim *</Label>
                <Input
                  type="date"
                  value={
                    formData.dataFim
                      ? new Date(formData.dataFim).toISOString().split('T')[0]
                      : ''
                  }
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      dataFim: new Date(e.target.value),
                    }))
                  }
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreatePeriodo}>
              {isEditMode ? 'Atualizar' : 'Criar Período'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PagesLayout>
  );
}
