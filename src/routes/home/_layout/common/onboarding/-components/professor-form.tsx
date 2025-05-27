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
import { useAuth } from '@/hooks/use-auth';
import { useFileUpload } from '@/hooks/use-files';
import { useSetProfessor } from '@/hooks/use-professor';
import { useToast } from '@/hooks/use-toast';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

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
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Arquivos obrigatórios para professor
  const [curriculumVitaeFile, setCurriculumVitaeFile] = useState<File | null>(
    null,
  );
  const [comprovanteVinculoFile, setComprovanteVinculoFile] =
    useState<File | null>(null);

  // Hooks
  const fileUploadMutation = useFileUpload();
  const setProfessorMutation = useSetProfessor();

  const form = useForm<ProfessorFormData>({
    resolver: zodResolver(professorSchema),
    defaultValues: {
      emailInstitucional: user?.email || '',
    },
  });

  const handleCurriculumFileSelect = (file: File | null) => {
    setCurriculumVitaeFile(file);
  };

  const handleComprovanteVinculoFileSelect = (file: File | null) => {
    setComprovanteVinculoFile(file);
  };

  const onSubmit = async (values: ProfessorFormData) => {
    if (!curriculumVitaeFile || !comprovanteVinculoFile) {
      toast({
        title: 'Documentos obrigatórios',
        description:
          'É necessário fazer upload do currículo e comprovante de vínculo',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Fazer upload dos arquivos e obter os IDs
      let curriculumId: string | null = null;
      let comprovanteId: string | null = null;

      // Upload do currículo (obrigatório)
      try {
        const response = await fileUploadMutation.mutateAsync({
          file: curriculumVitaeFile,
          entityType: 'curriculum_vitae',
          entityId: user?.id?.toString() || '0',
        });
        curriculumId = response.fileId;
      } catch (error: any) {
        toast({
          title: 'Erro no upload do currículo',
          description: error.message || 'Erro ao enviar o currículo vitae',
          variant: 'destructive',
        });
        setIsSubmitting(false);
        return;
      }

      // Upload do comprovante de vínculo (obrigatório)
      try {
        const response = await fileUploadMutation.mutateAsync({
          file: comprovanteVinculoFile,
          entityType: 'comprovante_vinculo',
          entityId: user?.id?.toString() || '0',
        });
        comprovanteId = response.fileId;
      } catch (error: any) {
        toast({
          title: 'Erro no upload do comprovante',
          description:
            error.message || 'Erro ao enviar o comprovante de vínculo',
          variant: 'destructive',
        });
        setIsSubmitting(false);
        return;
      }

      // 2. Enviar os dados do professor com os IDs dos arquivos
      if (!useNomeSocial) {
        values.nomeSocial = undefined;
      }

      const tipoRegime = values.regime as '20H' | '40H' | 'DE';

      await setProfessorMutation.mutateAsync({
        nomeCompleto: values.nomeCompleto,
        cpf: values.cpf,
        matriculaSiape: values.matriculaSiape,
        nomeSocial: values.nomeSocial,
        emailInstitucional: values.emailInstitucional,
        genero: 'OUTRO',
        regime: tipoRegime,
        departamentoId: 1,
        curriculumVitaeFileId: curriculumId!,
        comprovanteVinculoFileId: comprovanteId!,
      });

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

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Documentos Obrigatórios</h2>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <Label htmlFor="curriculum">
              Currículo Vitae <span className="text-red-500">*</span>
            </Label>
            <div className="mt-2">
              <div className="border border-dashed border-gray-300 p-4 rounded-md">
                <FileUploader
                  onFileSelect={handleCurriculumFileSelect}
                  selectedFile={curriculumVitaeFile}
                  allowedTypes={['application/pdf']}
                  maxSizeInMB={100}
                />
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                <span className="font-semibold">Documento obrigatório</span>{' '}
                (PDF, máx. 100MB)
              </p>
              {curriculumVitaeFile && (
                <p className="text-xs text-green-600 mt-1">
                  Arquivo selecionado com sucesso!
                </p>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="comprovante">
              Comprovante de Vínculo <span className="text-red-500">*</span>
            </Label>
            <div className="mt-2">
              <div className="border border-dashed border-gray-300 p-4 rounded-md">
                <FileUploader
                  onFileSelect={handleComprovanteVinculoFileSelect}
                  selectedFile={comprovanteVinculoFile}
                  allowedTypes={['application/pdf']}
                  maxSizeInMB={100}
                />
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                <span className="font-semibold">Documento obrigatório</span>{' '}
                (PDF, máx. 100MB)
              </p>
              {comprovanteVinculoFile && (
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
      {setProfessorMutation.error && (
        <p className="text-red-500 text-sm mt-2 text-center">
          Erro ao salvar: {setProfessorMutation.error.message}
        </p>
      )}
    </form>
  );
}
