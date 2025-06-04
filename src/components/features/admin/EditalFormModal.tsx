import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { EditalListItem, EditalInput } from '@/routes/api/edital/-types';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { editalInputSchema } from '@/routes/api/edital/-types'; // Reutilizar schema se aplicável
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { usePeriodosInscricao } from '@/hooks/use-periodo-inscricao';
import { useCreateEdital, useUpdateEdital } from '@/hooks/use-edital';
import { useToast } from '@/hooks/use-toast';

interface EditalFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  edital: EditalListItem | null; // null para criação, EditalListItem para edição
}

const EditalFormModal: React.FC<EditalFormModalProps> = ({ isOpen, onClose, edital }) => {
  const isEditMode = !!edital;
  const { data: periodosInscricao, isLoading: loadingPeriodos } = usePeriodosInscricao();
  const createEditalMutation = useCreateEdital();
  const updateEditalMutation = useUpdateEdital();
  const { toast } = useToast();

  const form = useForm<EditalInput>({
    resolver: zodResolver(editalInputSchema),
    defaultValues: isEditMode && edital ? {
      periodoInscricaoId: edital.periodoInscricaoId,
      numeroEdital: edital.numeroEdital,
      titulo: edital.titulo,
      descricaoHtml: edital.descricaoHtml || '',
    } : {
      periodoInscricaoId: undefined,
      numeroEdital: '',
      titulo: '',
      descricaoHtml: '',
    },
  });

  React.useEffect(() => {
    if (edital && isEditMode) {
      form.reset({
        periodoInscricaoId: edital.periodoInscricaoId,
        numeroEdital: edital.numeroEdital,
        titulo: edital.titulo,
        descricaoHtml: edital.descricaoHtml || '',
      });
    } else {
      form.reset({
        periodoInscricaoId: undefined,
        numeroEdital: '',
        titulo: '',
        descricaoHtml: '',
      });
    }
  }, [edital, isEditMode, form]);

  const onSubmit = async (data: EditalInput) => {
    try {
      if (isEditMode && edital) {
        await updateEditalMutation.mutateAsync({ editalId: edital.id, data });
        toast({ title: 'Edital atualizado com sucesso!' });
      } else {
        await createEditalMutation.mutateAsync(data);
        toast({ title: 'Edital criado com sucesso!' });
      }
      onClose();
    } catch (error: any) {
      toast({ title: isEditMode ? 'Erro ao atualizar edital' : 'Erro ao criar edital', description: error.message, variant: 'destructive' });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Editar Edital' : 'Criar Novo Edital'}</DialogTitle>
          <DialogDescription>
            {isEditMode ? 'Modifique as informações do edital.' : 'Preencha os dados para criar um novo edital de monitoria.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div>
            <Label htmlFor="periodoInscricaoId">Período de Inscrição *</Label>
            <Select 
              onValueChange={(value) => form.setValue('periodoInscricaoId', parseInt(value))}
              defaultValue={form.getValues('periodoInscricaoId')?.toString()}
              disabled={loadingPeriodos || (isEditMode && !!edital?.publicado)} // Não pode mudar período de edital publicado
            >
              <SelectTrigger id="periodoInscricaoId">
                <SelectValue placeholder={loadingPeriodos ? "Carregando períodos..." : "Selecione um período"} />
              </SelectTrigger>
              <SelectContent>
                {periodosInscricao?.filter(p => p.status === 'FUTURO' || (isEditMode && p.id === edital?.periodoInscricaoId )).map((periodo) => (
                  <SelectItem key={periodo.id} value={periodo.id.toString()}>
                    {`${periodo.ano}.${periodo.semestre === 'SEMESTRE_1' ? '1' : '2'} (Início: ${new Date(periodo.dataInicio).toLocaleDateString('pt-BR')})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.periodoInscricaoId && <p className="text-sm text-red-500 mt-1">{form.formState.errors.periodoInscricaoId.message}</p>}
          </div>

          <div>
            <Label htmlFor="numeroEdital">Número do Edital *</Label>
            <Input 
              id="numeroEdital" 
              {...form.register('numeroEdital')} 
              placeholder="Ex: 001/2025-DCC"
              disabled={isEditMode && !!edital?.publicado} // Não pode mudar número de edital publicado
            />
            {form.formState.errors.numeroEdital && <p className="text-sm text-red-500 mt-1">{form.formState.errors.numeroEdital.message}</p>}
          </div>

          <div>
            <Label htmlFor="titulo">Título do Edital *</Label>
            <Input id="titulo" {...form.register('titulo')} placeholder="Edital Interno de Seleção de Monitores"/>
            {form.formState.errors.titulo && <p className="text-sm text-red-500 mt-1">{form.formState.errors.titulo.message}</p>}
          </div>

          <div>
            <Label htmlFor="descricaoHtml">Descrição / Corpo do Edital (HTML ou Markdown)</Label>
            <Textarea 
              id="descricaoHtml" 
              {...form.register('descricaoHtml')} 
              placeholder="Insira o conteúdo completo do edital, incluindo regras, prazos, critérios, etc."
              rows={10}
            />
             {form.formState.errors.descricaoHtml && <p className="text-sm text-red-500 mt-1">{form.formState.errors.descricaoHtml.message}</p>}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={createEditalMutation.isPending || updateEditalMutation.isPending}>
              {createEditalMutation.isPending || updateEditalMutation.isPending ? 'Salvando...' : (isEditMode ? 'Salvar Alterações' : 'Criar Edital')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditalFormModal; 