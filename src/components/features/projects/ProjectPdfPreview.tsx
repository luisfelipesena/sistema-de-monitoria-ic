import { MonitoriaFormTemplate } from '@/components/features/projects/MonitoriaFormTemplate';
import { ProjetoFormData } from '@/components/features/projects/types';
import { Button } from '@/components/ui/button';
import { DisciplinaWithProfessor } from '@/hooks/use-disciplina';
import { usePDFPreview } from '@/hooks/use-pdf-preview';
import type { DepartamentoResponse } from '@/routes/api/department/-types';
import type { ProfessorResponse } from '@/routes/api/professor';
import { PDFViewer } from '@react-pdf/renderer';
import { User } from 'lucia';
import {
  AlertCircle,
  CheckCircle,
  Eye,
  EyeOff,
  FileText,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { useMemo, useState } from 'react';

interface ProjectPDFPreviewProps {
  formData: Partial<ProjetoFormData>;
  departamentos: DepartamentoResponse[] | undefined;
  disciplinasFiltradas: DisciplinaWithProfessor[] | undefined;
  user: User | null;
  professores?: ProfessorResponse[];
}

export const ProjectPDFPreview = function ProjectPDFPreviewComponent({
  formData,
  departamentos,
  disciplinasFiltradas,
  user,
  professores,
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
    professores,
  });

  // Simple state management
  const [showPreview, setShowPreview] = useState(false);
  const [pdfRenderKey, setPdfRenderKey] = useState(0);
  const [pdfData, setPdfData] = useState<typeof templateData | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // Activate preview with current form data
  const handleActivatePreview = () => {
    if (templateData && hasRequiredFields) {
      setPdfData(templateData);
      setPdfRenderKey((prev) => prev + 1);
      setShowPreview(true);
    }
  };

  // Hide preview and clear data
  const handleHidePreview = () => {
    setShowPreview(false);
    setPdfData(null);
  };

  // Update PDF with current form data
  const handleUpdatePdf = () => {
    if (templateData && hasRequiredFields) {
      setIsUpdating(true);
      setPdfData(templateData);
      setPdfRenderKey((prev) => prev + 1);

      // Small delay for UX feedback
      setTimeout(() => {
        setIsUpdating(false);
      }, 800);
    }
  };

  // Check if form has changes compared to displayed PDF
  const hasChanges = useMemo(() => {
    if (!pdfData || !templateData) return false;
    return JSON.stringify(pdfData) !== JSON.stringify(templateData);
  }, [pdfData, templateData]);

  // Memoized PDF component - only re-renders when key changes
  const memoizedPdfViewer = useMemo(() => {
    if (!pdfData || !showPreview) return null;

    return (
      <div
        key={pdfRenderKey}
        className="pdf-container h-[600px] w-full border rounded"
      >
        <PDFViewer
          width="100%"
          height="100%"
          showToolbar={false}
          style={{ border: 'none' }}
        >
          <MonitoriaFormTemplate data={pdfData} />
        </PDFViewer>
      </div>
    );
  }, [pdfRenderKey, pdfData, showPreview]);

  const renderContent = () => {
    // Fields missing
    if (!hasRequiredFields) {
      return (
        <div className="p-8 text-center">
          <AlertCircle className="mx-auto h-12 w-12 mb-4 text-orange-500" />
          <h4 className="text-lg font-medium text-gray-700 mb-2">
            {statusInfo.title}
          </h4>
          <p className="text-gray-500 text-sm mb-4">{statusInfo.message}</p>
          <div className="text-xs text-gray-400 bg-gray-50 p-3 rounded">
            <strong>Campos obrigatórios:</strong> Título, Descrição,
            Departamento, Disciplinas, Ano, Semestre, Tipo de Proposição, Carga
            Horária, Número de Semanas, Público Alvo
          </div>
        </div>
      );
    }

    // Preview not activated
    if (!showPreview) {
      return (
        <div className="p-8 text-center">
          <FileText className="mx-auto h-12 w-12 text-blue-400 mb-4" />
          <h4 className="text-lg font-medium text-blue-700 mb-2">
            Preview PDF Disponível
          </h4>
          <p className="text-blue-600 text-sm mb-4">
            Clique para gerar o PDF com os dados atuais do formulário. O PDF não
            será atualizado automaticamente.
          </p>
          <Button onClick={handleActivatePreview}>
            <Eye className="h-4 w-4 mr-2" />
            Gerar Preview
          </Button>
        </div>
      );
    }

    // Show PDF or updating state
    if (isUpdating) {
      return (
        <div className="h-[600px] w-full flex items-center justify-center bg-blue-50 border rounded-md">
          <div className="text-center">
            <Loader2 className="mx-auto h-12 w-12 text-blue-600 mb-4 animate-spin" />
            <h4 className="text-lg font-medium text-blue-700 mb-2">
              Atualizando PDF
            </h4>
            <p className="text-blue-600 text-sm">
              Aguarde enquanto o documento é atualizado...
            </p>
          </div>
        </div>
      );
    }

    return memoizedPdfViewer;
  };

  return (
    <div ref={previewRef} className="border rounded-lg bg-white shadow-sm">
      {/* Header */}
      <div className="bg-blue-50 border-b px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {hasRequiredFields ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <AlertCircle className="h-4 w-4 text-orange-500" />
            )}
            <span className="text-sm font-medium">
              {hasRequiredFields ? 'Preview Disponível' : 'Campos Pendentes'}
            </span>

            {showPreview && hasChanges && !isUpdating && (
              <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded border border-orange-300">
                📝 Formulário foi alterado
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {showPreview && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleHidePreview}
                className="text-gray-600 border-gray-300"
              >
                <EyeOff className="h-3 w-3 mr-1" />
                Ocultar
              </Button>
            )}

            {showPreview && hasRequiredFields && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleUpdatePdf}
                disabled={isUpdating}
                className={
                  hasChanges
                    ? 'text-orange-700 border-orange-400 bg-orange-50 font-medium'
                    : 'text-blue-600 border-blue-300'
                }
              >
                {isUpdating ? (
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                ) : (
                  <RefreshCw className="h-3 w-3 mr-1" />
                )}
                {hasChanges ? 'Atualizar PDF' : 'Atualizar'}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-2">{renderContent()}</div>
    </div>
  );
};
