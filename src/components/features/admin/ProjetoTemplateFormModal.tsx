import React, { useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  ProjetoTemplateInput,
  insertProjetoTemplateSchema,
  ProjetoTemplateWithRelations,
} from '@/routes/api/admin/projeto-template/-types';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCreateProjetoTemplate, useUpdateProjetoTemplate } from '@/hooks/use-projeto-template';
import { useDisciplinas } from '@/hooks/use-disciplina'; // To select disciplinaId
import { useToast } from '@/hooks/use-toast';

interface ProjetoTemplateFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  template: ProjetoTemplateWithRelations | null; 
}

const ProjetoTemplateFormModal: React.FC<ProjetoTemplateFormModalProps> = ({ isOpen, onClose, template }) => {
  const isEditMode = !!template;
  const createMutation = useCreateProjetoTemplate();
  const updateMutation = useUpdateProjetoTemplate();
  const { toast } = useToast();

  // Attempt to fetch all disciplines. The enabled flag in useDisciplinas might need adjustment
  // if it strictly requires a departamentoId to be enabled.
  // For now, assuming it can fetch all if departamentoId is undefined and enabled is true or handled internally.
  const { data: disciplinas, isLoading: isLoadingDisciplinas } = useDisciplinas(); // Pass no ID to fetch all

  const form = useForm<ProjetoTemplateInput>({
    resolver: zodResolver(insertProjetoTemplateSchema),
    defaultValues: {
      disciplinaId: undefined,
      tituloDefault: '',
      descricaoDefault: '',
      cargaHorariaSemanaDefault: null,
      numeroSemanasDefault: null,
      publicoAlvoDefault: '',
      atividadesDefault: '',
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (isEditMode && template) {
        form.reset({
          disciplinaId: template.disciplinaId,
          tituloDefault: template.tituloDefault || '',
          descricaoDefault: template.descricaoDefault || '',
          cargaHorariaSemanaDefault: template.cargaHorariaSemanaDefault ?? null,
          numeroSemanasDefault: template.numeroSemanasDefault ?? null,
          publicoAlvoDefault: template.publicoAlvoDefault || '',
          atividadesDefault: template.atividadesDefault || '',
        });
      } else {
        form.reset({
          disciplinaId: undefined,
          tituloDefault: '',
          descricaoDefault: '',
          cargaHorariaSemanaDefault: null,
          numeroSemanasDefault: null,
          publicoAlvoDefault: '',
          atividadesDefault: '',
        });
      }
    }
  }, [isOpen, isEditMode, template, form]);

  const onSubmit = async (data: ProjetoTemplateInput) => {
    const payload = {
        ...data,
        cargaHorariaSemanaDefault: data.cargaHorariaSemanaDefault || null,
        numeroSemanasDefault: data.numeroSemanasDefault || null,
    };
    try {
      if (isEditMode && template) {
        await updateMutation.mutateAsync({ id: template.id, data: payload });
        toast({ title: 'Sucesso', description: 'Template de projeto atualizado.' });
      } else {
        await createMutation.mutateAsync(payload);
        toast({ title: 'Sucesso', description: 'Template de projeto criado.' });
      }
      onClose();
    } catch (error: any) {
      const defaultMessage = isEditMode ? 'Não foi possível atualizar o template.' : 'Não foi possível criar o template.';
      let errorMessage = defaultMessage;
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      }
      toast({ title: 'Erro', description: errorMessage, variant: 'destructive' });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Editar Template de Projeto' : 'Criar Novo Template de Projeto'}</DialogTitle>
          <DialogDescription>
            {isEditMode ? 'Modifique as informações do template.' : 'Preencha os dados para um novo template.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div>
            <Label htmlFor="disciplinaId">Disciplina *</Label>
            <Select 
              onValueChange={(value) => form.setValue('disciplinaId', parseInt(value), { shouldValidate: true })}
              defaultValue={form.getValues('disciplinaId')?.toString()}
              disabled={isLoadingDisciplinas || isEditMode} // Cannot change disciplina for existing template
            >
              <SelectTrigger id="disciplinaId">
                <SelectValue placeholder={isLoadingDisciplinas ? "Carregando disciplinas..." : "Selecione uma disciplina"} />
              </SelectTrigger>
              <SelectContent>
                {disciplinas?.map((disciplina) => (
                  <SelectItem key={disciplina.id} value={disciplina.id.toString()}>
                    {disciplina.nome} ({disciplina.codigo})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.disciplinaId && <p className="text-sm text-red-500 mt-1">{form.formState.errors.disciplinaId.message}</p>}
          </div>

          <div>
            <Label htmlFor="tituloDefault">Título Padrão</Label>
            <Input id="tituloDefault" {...form.register('tituloDefault')} placeholder="Ex: Projeto de Monitoria em [Nome da Disciplina]" />
            {form.formState.errors.tituloDefault && <p className="text-sm text-red-500 mt-1">{form.formState.errors.tituloDefault.message}</p>}
          </div>

          <div>
            <Label htmlFor="descricaoDefault">Descrição Padrão (Objetivos/Justificativa)</Label>
            <Textarea id="descricaoDefault" {...form.register('descricaoDefault')} placeholder="Descreva os objetivos e a justificativa comuns para projetos desta disciplina." rows={4}/>
            {form.formState.errors.descricaoDefault && <p className="text-sm text-red-500 mt-1">{form.formState.errors.descricaoDefault.message}</p>}
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="cargaHorariaSemanaDefault">C.H. Semanal Padrão</Label>
              <Input id="cargaHorariaSemanaDefault" type="number" {...form.register('cargaHorariaSemanaDefault', { valueAsNumber: true })} placeholder="Ex: 12"/>
              {form.formState.errors.cargaHorariaSemanaDefault && <p className="text-sm text-red-500 mt-1">{form.formState.errors.cargaHorariaSemanaDefault.message}</p>}
            </div>
            <div>
              <Label htmlFor="numeroSemanasDefault">Nº Semanas Padrão</Label>
              <Input id="numeroSemanasDefault" type="number" {...form.register('numeroSemanasDefault', { valueAsNumber: true })} placeholder="Ex: 15"/>
              {form.formState.errors.numeroSemanasDefault && <p className="text-sm text-red-500 mt-1">{form.formState.errors.numeroSemanasDefault.message}</p>}
            </div>
          </div>

          <div>
            <Label htmlFor="publicoAlvoDefault">Público Alvo Padrão</Label>
            <Input id="publicoAlvoDefault" {...form.register('publicoAlvoDefault')} placeholder="Ex: Alunos regularmente matriculados em..."/>
            {form.formState.errors.publicoAlvoDefault && <p className="text-sm text-red-500 mt-1">{form.formState.errors.publicoAlvoDefault.message}</p>}
          </div>

          <div>
            <Label htmlFor="atividadesDefault">Atividades Padrão (separadas por ; ou JSON)</Label>
            <Textarea id="atividadesDefault" {...form.register('atividadesDefault')} placeholder="Ex: Atendimento a alunos; Correção de listas; Preparação de material" rows={3}/>
            {form.formState.errors.atividadesDefault && <p className="text-sm text-red-500 mt-1">{form.formState.errors.atividadesDefault.message}</p>}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending || isLoadingDisciplinas}>
              {createMutation.isPending || updateMutation.isPending ? 'Salvando...' : (isEditMode ? 'Salvar Alterações' : 'Criar Template')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ProjetoTemplateFormModal; 