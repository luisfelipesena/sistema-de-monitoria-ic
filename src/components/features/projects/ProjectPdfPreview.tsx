import { MonitoriaFormTemplate } from '@/components/features/projects/MonitoriaFormTemplate';
import { ProjetoFormData } from '@/components/features/projects/types';
import { Button } from '@/components/ui/button';
import { DisciplinaWithProfessor } from '@/hooks/use-disciplina';
import { usePDFPreview } from '@/hooks/use-pdf-preview';
import type { DepartamentoResponse } from '@/routes/api/department/-types';
import { User } from 'lucia';
import { Eye, EyeOff, FileText } from 'lucide-react';
import { memo, Suspense, useMemo, useState } from 'react';

interface ProjectPDFPreviewProps {
  formData: Partial<ProjetoFormData>;
  departamentos: DepartamentoResponse[] | undefined;
  disciplinasFiltradas: DisciplinaWithProfessor[] | undefined;
  user: User | null;
}

// Use memo para evitar re-renders desnecessários do componente inteiro
export const ProjectPDFPreview = memo(
  function ProjectPDFPreviewComponent({
    formData,
    departamentos,
    disciplinasFiltradas,
    user,
  }: ProjectPDFPreviewProps) {
    const {
      previewRef,
      templateData,
      statusInfo,
      shouldShowPDF,
      hasRequiredFields,
    } = usePDFPreview({
      formData,
      departamentos,
      disciplinasFiltradas,
      user,
    });

    // Add state to manually control PDF rendering
    const [showPreview, setShowPreview] = useState(false);

    // Compute if PDF should be displayed based on form validity and user preference
    const shouldRenderPDF = shouldShowPDF && showPreview && hasRequiredFields;

    // Memoize o PDF Viewer para evitar re-renders desnecessários
    const MemoizedPDFViewer = useMemo(() => {
      if (!shouldRenderPDF || !templateData) return null;

      return (
        <Suspense
          fallback={
            <div className="h-[600px] w-full flex items-center justify-center bg-gray-50 border rounded-md">
              <div className="text-center">
                <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-500">
                  Carregando visualização do PDF...
                </p>
              </div>
            </div>
          }
        >
          <MonitoriaFormTemplate data={templateData} />
        </Suspense>
      );
      // Adicionar todas as dependências que podem causar mudança no PDF
    }, [shouldRenderPDF, templateData]);

    return (
      <div ref={previewRef} className="border rounded-lg bg-white shadow-sm">
        <div className="bg-blue-50 border-b px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`flex items-center gap-2 ${statusInfo.color}`}>
                <statusInfo.icon
                  className={`h-4 w-4 ${statusInfo.spinning ? 'animate-spin' : ''}`}
                />
                <span className="text-sm font-medium">{statusInfo.title}</span>
              </div>
            </div>
            {hasRequiredFields && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPreview(!showPreview)}
                className="text-gray-500 hover:text-gray-700"
              >
                {showPreview ? (
                  <>
                    <EyeOff className="h-4 w-4 mr-1" />
                    Ocultar Preview
                  </>
                ) : (
                  <>
                    <Eye className="h-4 w-4 mr-1" />
                    Mostrar Preview
                  </>
                )}
              </Button>
            )}
          </div>
        </div>

        <div className="p-2">
          {!shouldShowPDF || !showPreview ? (
            <div className="p-8 text-center">
              {!hasRequiredFields ? (
                <>
                  <statusInfo.icon
                    className={`mx-auto h-12 w-12 mb-4 ${statusInfo.color} ${
                      statusInfo.spinning ? 'animate-spin' : ''
                    }`}
                  />
                  <h4 className="text-lg font-medium text-gray-700 mb-2">
                    {statusInfo.title}
                  </h4>
                  <p className="text-gray-500 text-sm">{statusInfo.message}</p>
                </>
              ) : !showPreview ? (
                <>
                  <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h4 className="text-lg font-medium text-gray-700 mb-2">
                    Preview Desativado
                  </h4>
                  <p className="text-gray-500 text-sm">
                    Clique em "Mostrar Preview" para visualizar o documento PDF.
                  </p>
                </>
              ) : (
                <statusInfo.icon
                  className={`mx-auto h-12 w-12 mb-4 ${statusInfo.color} ${
                    statusInfo.spinning ? 'animate-spin' : ''
                  }`}
                />
              )}
            </div>
          ) : (
            MemoizedPDFViewer
          )}
        </div>
      </div>
    );
  },
  // Função de comparação personalizada para evitar re-renders desnecessários
  (prevProps, nextProps) => {
    // Verificar se as disciplinas ou departamentos mudaram
    if (
      prevProps.disciplinasFiltradas !== nextProps.disciplinasFiltradas ||
      prevProps.departamentos !== nextProps.departamentos ||
      prevProps.user !== nextProps.user
    ) {
      return false;
    }

    // Comparação simplificada dos dados do formulário
    const prevFormData = prevProps.formData || {};
    const nextFormData = nextProps.formData || {};

    // Verificar se as propriedades principais mudaram
    const keysToCheck = [
      'titulo',
      'descricao',
      'departamentoId',
      'disciplinaIds',
      'professorResponsavelId',
      'ano',
      'semestre',
      'tipoProposicao',
      'bolsasSolicitadas',
      'voluntariosSolicitados',
      'cargaHorariaSemana',
      'numeroSemanas',
      'publicoAlvo',
      'estimativaPessoasBenificiadas',
    ] as Array<keyof ProjetoFormData>;

    return keysToCheck.every((key) => prevFormData[key] === nextFormData[key]);
  },
);
