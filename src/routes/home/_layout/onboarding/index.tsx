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
import { Spinner } from '@/components/ui/spinner';
import { useSetAluno } from '@/hooks/use-aluno';
import { useAuth } from '@/hooks/use-auth';
import { useCursos } from '@/hooks/use-curso';
import { useFileUpload } from '@/hooks/use-files';
import { useOnboardingStatus } from '@/hooks/use-onboarding';
import { useToast } from '@/hooks/use-toast';
import { AlunoInput, alunoInputSchema } from '@/routes/api/aluno/-types';
import { apiClient } from '@/utils/api-client';
import { logger } from '@/utils/logger';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
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

  // Verificar se o usuário precisa de onboarding usando nosso novo hook
  const { data: onboardingStatus, isLoading: statusLoading } =
    useOnboardingStatus();

  // Quando o status estiver disponível, redirecionar se não for necessário onboarding
  useEffect(() => {
    if (!authLoading && !statusLoading && onboardingStatus) {
      if (!onboardingStatus.pending) {
        navigate({ to: '/home' });
      }
    }
  }, [onboardingStatus, authLoading, statusLoading]);

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

function StudentForm() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [useNomeSocial, setUseNomeSocial] = useState(false);
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Estado dos arquivos
  const [historicoEscolarFile, setHistoricoEscolarFile] = useState<File | null>(
    null,
  );
  const [comprovanteMatriculaFile, setComprovanteMatriculaFile] =
    useState<File | null>(null);
  const [historicoEscolarFileId, setHistoricoEscolarFileId] = useState<
    string | null
  >(null);
  const [comprovanteMatriculaFileId, setComprovanteMatriculaFileId] = useState<
    string | null
  >(null);

  // Buscar a lista de cursos
  const { data: cursos, isLoading: cursosLoading } = useCursos();

  // Hooks para upload de arquivos e salvar aluno
  const fileUploadMutation = useFileUpload();
  const setAlunoMutation = useSetAluno();

  const form = useForm<AlunoInput>({
    resolver: zodResolver(alunoInputSchema),
    defaultValues: {
      emailInstitucional: user?.email || '',
      genero: 'OUTRO', // TODO: Ver q porra eh isso
    },
  });

  const handleHistoricoFileSelect = (file: File | null) => {
    setHistoricoEscolarFile(file);
    // Limpar o ID se o arquivo for alterado ou removido
    if (file === null) {
      setHistoricoEscolarFileId(null);
    }
  };

  const handleComprovanteFileSelect = (file: File | null) => {
    setComprovanteMatriculaFile(file);
    // Limpar o ID se o arquivo for alterado ou removido
    if (file === null) {
      setComprovanteMatriculaFileId(null);
    }
  };

  const onSubmit = form.handleSubmit(async (values) => {
    // Validar se o histórico escolar está presente
    console.log({ historicoEscolarFile, values });
    if (!historicoEscolarFile) {
      toast({
        title: 'Documento obrigatório',
        description: 'É necessário fazer upload do histórico escolar',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Fazer upload dos arquivos e obter os IDs
      let historicoId = null;
      let comprovanteId = null;

      // Upload do histórico escolar
      try {
        const response = await fileUploadMutation.mutateAsync({
          file: historicoEscolarFile,
          entityType: 'historico_escolar',
          entityId: user?.id?.toString() || '0',
        });
        historicoId = response.fileId;
        setHistoricoEscolarFileId(response.fileId);
      } catch (error: any) {
        toast({
          title: 'Erro no upload do histórico',
          description: error.message || 'Erro ao enviar o histórico escolar',
          variant: 'destructive',
        });
        setIsSubmitting(false);
        return;
      }

      // Upload do comprovante de matrícula (se fornecido)
      if (comprovanteMatriculaFile) {
        try {
          const response = await fileUploadMutation.mutateAsync({
            file: comprovanteMatriculaFile,
            entityType: 'comprovante_matricula',
            entityId: user?.id?.toString() || '0',
          });
          comprovanteId = response.fileId;
          setComprovanteMatriculaFileId(response.fileId);
        } catch (error: any) {
          toast({
            title: 'Erro no upload do comprovante',
            description:
              error.message || 'Erro ao enviar o comprovante de matrícula',
            variant: 'destructive',
          });
          setIsSubmitting(false);
          return;
        }
      }

      // 2. Enviar os dados do aluno com os IDs dos arquivos
      const alunoData: AlunoInput = {
        ...values,
        historicoEscolarFileId: historicoId || undefined,
        comprovanteMatriculaFileId: comprovanteId || undefined,
      };

      if (!useNomeSocial) {
        alunoData.nomeSocial = undefined;
      }

      await setAlunoMutation.mutateAsync(alunoData);

      toast({
        title: 'Cadastro realizado com sucesso!',
      });

      navigate({ to: '/home' });
    } catch (error: any) {
      toast({
        title: 'Erro ao salvar',
        description: error.message || 'Ocorreu um erro ao salvar os dados',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  });

  return (
    <form onSubmit={onSubmit} className="space-y-6">
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

          <div>
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
                <SelectValue placeholder="Selecione seu curso" />
              </SelectTrigger>
              <SelectContent>
                {cursos?.map((curso) => (
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
            <Label htmlFor="cr">CR (Coeficiente de Rendimento)</Label>
            <Input
              id="cr"
              type="number"
              step="0.1"
              min="0"
              max="10"
              {...form.register('cr', { valueAsNumber: true })}
              className={form.formState.errors.cr ? 'border-red-500' : ''}
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

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <Label htmlFor="historico">
              Histórico Escolar <span className="text-red-500">*</span>
            </Label>
            <div className="mt-2">
              <div className="border border-dashed border-gray-300 p-4 rounded-md">
                <FileUploader
                  onFileSelect={handleHistoricoFileSelect}
                  selectedFile={historicoEscolarFile}
                  allowedTypes={['application/pdf']}
                  maxSizeInMB={100}
                />
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                <span className="font-semibold">Documento obrigatório</span>{' '}
                (PDF, máx. 100MB)
              </p>
              {historicoEscolarFile && (
                <p className="text-xs text-green-600 mt-1">
                  Arquivo selecionado com sucesso!
                </p>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="comprovante">
              Comprovante de Matrícula{' '}
              <span className="text-muted-foreground">(opcional)</span>
            </Label>
            <div className="mt-2">
              <div className="border border-dashed border-gray-300 p-4 rounded-md">
                <FileUploader
                  onFileSelect={handleComprovanteFileSelect}
                  selectedFile={comprovanteMatriculaFile}
                  allowedTypes={['application/pdf']}
                  maxSizeInMB={100}
                />
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Documento opcional (PDF, máx. 100MB)
              </p>
              {comprovanteMatriculaFile && (
                <p className="text-xs text-green-600 mt-1">
                  Arquivo selecionado com sucesso!
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="pt-4">
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <Spinner /> Salvando...
            </span>
          ) : (
            'Concluir Cadastro'
          )}
        </Button>
        <p className="text-xs text-center text-muted-foreground mt-2">
          Ao clicar em Concluir Cadastro, seus arquivos serão enviados
          automaticamente.
        </p>
      </div>
      {setAlunoMutation.error && (
        <p className="text-red-500 text-sm mt-2 text-center">
          Erro ao salvar: {setAlunoMutation.error.message}
        </p>
      )}
    </form>
  );
}

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

function ProfessorForm() {
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
          {professorMutation.isPending ? 'Salvando...' : 'Concluir Cadastro'}
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
