import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/use-auth';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

const studentSchema = z.object({
  nomeCompleto: z.string().min(1, 'Nome completo é obrigatório'),
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
  cursoId: z.string().min(1, 'ID do curso é obrigatório'),
});

type StudentFormData = z.infer<typeof studentSchema>;

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

function OnboardingPage() {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();

  const profileApiUrl =
    user?.role === 'student' ? '/api/aluno' : '/api/professor';
  const currentSchema = studentSchema;
  type CurrentFormData = StudentFormData;

  const form = useForm<CurrentFormData>({
    resolver: zodResolver(currentSchema),
  });

  const { data: profileData, isLoading: profileLoading } = useQuery({
    queryKey: ['userProfile', user?.id, user?.role],
    queryFn: () => fetchProfile(profileApiUrl),
    enabled: !!user && !authLoading,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  useEffect(() => {
    if (profileData) {
      const requiredFields = Object.keys(currentSchema.shape);
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
  }, [profileData, navigate, form, currentSchema]);

  const mutation = useMutation({
    mutationFn: (data: CurrentFormData) => updateProfile(profileApiUrl, data),
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

  const onSubmit = (values: CurrentFormData) => {
    const processedValues = {
      ...values,
    };
    mutation.mutate(processedValues);
  };

  if (authLoading || (profileLoading && !profileData)) {
    return (
      <div className="flex justify-center items-center h-screen">
        Carregando...
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold mb-2">Bem-vindo(a)!</h1>
      <p className="mb-8 text-muted-foreground">
        Por favor, complete suas informações de perfil. Isso facilitará o
        preenchimento automático em futuras candidaturas.
      </p>

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
            placeholder="Gênero"
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
          <Button
            type="submit"
            className="w-full"
            disabled={mutation.isPending}
          >
            {mutation.isPending ? 'Salvando...' : 'Concluir Cadastro'}
          </Button>
        </div>
        {mutation.error && (
          <p className="text-red-500 text-sm mt-2 text-center">
            Erro ao salvar: {mutation.error.message}
          </p>
        )}
      </form>
    </div>
  );
}

export const Route = createFileRoute('/onboarding')({
  component: OnboardingPage,
});
