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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format, addDays, isBefore, startOfDay } from "date-fns";
import { ptBR } from 'date-fns/locale';

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

  // Função para validar e ajustar data fim
  const handleDataInicioChange = (date: Date | undefined) => {
    if (!date) return;
    
    form.setValue('dataInicio', date, { shouldValidate: true });
    
    // Se a data fim for anterior à nova data início, ajusta automaticamente
    const currentDataFim = form.getValues('dataFim');
    if (currentDataFim && isBefore(startOfDay(currentDataFim), startOfDay(date))) {
      const newDataFim = addDays(date, 1);
      form.setValue('dataFim', newDataFim, { shouldValidate: true });
      toast({
        title: 'Data ajustada',
        description: 'A data de fim foi ajustada para ser posterior à data de início.',
        variant: 'default'
      });
    }
  };

  const handleDataFimChange = (date: Date | undefined) => {
    if (!date) return;
    
    // Verifica se a data selecionada é anterior à data início
    const dataInicio = form.getValues('dataInicio');
    if (dataInicio && isBefore(startOfDay(date), startOfDay(dataInicio))) {
      toast({
        title: 'Data inválida',
        description: 'A data de fim não pode ser anterior à data de início.',
        variant: 'destructive'
      });
      return;
    }
    
    form.setValue('dataFim', date, { shouldValidate: true });
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
    // Validação final antes do submit
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
            <Label htmlFor="dataInicio">Data de Início *</Label>
            <Popover>
                <PopoverTrigger asChild>
                    <Button
                        variant={"outline"}
                        type="button"
                        className={cn(
                            "w-full justify-start text-left font-normal",
                            !watchedDataInicio && "text-muted-foreground"
                        )}
                    >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {watchedDataInicio ? format(new Date(watchedDataInicio), "PPP", { locale: ptBR }) : <span>Escolha uma data</span>}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                    <Calendar
                        mode="single"
                        selected={watchedDataInicio ? new Date(watchedDataInicio) : undefined}
                        onSelect={handleDataInicioChange}
                        disabled={(date) => isBefore(startOfDay(date), startOfDay(new Date()))}
                        initialFocus
                    />
                </PopoverContent>
            </Popover>
            {form.formState.errors.dataInicio && <p className="text-sm text-red-500 mt-1">{form.formState.errors.dataInicio.message}</p>}
          </div>

          <div>
            <Label htmlFor="dataFim">Data de Fim *</Label>
             <Popover>
                <PopoverTrigger asChild>
                    <Button
                        variant={"outline"}
                        type="button"
                        className={cn(
                            "w-full justify-start text-left font-normal",
                            !watchedDataFim && "text-muted-foreground"
                        )}
                    >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {watchedDataFim ? format(new Date(watchedDataFim), "PPP", { locale: ptBR }) : <span>Escolha uma data</span>}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                    <Calendar
                        mode="single"
                        selected={watchedDataFim ? new Date(watchedDataFim) : undefined}
                        onSelect={handleDataFimChange}
                        disabled={(date) => {
                          // Desabilita datas anteriores à hoje e datas anteriores à data início
                          const today = startOfDay(new Date());
                          const dataInicio = watchedDataInicio ? startOfDay(new Date(watchedDataInicio)) : today;
                          return isBefore(startOfDay(date), today) || isBefore(startOfDay(date), dataInicio);
                        }}
                        initialFocus
                    />
                </PopoverContent>
            </Popover>
            {form.formState.errors.dataFim && <p className="text-sm text-red-500 mt-1">{form.formState.errors.dataFim.message}</p>}
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