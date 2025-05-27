import { ProjectPDFPreview } from '@/components/features/projects/ProjectPdfPreview';
import { ProjetoFormData } from '@/components/features/projects/types';
import { PagesLayout } from '@/components/layout/PagesLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form } from '@/components/ui/form';
import { useProjectForm } from '@/hooks/use-project-form';
import { useCreateProjeto } from '@/hooks/use-projeto';
import { useNavigate } from '@tanstack/react-router';
import { FileText, Loader2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { ProjectIdentificationSection } from './ProjectIdentificationSection';
import { ProjectVacanciesSection } from './ProjectVacanciesSection';

export function ProjectForm() {
  const {
    user,
    departamentos,
    professores,
    disciplinasFiltradas,
    formData,
    form,
    register,
    control,
    watch,
    setValue,
    errors,
    departamentoSelecionado,
    loadingDisciplinas,
    isLoading,
    hasNoData,
    createTemplateData,
    handleFormSubmit,
  } = useProjectForm();

  const createProjetoMutation = useCreateProjeto();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  const watchedDisciplinaIds = watch('disciplinaIds') || [];

  // Verificar se todos os campos obrigatórios estão preenchidos
  const isFormValid = useMemo(() => {
    // Verificar todos os campos obrigatórios
    const requiredFields: Array<keyof ProjetoFormData> = [
      'titulo',
      'descricao',
      'departamentoId',
      'disciplinaIds',
      'ano',
      'semestre',
      'tipoProposicao',
      'cargaHorariaSemana',
      'numeroSemanas',
      'publicoAlvo',
    ];

    // Verificar se todos os campos obrigatórios estão preenchidos
    return requiredFields.every((field) => {
      const value = formData[field];
      if (value === undefined || value === null) return false;
      if (Array.isArray(value)) return value.length > 0;
      if (typeof value === 'string') return value.trim() !== '';
      return true;
    });
  }, [formData]);

  const templateData = createTemplateData();

  const handleSaveDraft = async () => {
    try {
      setSubmitting(true);

      // Apply automatic professor assignment logic for admin users
      if (user?.role === 'admin' && formData.disciplinaIds?.length > 0) {
        const disciplina = disciplinasFiltradas?.find(
          (d) => d.id === formData.disciplinaIds[0],
        );

        if (disciplina && disciplina.professorResponsavel) {
          const professor = professores?.find(
            (p) => p.nomeCompleto === disciplina.professorResponsavel,
          );

          if (professor) {
            setValue('professorResponsavelId', professor.id);
          }
        }
      }

      // Ensure the professorResponsavelId is set if required
      const dataToSubmit = { ...formData };

      // For professors, use their own ID
      if (user?.role === 'professor' && !dataToSubmit.professorResponsavelId) {
        // Find the professor by comparing with their username
        const professor = professores?.find(
          (p) => p.nomeCompleto === user.username,
        );
        if (professor) {
          dataToSubmit.professorResponsavelId = professor.id;
        }
      }

      // Save the project after a short delay to ensure all values are set
      setTimeout(async () => {
        try {
          const result = await createProjetoMutation.mutateAsync(
            dataToSubmit as any,
          );
          toast.success('Rascunho do projeto salvo com sucesso!');
          navigate({ to: '/home' });
        } catch (error) {
          console.error('Error saving draft:', error);
          toast.error('Erro ao salvar o rascunho do projeto');
        } finally {
          setSubmitting(false);
        }
      }, 100);
    } catch (error) {
      console.error('Error in save draft process:', error);
      toast.error('Erro ao processar o formulário');
      setSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <PagesLayout title="Novo Projeto de Monitoria">
        <div className="flex justify-center items-center py-8">
          <div className="text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-600 mb-4" />
            <p className="mt-2">Carregando dados necessários...</p>
          </div>
        </div>
      </PagesLayout>
    );
  }

  if (hasNoData) {
    return (
      <PagesLayout title="Novo Projeto de Monitoria">
        <div className="text-center py-12 border rounded-md bg-muted/20">
          <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">
            Dados necessários não encontrados
          </h3>
          <p className="text-muted-foreground mb-4">
            Para criar projetos de monitoria, é necessário ter departamentos
            cadastrados no sistema.
          </p>
        </div>
      </PagesLayout>
    );
  }

  return (
    <PagesLayout
      title="Novo projeto de monitoria"
      subtitle="Formulário para criação de projeto de monitoria - rascunho"
    >
      <div className="mx-auto space-y-6">
        <Form {...form}>
          <form className="space-y-6">
            <ProjectIdentificationSection
              register={register}
              control={control}
              setValue={setValue}
              watch={watch}
              errors={errors}
              departamentos={departamentos}
              professores={professores}
              disciplinasFiltradas={disciplinasFiltradas}
              departamentoSelecionado={departamentoSelecionado}
              loadingDisciplinas={loadingDisciplinas}
              user={user}
              watchedDisciplinaIds={watchedDisciplinaIds}
              isAdminForm={user?.role === 'admin'}
            />

            <ProjectVacanciesSection
              register={register}
              control={control}
              errors={errors}
            />
          </form>
        </Form>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Preview do Formulário
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ProjectPDFPreview
              formData={formData}
              departamentos={departamentos}
              disciplinasFiltradas={disciplinasFiltradas}
              user={user}
            />
          </CardContent>
        </Card>

        <div className="flex justify-center pt-4">
          {isFormValid && templateData ? (
            <Button
              onClick={handleSaveDraft}
              disabled={submitting}
              className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-blue-600 text-white hover:bg-blue-700 h-11 px-8 py-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4 mr-2" />
                  Salvar Rascunho
                </>
              )}
            </Button>
          ) : (
            <Button
              type="button"
              size="lg"
              disabled
              className="bg-gray-400 text-white px-8 cursor-not-allowed"
            >
              <FileText className="h-4 w-4 mr-2" />
              {templateData
                ? 'Preencha os campos obrigatórios'
                : 'Dados incompletos'}
            </Button>
          )}
        </div>
      </div>
    </PagesLayout>
  );
}
