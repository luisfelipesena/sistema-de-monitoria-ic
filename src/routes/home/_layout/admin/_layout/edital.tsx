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
import { FileText, Loader, Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

export const Route = createFileRoute('/home/_layout/admin/_layout/edital')({
  component: NovoEditalPage,
});

function NovoEditalPage() {
  const { data: periodos, isLoading: loadingPeriodos } = usePeriodosInscricao();
  const createPeriodoMutation = useCreatePeriodoInscricao();
  const updatePeriodoMutation = useUpdatePeriodoInscricao();
  const deletePeriodoMutation = useDeletePeriodoInscricao();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingPeriodoId, setEditingPeriodoId] = useState<number | null>(null);
  const [formData, setFormData] = useState<Partial<PeriodoInscricaoInput>>({});

  const handleCreateEdital = async () => {
    if (
      !formData.semestre ||
      !formData.ano ||
      !formData.dataInicio ||
      !formData.dataFim
    ) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    // Validar datas
    if (formData.dataFim <= formData.dataInicio) {
      toast.error('Data de fim deve ser posterior à data de início');
      return;
    }

    try {
      const periodoData: PeriodoInscricaoInput = {
        semestre: formData.semestre,
        ano: formData.ano,
        dataInicio: formData.dataInicio,
        dataFim: formData.dataFim,
      };

      if (isEditMode && editingPeriodoId) {
        await updatePeriodoMutation.mutateAsync({
          id: editingPeriodoId,
          data: periodoData,
        });
        toast.success('Edital atualizado com sucesso!');
      } else {
        await createPeriodoMutation.mutateAsync(periodoData);
        toast.success('Edital criado com sucesso!');
      }

      setIsModalOpen(false);
      setFormData({});
      setIsEditMode(false);
      setEditingPeriodoId(null);
    } catch (error) {
      console.error('Erro ao criar/atualizar edital:', error);
      toast.error(
        isEditMode ? 'Erro ao atualizar edital' : 'Erro ao criar edital',
      );
    }
  };

  const handleEditEdital = (periodo: any) => {
    setIsEditMode(true);
    setEditingPeriodoId(periodo.id);
    setFormData({
      semestre: periodo.semestre,
      ano: periodo.ano,
      dataInicio: new Date(periodo.dataInicio),
      dataFim: new Date(periodo.dataFim),
    });
    setIsModalOpen(true);
  };

  const handleDeleteEdital = async (periodoId: number) => {
    if (confirm('Tem certeza que deseja excluir este edital?')) {
      try {
        await deletePeriodoMutation.mutateAsync(periodoId);
        toast.success('Edital excluído com sucesso!');
      } catch (error) {
        toast.error('Erro ao excluir edital');
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

  const getSemestreLabel = (semestre: string) => {
    return semestre === 'SEMESTRE_1' ? '1º Semestre' : '2º Semestre';
  };

  const columns: ColumnDef<any>[] = [
    {
      header: () => (
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-gray-400" />
          Edital
        </div>
      ),
      accessorKey: 'titulo',
      cell: ({ row }) => (
        <div>
          <span className="font-semibold text-base">
            Edital {row.original.ano}.
            {row.original.semestre === 'SEMESTRE_1' ? '1' : '2'}
          </span>
          <p className="text-sm text-gray-600">
            Monitoria {row.original.ano} -{' '}
            {getSemestreLabel(row.original.semestre)}
          </p>
        </div>
      ),
    },
    {
      header: 'Período de Inscrição',
      accessorKey: 'dataInicio',
      cell: ({ row }) => (
        <div className="text-sm">
          <div>
            {new Date(row.original.dataInicio).toLocaleDateString('pt-BR')}
          </div>
          <div className="text-gray-500">
            até {new Date(row.original.dataFim).toLocaleDateString('pt-BR')}
          </div>
        </div>
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
            onClick={() => handleEditEdital(row.original)}
            disabled={row.original.totalInscricoes > 0}
          >
            <Pencil className="h-4 w-4" />
            Editar
          </Button>
          <Button
            variant="destructive"
            size="sm"
            className="rounded-full flex items-center gap-1"
            onClick={() => handleDeleteEdital(row.original.id)}
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
      Novo Edital
    </Button>
  );

  return (
    <PagesLayout title="Editais de Monitoria" actions={actions}>
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="font-semibold text-blue-900 mb-2">Sobre os Editais</h3>
        <p className="text-blue-800 text-sm">
          Os editais definem os períodos de inscrição para monitoria, incluindo
          datas, projetos disponíveis e documentação oficial. Cada edital
          representa um processo seletivo completo para um semestre específico.
        </p>
      </div>

      {loadingPeriodos ? (
        <div className="flex justify-center items-center py-8">
          <Loader className="h-8 w-8 animate-spin" />
          <span className="ml-2">Carregando editais...</span>
        </div>
      ) : (
        <TableComponent columns={columns} data={periodos || []} />
      )}

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {isEditMode ? 'Editar Edital' : 'Novo Edital de Monitoria'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900">
                Informações Básicas
              </h4>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Ano *</Label>
                  <Input
                    type="number"
                    value={formData.ano || ''}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        ano: parseInt(e.target.value) || undefined,
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
                      setFormData((prev) => ({
                        ...prev,
                        semestre: value as any,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SEMESTRE_1">1º Semestre</SelectItem>
                      <SelectItem value="SEMESTRE_2">2º Semestre</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900">
                Período de Inscrição
              </h4>

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
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleCreateEdital}
              disabled={
                createPeriodoMutation.isPending ||
                updatePeriodoMutation.isPending
              }
            >
              {createPeriodoMutation.isPending ||
              updatePeriodoMutation.isPending ? (
                <>
                  <Loader className="h-4 w-4 mr-2 animate-spin" />
                  {isEditMode ? 'Atualizando...' : 'Criando...'}
                </>
              ) : isEditMode ? (
                'Atualizar Edital'
              ) : (
                'Criar Edital'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PagesLayout>
  );
}
