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
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { trpc } from '@/router';
import { insertAlunoTableSchema } from '@/server/database/schema';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

export const Route = createFileRoute('/home/_layout/onboarding/onboarding')({
  component: OnboardingPage,
});

function OnboardingPage() {
  const { user, isLoading: authLoading } = useAuth();

  if (authLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        Carregando...
      </div>
    );
  }

  const isStudent = user?.role === 'student';

  return (
    <div className="max-w-3xl mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold mb-2">Bem-vindo(a)!</h1>
      <p className="mb-8 text-muted-foreground">
        Por favor, complete suas informações de perfil. Isso facilitará o
        preenchimento automático em futuras candidaturas.
      </p>

      {isStudent ? <StudentForm /> : <ProfessorForm />}
    </div>
  );
}
// Schema for student (aluno) form data

async function fetchProfile(apiUrl: string) {
  const res = await fetch(apiUrl);
  if (!res.ok) {
    throw new Error('Falha ao buscar perfil');
  }
  if (res.status === 200) {
    const text = await res.text();
    try {
      return JSON.parse(text);
    } catch (e) {
      if (text.trim() === '{}') return {};
      throw new Error('Resposta inválida do servidor');
    }
  }
  return {};
}

function StudentForm() {
  const navigate = useNavigate();
  const { isLoading: authLoading } = useAuth();
  const [useNomeSocial, setUseNomeSocial] = useState(false);
  const { toast } = useToast();

  const cursoQuery = trpc.curso.get.useQuery();
  const form = useForm<StudentFormData>({
    resolver: zodResolver(studentSchema),
  });

  const setAlunoMutation = trpc.aluno.set.useMutation({
    onSuccess: () => {
      debugger;
      toast({
        title: 'Cadastro realizado com sucesso!',
      });
      navigate({ to: '/home' });
    },
  });

  const onSubmit = (values: StudentFormData) => {
    if (!useNomeSocial) {
      values.nomeSocial = undefined;
    }
    setAlunoMutation.mutate({
      cpf: values.cpf,
      emailInstitucional: values.emailInstitucional,
      genero: values.genero,
      matricula: values.matricula,
      nomeCompleto: values.nomeCompleto,
      nomeSocial: values.nomeSocial,
      cr: values.cr,
      cursoId: values.cursoId,
      rg: values.rg,
      telefone: values.telefone,
      especificacaoGenero: values.especificacaoGenero,
    });
  };

  if (authLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        Carregando...
      </div>
    );
  }

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
        </div>
      </div>

      <div className="space-y-2">
        <h2 className="text-xl font-semibold">Documentos e Identificação</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="matricula">Matrícula</Label>
            <Input
              id="matricula"
              {...form.register('matricula')}
              className={
                form.formState.errors.matricula ? 'border-red-500' : ''
              }
            />
            {form.formState.errors.matricula && (
              <p className="text-red-500 text-sm mt-1">
                {form.formState.errors.matricula.message}
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
        <h2 className="text-xl font-semibold">Informações de Contato</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="emailInstitucional">Email Institucional</Label>
            <Input
              id="emailInstitucional"
              type="email"
              {...form.register('emailInstitucional')}
              className={
                form.formState.errors.emailInstitucional ? 'border-red-500' : ''
              }
            />
            {form.formState.errors.emailInstitucional && (
              <p className="text-red-500 text-sm mt-1">
                {form.formState.errors.emailInstitucional.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="telefone">Telefone (opcional)</Label>
            <Input id="telefone" {...form.register('telefone')} />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <h2 className="text-xl font-semibold">Informações Acadêmicas</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <Label htmlFor="cursoId">Curso</Label>
            <Select
              onValueChange={(value) =>
                form.setValue('cursoId', parseInt(value))
              }
              defaultValue={form.getValues('cursoId')?.toString()}
            >
              <SelectTrigger
                className={
                  form.formState.errors.cursoId ? 'border-red-500' : ''
                }
              >
                <SelectValue placeholder="Selecione o curso" />
              </SelectTrigger>
              <SelectContent>
                {cursoQuery.data?.map((curso) => (
                  <SelectItem key={curso.id} value={curso.id.toString()}>
                    {curso.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.cursoId && (
              <p className="text-red-500 text-sm mt-1">
                {form.formState.errors.cursoId.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="cr">CR</Label>
            <Input
              id="cr"
              {...form.register('cr')}
              className={form.formState.errors.cr ? 'border-red-500' : ''}
              type="number"
              placeholder="Ex: 8.5"
            />
            {form.formState.errors.cr && (
              <p className="text-red-500 text-sm mt-1">
                {form.formState.errors.cr.message}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <h2 className="text-xl font-semibold">Dados Adicionais</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="genero">Gênero</Label>
            <Select
              onValueChange={(value) =>
                form.setValue(
                  'genero',
                  value as 'MASCULINO' | 'FEMININO' | 'OUTRO',
                )
              }
              defaultValue={form.getValues('genero')}
            >
              <SelectTrigger
                className={form.formState.errors.genero ? 'border-red-500' : ''}
              >
                <SelectValue placeholder="Selecione o gênero" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MASCULINO">Masculino</SelectItem>
                <SelectItem value="FEMININO">Feminino</SelectItem>
                <SelectItem value="OUTRO">Outro</SelectItem>
              </SelectContent>
            </Select>
            {form.formState.errors.genero && (
              <p className="text-red-500 text-sm mt-1">
                {form.formState.errors.genero.message}
              </p>
            )}
          </div>

          {form.getValues('genero') === 'OUTRO' && (
            <div>
              <Label htmlFor="especificacaoGenero">
                Especificação de Gênero
              </Label>
              <Input
                id="especificacaoGenero"
                {...form.register('especificacaoGenero')}
              />
            </div>
          )}
        </div>
      </div>

      <div className="pt-4">
        <Button
          type="submit"
          className="w-full"
          disabled={setAlunoMutation.isPending}
        >
          {setAlunoMutation.isPending ? 'Salvando...' : 'Concluir Cadastro'}
        </Button>
      </div>
      {setAlunoMutation.error && (
        <p className="text-red-500 text-sm mt-2 text-center">
          Erro ao salvar: {setAlunoMutation.error.message}
        </p>
      )}
    </form>
  );
}

function ProfessorForm() {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const [useNomeSocial, setUseNomeSocial] = useState(false);

  const form = useForm<ProfessorFormData>({
    resolver: zodResolver(professorSchema),
  });

  const { data: profileData, isLoading: profileLoading } = useQuery({
    queryKey: ['userProfile', user?.id, user?.role],
    queryFn: () => fetchProfile('/api/professor'),
    enabled: !!user && !authLoading,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  useEffect(() => {
    if (profileData) {
      const requiredFields = Object.keys(professorSchema.shape);
      const isComplete =
        Object.keys(profileData).length > 0 &&
        requiredFields.every(
          (field) =>
            field in profileData &&
            profileData[field as keyof typeof profileData] !== null &&
            profileData[field as keyof typeof profileData] !== '',
        );

      if (isComplete) {
        navigate({ to: '/home' });
      } else if (Object.keys(profileData).length > 0) {
        form.reset(profileData);
        setUseNomeSocial(!!profileData.nomeSocial);
      }
    }
  }, [profileData, navigate, form]);

  const mutation = useMutation({
    mutationFn: (data: ProfessorFormData) => ({}),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['userProfile', user?.id, user?.role],
      });
      await queryClient.invalidateQueries({
        queryKey: ['profile-completeness'],
      });
      navigate({ to: '/home' });
    },
    onError: (error) => {
      console.error('Falha ao atualizar perfil:', error);
    },
  });

  const onSubmit = (values: ProfessorFormData) => {
    if (!useNomeSocial) {
      values.nomeSocial = undefined;
    }
    mutation.mutate(values);
  };

  if (authLoading || (profileLoading && !profileData)) {
    return (
      <div className="flex justify-center items-center h-screen">
        Carregando...
      </div>
    );
  }

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
        <h2 className="text-xl font-semibold">Informações de Contato</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="emailInstitucional">Email Institucional</Label>
            <Input
              id="emailInstitucional"
              type="email"
              {...form.register('emailInstitucional')}
              className={
                form.formState.errors.emailInstitucional ? 'border-red-500' : ''
              }
            />
            {form.formState.errors.emailInstitucional && (
              <p className="text-red-500 text-sm mt-1">
                {form.formState.errors.emailInstitucional.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="telefone">Telefone (opcional)</Label>
            <Input id="telefone" {...form.register('telefone')} />
          </div>
        </div>

        <div className="mt-4">
          <Label htmlFor="telefoneInstitucional">
            Telefone Institucional (opcional)
          </Label>
          <Input
            id="telefoneInstitucional"
            {...form.register('telefoneInstitucional')}
          />
        </div>
      </div>

      <div className="space-y-2">
        <h2 className="text-xl font-semibold">Informações Profissionais</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="departamentoId">Departamento</Label>
            <Select
              onValueChange={(value) =>
                form.setValue('departamentoId', parseInt(value))
              }
              defaultValue={form.getValues('departamentoId')?.toString()}
            >
              <SelectTrigger
                className={
                  form.formState.errors.departamentoId ? 'border-red-500' : ''
                }
              >
                <SelectValue placeholder="Selecione o departamento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Ciência da Computação (DCC)</SelectItem>
                <SelectItem value="2">Estatística</SelectItem>
                <SelectItem value="3">Matemática</SelectItem>
                <SelectItem value="4">
                  Computação Interdisciplinar (DCI)
                </SelectItem>
              </SelectContent>
            </Select>
            {form.formState.errors.departamentoId && (
              <p className="text-red-500 text-sm mt-1">
                {form.formState.errors.departamentoId.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="regime">Regime de Trabalho</Label>
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
      </div>

      <div className="space-y-2">
        <h2 className="text-xl font-semibold">Dados Adicionais</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="genero">Gênero</Label>
            <Select
              onValueChange={(value) => form.setValue('genero', value)}
              defaultValue={form.getValues('genero')}
            >
              <SelectTrigger
                className={form.formState.errors.genero ? 'border-red-500' : ''}
              >
                <SelectValue placeholder="Selecione o gênero" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MASCULINO">Masculino</SelectItem>
                <SelectItem value="FEMININO">Feminino</SelectItem>
                <SelectItem value="OUTRO">Outro</SelectItem>
              </SelectContent>
            </Select>
            {form.formState.errors.genero && (
              <p className="text-red-500 text-sm mt-1">
                {form.formState.errors.genero.message}
              </p>
            )}
          </div>

          {form.getValues('genero') === 'OUTRO' && (
            <div>
              <Label htmlFor="especificacaoGenero">
                Especificação de Gênero
              </Label>
              <Input
                id="especificacaoGenero"
                {...form.register('especificacaoGenero')}
              />
            </div>
          )}
        </div>
      </div>

      <div className="pt-4">
        <Button type="submit" className="w-full" disabled={mutation.isPending}>
          {mutation.isPending ? 'Salvando...' : 'Concluir Cadastro'}
        </Button>
      </div>
      {mutation.error && (
        <p className="text-red-500 text-sm mt-2 text-center">
          Erro ao salvar: {mutation.error.message}
        </p>
      )}
    </form>
  );
}

const studentSchema = insertAlunoTableSchema.extend({
  cr: z.coerce.number().min(1, 'CR é obrigatório'),
});

// Schema for professor form data
const professorSchema = z.object({
  nomeCompleto: z.string().min(1, 'Nome completo é obrigatório'),
  nomeSocial: z.string().optional(),
  matriculaSiape: z.string().min(1, 'Matrícula SIAPE é obrigatória'),
  cpf: z.string().min(1, 'CPF é obrigatório'),
  emailInstitucional: z
    .string()
    .email('Email institucional inválido')
    .min(1, 'Email institucional é obrigatório'),
  genero: z.string().min(1, 'Gênero é obrigatório'),
  especificacaoGenero: z.string().optional(),
  regime: z.string().min(1, 'Regime é obrigatório'),
  telefone: z.string().optional(),
  telefoneInstitucional: z.string().optional(),
  departamentoId: z.coerce.number().min(1, 'ID do departamento é obrigatório'),
});

type StudentFormData = z.infer<typeof studentSchema>;
type ProfessorFormData = z.infer<typeof professorSchema>;
