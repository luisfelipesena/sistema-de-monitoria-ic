import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { FileUploader } from '@/components/ui/FileUploader';
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

import { trpc } from '@/server/trpc/react';
import { logger } from '@/utils/logger';
import { zodResolver } from '@hookform/resolvers/zod';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

const log = logger.child({
  context: 'onboarding',
});

export const Route = createFileRoute('/home/_layout/onboarding/')({
  component: OnboardingPage,
});

function OnboardingPage() {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  // Verificar se o usuário precisa de onboarding
  const { data: onboardingStatus, isLoading: statusLoading } =
    trpc.onboarding.getStatus.useQuery(undefined, {
      enabled: !!user && !authLoading,
    });

  // Quando o status estiver disponível, redirecionar se não for necessário onboarding
  useEffect(() => {
    if (!authLoading && !statusLoading && onboardingStatus) {
      if (!onboardingStatus.pending) {
        navigate({ to: '/home' });
      }
    }
  }, [onboardingStatus, authLoading, statusLoading, navigate]);

  if (authLoading || statusLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        Carregando...
      </div>
    );
  }

  // Se não precisar de onboarding, não renderizar nada (será redirecionado)
  if (!onboardingStatus?.pending) {
    return null;
  }

  // Admin não precisa de onboarding
  if (user?.role === 'admin') {
    navigate({ to: '/home' });
    return null;
  }

  return (
    <div className="max-w-3xl mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold mb-2">Seja bem-vindo(a)!</h1>
      <p className="mb-8 text-muted-foreground">Cadastre suas informações</p>

      {user?.role === 'student' ? <StudentForm /> : <ProfessorForm />}
    </div>
  );
}

// Interface estendida para incluir campos de upload
interface AlunoFormData {
  nomeCompleto: string;
  nomeSocial?: string;
  cpf: string;
  matricula: string;
  emailInstitucional: string;
  genero: 'MASCULINO' | 'FEMININO' | 'OUTRO';
  // Campos adicionais necessários pelo backend
  cursoId: number;
  cr: number;
  // Campos para o upload de arquivos
  historicoEscolarFileId?: string;
  comprovanteMatriculaFileId?: string;
}

function StudentForm() {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const [useNomeSocial, setUseNomeSocial] = useState(false);
  const { toast } = useToast();
  const [historicoEscolarFileId, setHistoricoEscolarFileId] = useState<
    string | null
  >(null);
  const [comprovanteMatriculaFileId, setComprovanteMatriculaFileId] = useState<
    string | null
  >(null);

  const form = useForm<StudentFormData>({
    resolver: zodResolver(studentSchema),
  });

  const setAlunoMutation = trpc.aluno.set.useMutation({
    onSuccess: () => {
      toast({
        title: 'Cadastro realizado com sucesso!',
      });
      navigate({ to: '/home' });
    },
  });
  const trpcUtils = trpc.useUtils();

  const onSubmit = (values: StudentFormData) => {
    if (!useNomeSocial) {
      values.nomeSocial = undefined;
    }

    if (!historicoEscolarFileId) {
      toast({
        title: 'Documento obrigatório',
        description: 'É necessário fazer upload do histórico escolar',
        variant: 'destructive',
      });
      return;
    }

    const alunoData: AlunoFormData = {
      cpf: values.cpf,
      emailInstitucional: user?.email || '',
      matricula: values.matricula,
      nomeCompleto: values.nomeCompleto,
      nomeSocial: values.nomeSocial,
      genero: 'OUTRO',
      // Valores padrão para campos obrigatórios
      cursoId: 1, // Valor padrão temporário
      cr: 5.0, // Valor padrão temporário
      // Campos de upload
      historicoEscolarFileId: historicoEscolarFileId,
      comprovanteMatriculaFileId: comprovanteMatriculaFileId || undefined,
    };

    setAlunoMutation.mutate(alunoData, {
      onSuccess: () => {
        trpcUtils.onboarding.getStatus.setData(undefined, {
          pending: false,
          reason: undefined,
        });
        navigate({ to: '/home' });
      },
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

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Documentos</h2>

        <div>
          <Label htmlFor="historico">Histórico Escolar</Label>
          <div className="mt-2">
            <FileUploader
              entityType="historico_escolar"
              entityId={user?.id.toString() || '0'}
              onUploadComplete={(fileData) =>
                setHistoricoEscolarFileId(fileData.fileId)
              }
              allowedTypes={['application/pdf']}
              maxSizeInMB={5}
            />
          </div>
        </div>

        <div>
          <Label htmlFor="comprovante">Comprovante de Matrícula</Label>
          <div className="mt-2">
            <FileUploader
              entityType="comprovante_matricula"
              entityId={user?.id.toString() || '0'}
              onUploadComplete={(fileData) =>
                setComprovanteMatriculaFileId(fileData.fileId)
              }
              allowedTypes={['application/pdf']}
              maxSizeInMB={5}
            />
          </div>
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
  const [useNomeSocial, setUseNomeSocial] = useState(false);
  const { toast } = useToast();

  const form = useForm<ProfessorFormData>({
    resolver: zodResolver(professorSchema),
  });

  const mutation = trpc.professor.set.useMutation({
    onSuccess: async () => {
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

    mutation.mutate({
      nomeCompleto: values.nomeCompleto,
      cpf: values.cpf,
      matriculaSiape: values.matriculaSiape,
      nomeSocial: values.nomeSocial,
      emailInstitucional: user?.email || '',
      genero: 'OUTRO', // Default para simplificar
      regime: tipoRegime,
      departamentoId: 1, // Valor padrão temporário, deve ser ajustado conforme necessário
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

// Schema simplificado para aluno
const studentSchema = z.object({
  nomeCompleto: z.string().min(1, 'Nome completo é obrigatório'),
  nomeSocial: z.string().optional(),
  matricula: z.string().min(1, 'Matrícula é obrigatória'),
  cpf: z.string().min(1, 'CPF é obrigatório'),
});

// Schema simplificado para professor
const professorSchema = z.object({
  nomeCompleto: z.string().min(1, 'Nome completo é obrigatório'),
  nomeSocial: z.string().optional(),
  matriculaSiape: z.string().min(1, 'Matrícula SIAPE é obrigatória'),
  cpf: z.string().min(1, 'CPF é obrigatório'),
  regime: z.string().min(1, 'Regime é obrigatório'),
});

type StudentFormData = z.infer<typeof studentSchema>;
type ProfessorFormData = z.infer<typeof professorSchema>;
