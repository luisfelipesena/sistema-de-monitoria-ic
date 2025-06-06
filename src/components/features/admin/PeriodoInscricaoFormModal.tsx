import React, { useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  PeriodoInscricaoInput,
  periodoInscricaoInputSchema,
  PeriodoInscricaoComStatus,
} from '@/routes/api/periodo-inscricao/-types';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCreatePeriodoInscricao, useUpdatePeriodoInscricao } from '@/hooks/use-periodo-inscricao';
import { useToast } from '@/hooks/use-toast';
import DateTimeRangeSelector, { DateTimeRangeData } from '@/components/date-time-range-selector';
import { isBefore, startOfDay } from "date-fns";

interface PeriodoInscricaoFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  periodo: PeriodoInscricaoComStatus | PeriodoInscricaoInput | null; 
}

const PeriodoInscricaoFormModal: React.FC<PeriodoInscricaoFormModalProps> = ({ isOpen, onClose, periodo }) => {
  const isEditMode = !!(periodo && 'id' in periodo);
  const createMutation = useCreatePeriodoInscricao();
  const updateMutation = useUpdatePeriodoInscricao();
  const { toast } = useToast();

  const defaultValues = {
    ano: new Date().getFullYear(),
    semestre: (new Date().getMonth() < 6 ? 'SEMESTRE_1' : 'SEMESTRE_2') as 'SEMESTRE_1' | 'SEMESTRE_2',
    dataInicio: new Date(),
    dataFim: new Date(new Date().setDate(new Date().getDate() + 30)),
  };

  const form = useForm<PeriodoInscricaoInput>({
    resolver: zodResolver(periodoInscricaoInputSchema),
    defaultValues: isEditMode && periodo ? {
      ano: periodo.ano,
      semestre: periodo.semestre,
      dataInicio: new Date(periodo.dataInicio),
      dataFim: new Date(periodo.dataFim),
    } : defaultValues,
  });

  const watchedDataInicio = form.watch('dataInicio');
  const watchedDataFim = form.watch('dataFim');

  const handleDateRangeChange = (dateRange: DateTimeRangeData) => {
    if (dateRange.fromDate) {
      form.setValue('dataInicio', dateRange.fromDate, { shouldValidate: true });
    }
    
    if (dateRange.toDate) {
      if (dateRange.fromDate && isBefore(startOfDay(dateRange.toDate), startOfDay(dateRange.fromDate))) {
        toast({
          title: 'Data inválida',
          description: 'A data de fim não pode ser anterior à data de início.',
          variant: 'destructive'
        });
        return;
      }
      form.setValue('dataFim', dateRange.toDate, { shouldValidate: true });
    }
  };

  useEffect(() => {
    if (isOpen) {
      if (isEditMode && periodo) {
        form.reset({
          ano: periodo.ano,
          semestre: periodo.semestre,
          dataInicio: new Date(periodo.dataInicio),
          dataFim: new Date(periodo.dataFim),
        });
      } else {
        form.reset(defaultValues);
      }
    }
  }, [isOpen, isEditMode, periodo, form]);

  const onSubmit = async (data: PeriodoInscricaoInput) => {
    if (isBefore(startOfDay(data.dataFim), startOfDay(data.dataInicio))) {
      toast({
        title: 'Erro de validação',
        description: 'A data de fim deve ser posterior à data de início.',
        variant: 'destructive'
      });
      return;
    }

    const payload: PeriodoInscricaoInput = data;

    try {
      if (isEditMode && periodo && 'id' in periodo) {
        await updateMutation.mutateAsync({ id: periodo.id, data: payload });
        toast({ title: 'Sucesso', description: 'Período de inscrição atualizado.' });
      } else {
        await createMutation.mutateAsync(payload);
        toast({ title: 'Sucesso', description: 'Período de inscrição criado.' });
      }
      onClose();
    } catch (error: any) {
      toast({ 
        title: 'Erro', 
        description: error.message || (isEditMode ? 'Não foi possível atualizar o período.' : 'Não foi possível criar o período.'), 
        variant: 'destructive' 
      });
    }
  };

  const dateRangeValue: DateTimeRangeData = {
    fromDate: watchedDataInicio,
    toDate: watchedDataFim,
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Editar Período' : 'Criar Novo Período de Inscrição'}</DialogTitle>
          <DialogDescription>
            {isEditMode ? 'Modifique as informações do período.' : 'Preencha os dados para um novo período.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="ano">Ano *</Label>
              <Input id="ano" type="number" {...form.register('ano', { valueAsNumber: true })} />
              {form.formState.errors.ano && <p className="text-sm text-red-500 mt-1">{form.formState.errors.ano.message}</p>}
            </div>
            <div>
              <Label htmlFor="semestre">Semestre *</Label>
              <Select onValueChange={(value) => form.setValue('semestre', value as 'SEMESTRE_1' | 'SEMESTRE_2')} defaultValue={form.getValues('semestre')}>
                <SelectTrigger id="semestre">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SEMESTRE_1">1º Semestre</SelectItem>
                  <SelectItem value="SEMESTRE_2">2º Semestre</SelectItem>
                </SelectContent>
              </Select>
              {form.formState.errors.semestre && <p className="text-sm text-red-500 mt-1">{form.formState.errors.semestre.message}</p>}
            </div>
          </div>

          <div>
            <Label>Período de Inscrição *</Label>
            <DateTimeRangeSelector
              value={dateRangeValue}
              onChange={handleDateRangeChange}
              includeTime={false}
              showSearchButton={false}
              className="mt-2"
            />
            {(form.formState.errors.dataInicio || form.formState.errors.dataFim) && (
              <p className="text-sm text-red-500 mt-1">
                {form.formState.errors.dataInicio?.message || form.formState.errors.dataFim?.message}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
              {createMutation.isPending || updateMutation.isPending ? 'Salvando...' : (isEditMode ? 'Salvar Alterações' : 'Criar Período')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default PeriodoInscricaoFormModal; 