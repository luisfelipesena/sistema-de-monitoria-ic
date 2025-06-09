import React, { useEffect, useState } from 'react';
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { useCreatePeriodoInscricao, useUpdatePeriodoInscricao } from '@/hooks/use-periodo-inscricao';
import { useToast } from '@/hooks/use-toast';
import { isBefore, startOfDay, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

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
  const [openInicio, setOpenInicio] = useState(false);
  const [openFim, setOpenFim] = useState(false);

  const handleDataInicioChange = (date: Date | undefined) => {
    if (!date) return;
    
    form.setValue('dataInicio', date, { shouldValidate: true });
    setOpenInicio(false);
    
    // Se a data de fim já estiver definida e for anterior à nova data de início, limpar
    const dataFim = form.getValues('dataFim');
    if (dataFim && isBefore(startOfDay(dataFim), startOfDay(date))) {
      form.setValue('dataFim', new Date(date.getTime() + 24 * 60 * 60 * 1000), { shouldValidate: true });
    }
  };

  const handleDataFimChange = (date: Date | undefined) => {
    if (!date) return;
    
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
    setOpenFim(false);
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
    } else {
      // Resetar estado dos popovers quando modal é fechado
      setOpenInicio(false);
      setOpenFim(false);
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[520px]">
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
            <div className="grid grid-cols-2 gap-4 mt-2">
              <div>
                <Label className="text-sm text-muted-foreground">Início</Label>
                <Popover open={openInicio} onOpenChange={setOpenInicio}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !watchedDataInicio && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {watchedDataInicio ? format(watchedDataInicio, "dd/MM/yyyy", { locale: ptBR }) : "Selecione"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={watchedDataInicio}
                      onSelect={handleDataInicioChange}
                      defaultMonth={watchedDataInicio}
                      className="rounded-lg border shadow-sm"
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <div>
                <Label className="text-sm text-muted-foreground">Fim</Label>
                <Popover open={openFim} onOpenChange={setOpenFim}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !watchedDataFim && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {watchedDataFim ? format(watchedDataFim, "dd/MM/yyyy", { locale: ptBR }) : "Selecione"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={watchedDataFim}
                      onSelect={handleDataFimChange}
                      defaultMonth={watchedDataFim || watchedDataInicio}
                      disabled={(date) => watchedDataInicio ? isBefore(startOfDay(date), startOfDay(watchedDataInicio)) : false}
                      className="rounded-lg border shadow-sm"
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
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