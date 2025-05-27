import type { MonitoriaFormData } from '@/components/features/projects/MonitoriaFormTemplate';
import type {
  PDFPreviewState,
  PDFPreviewStatus,
  ProjetoFormData,
} from '@/components/features/projects/types';
import type { DepartamentoResponse } from '@/routes/api/department/-types';
import { useDebouncedValue } from '@tanstack/react-pacer';
import { FileText } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

interface UsePDFPreviewProps {
  formData: Partial<ProjetoFormData>;
  departamentos: DepartamentoResponse[] | undefined;
  disciplinasFiltradas: any[] | undefined;
  user: any;
}

export function usePDFPreview({
  formData,
  departamentos,
  disciplinasFiltradas,
  user,
}: UsePDFPreviewProps) {
  const [state, setState] = useState<PDFPreviewState>({
    isVisible: false,
    shouldRender: false,
    isUserTyping: false,
    isRendering: false,
  });

  const previewRef = useRef<HTMLDivElement>(null);

  // Increase debounce time to 1 second for better performance
  const [debouncedFormData] = useDebouncedValue(formData, { wait: 1000 });

  // Simple intersection observer to check if the preview is visible
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setState((prev) => ({ ...prev, isVisible: entry.isIntersecting }));
      },
      { threshold: 0.1, rootMargin: '50px' },
    );

    if (previewRef.current) {
      observer.observe(previewRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const departamento = departamentos?.find(
    (d) => d.id === debouncedFormData.departamentoId,
  );

  const disciplinasSelecionadas =
    disciplinasFiltradas?.filter((d) =>
      debouncedFormData.disciplinaIds?.includes(d.id),
    ) || [];

  const hasRequiredFields = !!(
    debouncedFormData.titulo &&
    debouncedFormData.descricao &&
    departamento
  );

  // Memoize template data to prevent unnecessary recalculations
  const templateData = useMemo((): MonitoriaFormData | null => {
    if (!hasRequiredFields) return null;

    return {
      titulo: debouncedFormData.titulo || '',
      descricao: debouncedFormData.descricao || '',
      departamento,
      coordenadorResponsavel: debouncedFormData.coordenadorResponsavel || '',
      ano: debouncedFormData.ano || new Date().getFullYear(),
      semestre: debouncedFormData.semestre || 'SEMESTRE_1',
      tipoProposicao: debouncedFormData.tipoProposicao || 'INDIVIDUAL',
      bolsasSolicitadas: debouncedFormData.bolsasSolicitadas || 0,
      voluntariosSolicitados: debouncedFormData.voluntariosSolicitados || 0,
      cargaHorariaSemana: debouncedFormData.cargaHorariaSemana || 4,
      numeroSemanas: debouncedFormData.numeroSemanas || 16,
      publicoAlvo: debouncedFormData.publicoAlvo || '',
      estimativaPessoasBenificiadas:
        debouncedFormData.estimativaPessoasBenificiadas,
      disciplinas: disciplinasSelecionadas.map((d) => ({
        id: d.id,
        codigo: d.codigo,
        nome: d.nome,
      })),
      user: {
        username: user?.username,
        email: user?.email,
      },
    };
  }, [
    debouncedFormData,
    departamento,
    disciplinasSelecionadas,
    user,
    hasRequiredFields,
  ]);

  // Helper to get status info for display
  const getStatusInfo = (): PDFPreviewStatus => {
    if (!hasRequiredFields) {
      return {
        icon: FileText,
        title: 'Preview do Formulário PDF',
        message:
          'Preencha os campos obrigatórios (Título, Descrição e Departamento) para habilitar o preview.',
        color: 'text-gray-500',
      };
    }

    return {
      icon: FileText,
      title: 'Preview Disponível',
      message: 'Clique em "Mostrar Preview" para visualizar o documento PDF.',
      color: 'text-green-600',
    };
  };

  // Determine if PDF should be shown based on required fields and visibility
  const shouldShowPDF = hasRequiredFields && state.isVisible;

  return {
    previewRef,
    state,
    templateData,
    statusInfo: getStatusInfo(),
    shouldShowPDF,
    hasRequiredFields,
  };
}
