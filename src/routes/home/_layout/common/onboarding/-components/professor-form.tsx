import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/utils/api-client';
import { logger } from '@/utils/logger';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

const log = logger.child({
  context: 'professor-form',
});

// Schema simplificado para professor
const professorSchema = z.object({
  nomeCompleto: z.string().min(1, 'Nome completo é obrigatório'),
  nomeSocial: z.string().optional(),
  matriculaSiape: z.string().min(1, 'Matrícula SIAPE é obrigatória'),
  cpf: z.string().min(1, 'CPF é obrigatório'),
  regime: z.string().min(1, 'Regime é obrigatório'),
  emailInstitucional: z.string().min(1, 'E-mail institucional é obrigatório'),
});

type ProfessorFormData = z.infer<typeof professorSchema>;

export function ProfessorForm() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [useNomeSocial, setUseNomeSocial] = useState(false);
  const { toast } = useToast();

  const form = useForm<ProfessorFormData>({
    resolver: zodResolver(professorSchema),
    defaultValues: {
      emailInstitucional: user?.email || '',
    },
  });

  // Hook para salvar professor
  const professorMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiClient.post('/professor', data);
    },
    onSuccess: () => {
      navigate({ to: '/home' });
    },
    onError: (error) => {
      log.error('Falha ao atualizar perfil:', error);
    },
  });

  const onSubmit = (values: ProfessorFormData) => {
    if (!useNomeSocial) {
      values.nomeSocial = undefined;
    }

    // Converte o valor de string para o tipo esperado pelo enum
    const tipoRegime = values.regime as '20H' | '40H' | 'DE';

    // Use o valor do formulário
    const emailInstitucional = values.emailInstitucional || '';

    professorMutation.mutate({
      nomeCompleto: values.nomeCompleto,
      cpf: values.cpf,
      matriculaSiape: values.matriculaSiape,
      nomeSocial: values.nomeSocial,
      emailInstitucional,
      genero: 'OUTRO', // Default para simplificar
      regime: tipoRegime,
      departamentoId: 1, // Valor padrão temporário, deve ser ajustado conforme necessário
    });
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold">Informações Pessoais</h2>

        <div className="grid grid-cols-1 gap-4">
          <div>
            <Label htmlFor="nomeCompleto">Nome Completo</Label>
            <Input
              id="nomeCompleto"
              {...form.register('nomeCompleto')}
              className={
                form.formState.errors.nomeCompleto ? 'border-red-500' : ''
              }
            />
            {form.formState.errors.nomeCompleto && (
              <p className="text-red-500 text-sm mt-1">
                {form.formState.errors.nomeCompleto.message}
              </p>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="useNomeSocial"
              checked={useNomeSocial}
              onCheckedChange={(checked) => setUseNomeSocial(checked === true)}
            />
            <Label htmlFor="useNomeSocial" className="text-sm font-normal">
              Usar nome social
            </Label>
          </div>

          {useNomeSocial && (
            <div className="ml-6">
              <Label htmlFor="nomeSocial">Nome Social</Label>
              <Input id="nomeSocial" {...form.register('nomeSocial')} />
            </div>
          )}

          <div>
            <Label htmlFor="emailInstitucional">E-mail Institucional</Label>
            <Input
              id="emailInstitucional"
              {...form.register('emailInstitucional')}
              disabled
            />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <h2 className="text-xl font-semibold">Documentos e Identificação</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="matriculaSiape">Matrícula SIAPE</Label>
            <Input
              id="matriculaSiape"
              {...form.register('matriculaSiape')}
              className={
                form.formState.errors.matriculaSiape ? 'border-red-500' : ''
              }
            />
            {form.formState.errors.matriculaSiape && (
              <p className="text-red-500 text-sm mt-1">
                {form.formState.errors.matriculaSiape.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="cpf">CPF</Label>
            <Input
              id="cpf"
              {...form.register('cpf')}
              className={form.formState.errors.cpf ? 'border-red-500' : ''}
              placeholder="Somente números"
            />
            {form.formState.errors.cpf && (
              <p className="text-red-500 text-sm mt-1">
                {form.formState.errors.cpf.message}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <h2 className="text-xl font-semibold">Regime de Trabalho</h2>

        <div>
          <Label htmlFor="regime">Regime</Label>
          <Select
            onValueChange={(value) => form.setValue('regime', value)}
            defaultValue={form.getValues('regime')}
          >
            <SelectTrigger
              className={form.formState.errors.regime ? 'border-red-500' : ''}
            >
              <SelectValue placeholder="Selecione o regime" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="20H">20 horas</SelectItem>
              <SelectItem value="40H">40 horas</SelectItem>
              <SelectItem value="DE">Dedicação Exclusiva</SelectItem>
            </SelectContent>
          </Select>
          {form.formState.errors.regime && (
            <p className="text-red-500 text-sm mt-1">
              {form.formState.errors.regime.message}
            </p>
          )}
        </div>
      </div>

      <div className="pt-4">
        <Button
          type="submit"
          className="w-full"
          disabled={professorMutation.isPending}
        >
          {professorMutation.isPending ? (
            <span className="flex items-center gap-2">
              <Spinner /> Salvando...
            </span>
          ) : (
            'Concluir Cadastro'
          )}
        </Button>
      </div>
      {professorMutation.error && (
        <p className="text-red-500 text-sm mt-2 text-center">
          Erro ao salvar:{' '}
          {professorMutation.error instanceof Error
            ? professorMutation.error.message
            : 'Erro desconhecido'}
        </p>
      )}
    </form>
  );
}
