import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/use-auth';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

// Schema for student (aluno) form data
const studentSchema = z.object({
  nomeCompleto: z.string().min(1, 'Nome completo é obrigatório'),
  nomeSocial: z.string().optional(),
  matricula: z.string().min(1, 'Matrícula é obrigatória'),
  cpf: z.string().min(1, 'CPF é obrigatório'),
  emailInstitucional: z
    .string()
    .email('Email institucional inválido')
    .min(1, 'Email institucional é obrigatório'),
  genero: z.string().min(1, 'Gênero é obrigatório'),
  especificacaoGenero: z.string().optional(),
  cr: z.string().min(1, 'CR é obrigatório'),
  telefone: z.string().optional(),
  cursoId: z.coerce.number().min(1, 'ID do curso é obrigatório'),
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

async function updateProfile(apiUrl: string, data: any) {
  const res = await fetch(apiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    throw new Error('Falha ao atualizar perfil');
  }
  return res.json();
}

function StudentForm() {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();

  const form = useForm<StudentFormData>({
    resolver: zodResolver(studentSchema),
  });

  const { data: profileData, isLoading: profileLoading } = useQuery({
    queryKey: ['userProfile', user?.id, user?.role],
    queryFn: () => fetchProfile('/api/aluno'),
    enabled: !!user && !authLoading,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  useEffect(() => {
    if (profileData) {
      const requiredFields = Object.keys(studentSchema.shape);
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
      }
    }
  }, [profileData, navigate, form]);

  const mutation = useMutation({
    mutationFn: (data: StudentFormData) => updateProfile('/api/aluno', data),
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

  const onSubmit = (values: StudentFormData) => {
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
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Input
          placeholder="Nome Completo"
          {...form.register('nomeCompleto')}
          aria-invalid={form.formState.errors.nomeCompleto ? 'true' : 'false'}
        />
        {form.formState.errors.nomeCompleto && (
          <p className="text-red-500 text-sm mt-1">
            {form.formState.errors.nomeCompleto.message}
          </p>
        )}
      </div>

      <div>
        <Input
          placeholder="Nome Social (opcional)"
          {...form.register('nomeSocial')}
        />
      </div>

      <div>
        <Input
          placeholder="Matrícula"
          {...form.register('matricula')}
          aria-invalid={form.formState.errors.matricula ? 'true' : 'false'}
        />
        {form.formState.errors.matricula && (
          <p className="text-red-500 text-sm mt-1">
            {form.formState.errors.matricula.message}
          </p>
        )}
      </div>

      <div>
        <Input
          placeholder="CPF (somente números)"
          {...form.register('cpf')}
          aria-invalid={form.formState.errors.cpf ? 'true' : 'false'}
        />
        {form.formState.errors.cpf && (
          <p className="text-red-500 text-sm mt-1">
            {form.formState.errors.cpf.message}
          </p>
        )}
      </div>

      <div>
        <Input
          placeholder="Email Institucional"
          type="email"
          {...form.register('emailInstitucional')}
          aria-invalid={
            form.formState.errors.emailInstitucional ? 'true' : 'false'
          }
        />
        {form.formState.errors.emailInstitucional && (
          <p className="text-red-500 text-sm mt-1">
            {form.formState.errors.emailInstitucional.message}
          </p>
        )}
      </div>

      <div>
        <Input
          placeholder="Gênero (MASCULINO, FEMININO ou OUTRO)"
          {...form.register('genero')}
          aria-invalid={form.formState.errors.genero ? 'true' : 'false'}
        />
        {form.formState.errors.genero && (
          <p className="text-red-500 text-sm mt-1">
            {form.formState.errors.genero.message}
          </p>
        )}
      </div>

      <div>
        <Input
          placeholder="Especificação de Gênero (opcional)"
          {...form.register('especificacaoGenero')}
        />
      </div>

      <div>
        <Input
          placeholder="CR (Coeficiente de Rendimento)"
          {...form.register('cr')}
          aria-invalid={form.formState.errors.cr ? 'true' : 'false'}
        />
        {form.formState.errors.cr && (
          <p className="text-red-500 text-sm mt-1">
            {form.formState.errors.cr.message}
          </p>
        )}
      </div>

      <div>
        <Input
          placeholder="Telefone (opcional)"
          {...form.register('telefone')}
        />
      </div>

      <div>
        <Input
          placeholder="ID do Curso"
          type="number"
          {...form.register('cursoId')}
          aria-invalid={form.formState.errors.cursoId ? 'true' : 'false'}
        />
        {form.formState.errors.cursoId && (
          <p className="text-red-500 text-sm mt-1">
            {form.formState.errors.cursoId.message}
          </p>
        )}
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

function ProfessorForm() {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();

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
      }
    }
  }, [profileData, navigate, form]);

  const mutation = useMutation({
    mutationFn: (data: ProfessorFormData) =>
      updateProfile('/api/professor', data),
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
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Input
          placeholder="Nome Completo"
          {...form.register('nomeCompleto')}
          aria-invalid={form.formState.errors.nomeCompleto ? 'true' : 'false'}
        />
        {form.formState.errors.nomeCompleto && (
          <p className="text-red-500 text-sm mt-1">
            {form.formState.errors.nomeCompleto.message}
          </p>
        )}
      </div>

      <div>
        <Input
          placeholder="Nome Social (opcional)"
          {...form.register('nomeSocial')}
        />
      </div>

      <div>
        <Input
          placeholder="Matrícula SIAPE"
          {...form.register('matriculaSiape')}
          aria-invalid={form.formState.errors.matriculaSiape ? 'true' : 'false'}
        />
        {form.formState.errors.matriculaSiape && (
          <p className="text-red-500 text-sm mt-1">
            {form.formState.errors.matriculaSiape.message}
          </p>
        )}
      </div>

      <div>
        <Input
          placeholder="CPF (somente números)"
          {...form.register('cpf')}
          aria-invalid={form.formState.errors.cpf ? 'true' : 'false'}
        />
        {form.formState.errors.cpf && (
          <p className="text-red-500 text-sm mt-1">
            {form.formState.errors.cpf.message}
          </p>
        )}
      </div>

      <div>
        <Input
          placeholder="Email Institucional"
          type="email"
          {...form.register('emailInstitucional')}
          aria-invalid={
            form.formState.errors.emailInstitucional ? 'true' : 'false'
          }
        />
        {form.formState.errors.emailInstitucional && (
          <p className="text-red-500 text-sm mt-1">
            {form.formState.errors.emailInstitucional.message}
          </p>
        )}
      </div>

      <div>
        <Input
          placeholder="Gênero (MASCULINO, FEMININO ou OUTRO)"
          {...form.register('genero')}
          aria-invalid={form.formState.errors.genero ? 'true' : 'false'}
        />
        {form.formState.errors.genero && (
          <p className="text-red-500 text-sm mt-1">
            {form.formState.errors.genero.message}
          </p>
        )}
      </div>

      <div>
        <Input
          placeholder="Especificação de Gênero (opcional)"
          {...form.register('especificacaoGenero')}
        />
      </div>

      <div>
        <Input
          placeholder="Regime (20H, 40H, ou DE)"
          {...form.register('regime')}
          aria-invalid={form.formState.errors.regime ? 'true' : 'false'}
        />
        {form.formState.errors.regime && (
          <p className="text-red-500 text-sm mt-1">
            {form.formState.errors.regime.message}
          </p>
        )}
      </div>

      <div>
        <Input
          placeholder="Telefone (opcional)"
          {...form.register('telefone')}
        />
      </div>

      <div>
        <Input
          placeholder="Telefone Institucional (opcional)"
          {...form.register('telefoneInstitucional')}
        />
      </div>

      <div>
        <Input
          placeholder="ID do Departamento"
          type="number"
          {...form.register('departamentoId')}
          aria-invalid={form.formState.errors.departamentoId ? 'true' : 'false'}
        />
        {form.formState.errors.departamentoId && (
          <p className="text-red-500 text-sm mt-1">
            {form.formState.errors.departamentoId.message}
          </p>
        )}
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
    <div className="max-w-2xl mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold mb-2">Bem-vindo(a)!</h1>
      <p className="mb-8 text-muted-foreground">
        Por favor, complete suas informações de perfil. Isso facilitará o
        preenchimento automático em futuras candidaturas.
      </p>

      {isStudent ? <StudentForm /> : <ProfessorForm />}
    </div>
  );
}

export const Route = createFileRoute('/home/_layout/onboarding/onboarding')({
  component: OnboardingPage,
});
