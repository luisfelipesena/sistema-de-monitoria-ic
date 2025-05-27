import type { MonitoriaFormData } from '@/components/features/projects/MonitoriaFormTemplate';
import type { ProjetoFormData } from '@/components/features/projects/types';
import type { DepartamentoResponse } from '@/routes/api/department/-types';
import { useMemo, useRef } from 'react';

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
  const previewRef = useRef<HTMLDivElement>(null);

  const departamento = useMemo(() => {
    return departamentos?.find((d) => d.id === formData.departamentoId);
  }, [departamentos, formData.departamentoId]);

  const disciplinasSelecionadas = useMemo(() => {
    if (!disciplinasFiltradas || !formData.disciplinaIds) return [];
    return disciplinasFiltradas.filter((d) =>
      formData.disciplinaIds?.includes(d.id),
    );
  }, [disciplinasFiltradas, formData.disciplinaIds]);

  const hasRequiredFields = useMemo(() => {
    return !!(
      formData.titulo &&
      formData.descricao &&
      departamento &&
      formData.disciplinaIds?.length &&
      formData.ano &&
      formData.semestre &&
      formData.tipoProposicao &&
      formData.cargaHorariaSemana &&
      formData.numeroSemanas &&
      formData.publicoAlvo
    );
  }, [
    formData.titulo,
    formData.descricao,
    departamento,
    formData.disciplinaIds,
    formData.ano,
    formData.semestre,
    formData.tipoProposicao,
    formData.cargaHorariaSemana,
    formData.numeroSemanas,
    formData.publicoAlvo,
  ]);

  const templateData = useMemo((): MonitoriaFormData | null => {
    if (!hasRequiredFields) return null;

    return {
      titulo: formData.titulo || '',
      descricao: formData.descricao || '',
      departamento,
      coordenadorResponsavel: formData.coordenadorResponsavel || '',
      ano: formData.ano || new Date().getFullYear(),
      semestre: formData.semestre || 'SEMESTRE_1',
      tipoProposicao: formData.tipoProposicao || 'INDIVIDUAL',
      bolsasSolicitadas: formData.bolsasSolicitadas || 0,
      voluntariosSolicitados: formData.voluntariosSolicitados || 0,
      cargaHorariaSemana: formData.cargaHorariaSemana || 4,
      numeroSemanas: formData.numeroSemanas || 16,
      publicoAlvo: formData.publicoAlvo || '',
      estimativaPessoasBenificiadas: formData.estimativaPessoasBenificiadas,
      disciplinas: disciplinasSelecionadas.map((d) => ({
        id: d.id,
        codigo: d.codigo,
        nome: d.nome,
      })),
      user: {
        username: user?.username,
        email: user?.email,
        nomeCompleto: user?.nomeCompleto,
        role: user?.role,
      },
    };
  }, [
    hasRequiredFields,
    formData.titulo,
    formData.descricao,
    departamento,
    formData.coordenadorResponsavel,
    formData.ano,
    formData.semestre,
    formData.tipoProposicao,
    formData.bolsasSolicitadas,
    formData.voluntariosSolicitados,
    formData.cargaHorariaSemana,
    formData.numeroSemanas,
    formData.publicoAlvo,
    formData.estimativaPessoasBenificiadas,
    disciplinasSelecionadas,
    user?.username,
    user?.email,
    user?.nomeCompleto,
    user?.role,
  ]);

  const shouldShowPDF = hasRequiredFields;

  const statusInfo = useMemo(() => {
    if (!hasRequiredFields) {
      return {
        title: 'Campos Obrigatórios Pendentes',
        message:
          'Preencha todos os campos obrigatórios para visualizar o documento PDF.',
        color: 'text-orange-500',
      };
    }

    return {
      title: 'Preview Disponível',
      message: 'Documento PDF pronto para visualização.',
      color: 'text-green-600',
    };
  }, [hasRequiredFields]);

  return {
    previewRef,
    templateData,
    statusInfo,
    shouldShowPDF,
    hasRequiredFields,
  };
}
