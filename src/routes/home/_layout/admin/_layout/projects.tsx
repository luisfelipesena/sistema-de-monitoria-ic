'use client';

import { PagesLayout } from '@/components/layout/PagesLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useAuth } from '@/hooks/use-auth';
import { useDepartamentoList } from '@/hooks/use-departamento';
import { useDisciplinas } from '@/hooks/use-disciplina';
import { useProfessores } from '@/hooks/use-professor';
import {
  useCreateProjeto,
  useDeleteProjeto,
  useNotifyProfessorSigning,
  useProjeto,
  useProjetos,
  useSubmitProjeto,
  useUpdateProjeto,
  useUploadProjetoDocument,
} from '@/hooks/use-projeto';
import { DepartamentoResponse } from '@/routes/api/department/-types';
import { ProjetoListItem } from '@/routes/api/projeto/-types';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Document,
  Page,
  StyleSheet as PDFStyleSheet,
  PDFViewer,
  Text,
  View,
} from '@react-pdf/renderer';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import {
  Edit,
  Eye,
  FileText,
  PlusCircle,
  Target,
  Trash2,
  Users,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import * as z from 'zod';
import { Route as AnalisarProjetoRoute } from '../../admin/_layout/$project/index';

export const Route = createFileRoute('/home/_layout/admin/_layout/projects')({
  component: ProjectsComponent,
});

const projetoFormSchema = z.object({
  titulo: z.string().min(1, 'Título é obrigatório'),
  descricao: z.string().min(10, 'Descrição deve ter pelo menos 10 caracteres'),
  departamentoId: z.number().min(1, 'Departamento é obrigatório'),
  professorResponsavelId: z
    .number({
      required_error:
        'Professor responsável é obrigatório para administradores.',
      invalid_type_error: 'Professor responsável deve ser um ID numérico.',
    })
    .min(1, 'Professor responsável é obrigatório'),
  ano: z.number().min(2024, 'Ano deve ser válido'),
  semestre: z.enum(['SEMESTRE_1', 'SEMESTRE_2'], {
    required_error: 'Semestre é obrigatório',
  }),
  tipoProposicao: z.enum(['INDIVIDUAL', 'COLETIVA'], {
    required_error: 'Tipo de proposição é obrigatório',
  }),
  bolsasSolicitadas: z.number().min(0, 'Número de bolsas deve ser positivo'),
  voluntariosSolicitados: z
    .number()
    .min(0, 'Número de voluntários deve ser positivo'),
  cargaHorariaSemana: z.number().min(1, 'Carga horária semanal é obrigatória'),
  numeroSemanas: z.number().min(1, 'Número de semanas é obrigatório'),
  publicoAlvo: z.string().min(1, 'Público alvo é obrigatório'),
  estimativaPessoasBenificiadas: z.number().optional(),
  disciplinaIds: z
    .array(z.number())
    .min(1, 'Pelo menos uma disciplina deve ser selecionada'),
  professoresParticipantesIds: z.array(z.number()).optional(),
  // atividades: z.array(z.string()).optional(), // TODO: Add if/when UI is ready for atividades
});

export type ProjetoFormData = z.infer<typeof projetoFormSchema>;

// PDF Preview Component
const ProjetoPDFPreview = ({
  formData,
  departamentos,
  disciplinasFiltradas,
  user,
}: {
  formData: Partial<ProjetoFormData>;
  departamentos: DepartamentoResponse[] | undefined;
  disciplinasFiltradas: any[] | undefined; // Replace 'any' with actual type if available
  user: any; // Replace 'any' with actual user type
}) => {
  const departamento = departamentos?.find(
    (d) => d.id === formData.departamentoId,
  );
  const disciplinasSelecionadas =
    disciplinasFiltradas?.filter((d) =>
      formData.disciplinaIds?.includes(d.id),
    ) || [];
  const semestreLabel =
    formData.ano && formData.semestre
      ? `${formData.ano}.${formData.semestre === 'SEMESTRE_1' ? 1 : 2}`
      : '';
  const tipoProposicaoLabel =
    formData.tipoProposicao === 'INDIVIDUAL' ? 'Individual' : 'Coletiva';
  const disciplinasText = disciplinasSelecionadas
    .map((d) => `${d.codigo} - ${d.nome}`)
    .join(', \n');

  // Define styles for react-pdf
  // Font.register({ family: 'Roboto', src: '/fonts/Roboto-Regular.ttf' }); // Example for custom font
  const styles = PDFStyleSheet.create({
    page: {
      flexDirection: 'column',
      backgroundColor: '#FFFFFF',
      padding: 30, // Standard A4 padding
      fontSize: 10,
      // fontFamily: 'Roboto', // Use registered font
      fontFamily: 'Helvetica',
    },
    header: {
      textAlign: 'center',
      marginBottom: 20,
      fontSize: 9,
    },
    headerBold: {
      fontWeight: 'bold',
      fontFamily: 'Helvetica-Bold',
    },
    title: {
      fontSize: 12,
      fontWeight: 'bold',
      fontFamily: 'Helvetica-Bold',
      textAlign: 'center',
      margin: '15px 0',
    },
    section: {
      border: '1px solid #000',
      marginBottom: 8,
    },
    sectionHeader: {
      backgroundColor: '#E0E0E0', // Light grey
      fontWeight: 'bold',
      fontFamily: 'Helvetica-Bold',
      padding: 4,
      fontSize: 9,
      borderBottom: '1px solid #000',
    },
    formRow: {
      borderBottom: '0.5px solid #DDD',
      padding: '3px 4px',
      minHeight: 16, // Adjusted minHeight
      flexDirection: 'row',
      alignItems: 'center',
    },
    formRowLast: {
      borderBottom: 'none',
      padding: '3px 4px',
      minHeight: 16,
      flexDirection: 'row',
      alignItems: 'center',
    },
    fieldLabel: {
      fontWeight: 'bold',
      fontFamily: 'Helvetica-Bold',
      marginRight: 5,
      width: '30%', // Allocate space for labels
    },
    fieldValue: {
      flex: 1,
      fontFamily: 'Helvetica',
    },
    descriptionBox: {
      minHeight: 80, // Adjusted minHeight
      padding: 8,
      border: '1px solid #000',
      margin: '8px 0',
      fontFamily: 'Helvetica',
    },
    // Add more styles as needed
  });

  // Return null or a placeholder if essential data for preview is missing
  if (!formData.titulo) {
    // Basic check, can be expanded
    return (
      <div className="p-4 border rounded-md bg-gray-50 text-gray-500 text-center">
        Preencha os campos do formulário para visualizar o PDF.
      </div>
    );
  }

  return (
    <PDFViewer
      style={{ width: '100%', height: '700px', border: '1px solid #ccc' }}
    >
      <Document>
        <Page size="A4" style={styles.page}>
          <View style={styles.header}>
            <Text style={styles.headerBold}>
              UNIVERSIDADE FEDERAL DA BAHIA{'\n'}
              Pró - Reitoria de Ensino de Graduação{'\n'}
              Coordenação Acadêmica de Graduação
            </Text>
          </View>

          <Text style={styles.title}>
            ANEXO I – FORMULÁRIO PARA SUBMISSÃO DE PROJETO DE MONITORIA
          </Text>

          <View style={styles.section}>
            <Text style={styles.sectionHeader}>
              1. IDENTIFICAÇÃO DO PROJETO
            </Text>
            <View style={styles.formRow}>
              <Text style={styles.fieldLabel}>1.1 Unidade Universitária:</Text>
              <Text style={styles.fieldValue}>Instituto de Computação</Text>
            </View>
            <View style={styles.formRow}>
              <Text style={styles.fieldLabel}>1.2 Órgão responsável:</Text>
              <Text style={styles.fieldValue}>{departamento?.nome || ''}</Text>
            </View>
            <View style={styles.formRow}>
              <Text style={styles.fieldLabel}>1.3 Título:</Text>
              <Text style={styles.fieldValue}>{formData.titulo || ''}</Text>
            </View>
            <View style={styles.formRow}>
              <Text style={styles.fieldLabel}>
                1.4 Componente(s) curricular(es):
              </Text>
              <Text style={styles.fieldValue}>{disciplinasText || ''}</Text>
            </View>
            <View style={styles.formRow}>
              <Text style={styles.fieldLabel}>1.5 Semestre:</Text>
              <Text style={styles.fieldValue}>{semestreLabel}</Text>
            </View>
            <View style={styles.formRow}>
              <Text style={styles.fieldLabel}>1.6 Proposição:</Text>
              <Text style={styles.fieldValue}>{tipoProposicaoLabel}</Text>
            </View>
            <View style={styles.formRow}>
              <Text style={styles.fieldLabel}>1.7 Número de monitores:</Text>
              <Text style={styles.fieldValue}>
                {(formData.bolsasSolicitadas || 0) +
                  (formData.voluntariosSolicitados || 0)}
              </Text>
            </View>
            <View style={styles.formRow}>
              <Text style={styles.fieldLabel}>1.8 Carga horária semanal:</Text>
              <Text style={styles.fieldValue}>
                {formData.cargaHorariaSemana || 0}h
              </Text>
            </View>
            <View style={styles.formRow}>
              <Text style={styles.fieldLabel}>1.9 Carga horária total:</Text>
              <Text style={styles.fieldValue}>
                {(formData.cargaHorariaSemana || 0) *
                  (formData.numeroSemanas || 0)}
                h
              </Text>
            </View>
            <View style={styles.formRow}>
              <Text style={styles.fieldLabel}>1.10 Público-alvo:</Text>
              <Text style={styles.fieldValue}>
                {formData.publicoAlvo || ''}
              </Text>
            </View>
            <View style={styles.formRowLast}>
              <Text style={styles.fieldLabel}>
                1.11 Estimativa de beneficiados:
              </Text>
              <Text style={styles.fieldValue}>
                {formData.estimativaPessoasBenificiadas || ''}
              </Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionHeader}>
              2. DADOS DO PROFESSOR RESPONSÁVEL
            </Text>
            <View style={{ padding: 5 }}>
              <Text>Nome: {user?.username || ''}</Text>
              <Text>E-mail: {user?.email || ''}</Text>
              {/* TODO: Add other professor details if needed, e.g., SIAPE, department */}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionHeader}>3. DESCRIÇÃO DO PROJETO</Text>
            <View style={styles.descriptionBox}>
              <Text>{formData.descricao || ''}</Text>
            </View>
          </View>

          {/* TODO: Add other sections from the PDF template if necessary 
          (e.g., Objetivos, Metodologia, Plano de Atividades, Cronograma, Avaliação) 
          These might need new fields in projetoFormSchema and passed via formData 
          Example: 
          <View style={styles.section}>
            <Text style={styles.sectionHeader}>4. OBJETIVOS</Text>
            <View style={styles.descriptionBox}><Text>{formData.objetivos || ''}</Text></View>
          </View>
          */}
        </Page>
      </Document>
    </PDFViewer>
  );
};

function ProjectsComponent() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: departamentos, isLoading: loadingDepartamentos } =
    useDepartamentoList();
  const { data: professores, isLoading: loadingProfessores } = useProfessores();

  // State management
  const [savedProjetoId, setSavedProjetoId] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'create' | 'edit'>(
    user?.role === 'admin' ? 'list' : 'create',
  );
  const [editingProjeto, setEditingProjeto] = useState<ProjetoListItem | null>(
    null,
  );
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Hooks
  const {
    data: projetos,
    isLoading: loadingProjetos,
    refetch: refetchProjetos,
  } = useProjetos();
  const { data: projetoDetailsToEdit, isLoading: loadingProjetoDetailsToEdit } =
    useProjeto(editingProjeto?.id || 0);
  const createProjeto = useCreateProjeto();
  const updateProjeto = useUpdateProjeto();
  const deleteProjeto = useDeleteProjeto();
  const submitProjeto = useSubmitProjeto();
  const uploadDocument = useUploadProjetoDocument();
  const notifySigning = useNotifyProfessorSigning();

  const defaultFormValues = useMemo(
    () => ({
      ano: new Date().getFullYear(),
      semestre: 'SEMESTRE_1' as const, // Use 'as const' for better type inference if needed
      tipoProposicao: 'INDIVIDUAL' as const,
      bolsasSolicitadas: 0,
      voluntariosSolicitados: 0,
      cargaHorariaSemana: 4,
      numeroSemanas: 16,
      disciplinaIds: [],
      professoresParticipantesIds: [],
      titulo: '', // Ensure all form fields have a default empty state
      descricao: '',
      departamentoId: 0, // Or a suitable default like undefined if not 0
      professorResponsavelId: 0, // Or undefined
      publicoAlvo: '',
      estimativaPessoasBenificiadas: undefined,
    }),
    [],
  ); // Empty dependency array means it's created once

  // Default view mode for admin
  useEffect(() => {
    if (user?.role === 'admin' && viewMode !== 'list' && !editingProjeto) {
    } else if (user?.role !== 'admin' && viewMode === 'list') {
      setViewMode('create');
    }
  }, [user, viewMode, editingProjeto]);

  // Redirect students to the monitoria page instead
  useEffect(() => {
    if (user?.role === 'student') {
      navigate({ to: '/home/common/monitoria' });
    }
  }, [user, navigate]);

  const form = useForm<ProjetoFormData>({
    resolver: zodResolver(projetoFormSchema),
    defaultValues: defaultFormValues, // Use the memoized default values
  });

  const {
    register,
    control,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = form;

  const departamentoSelecionado = watch('departamentoId');

  const { data: disciplinasFiltradas, isLoading: loadingDisciplinas } =
    useDisciplinas(departamentoSelecionado);

  const formData = watch();

  // Populate form for editing
  useEffect(() => {
    if (viewMode === 'edit' && editingProjeto && projetoDetailsToEdit) {
      reset({
        titulo: projetoDetailsToEdit.titulo,
        descricao: projetoDetailsToEdit.descricao || '',
        departamentoId: projetoDetailsToEdit.departamentoId,
        professorResponsavelId: projetoDetailsToEdit.professorResponsavelId,
        ano: projetoDetailsToEdit.ano,
        semestre: projetoDetailsToEdit.semestre,
        tipoProposicao: projetoDetailsToEdit.tipoProposicao || 'INDIVIDUAL',
        bolsasSolicitadas: projetoDetailsToEdit.bolsasSolicitadas,
        voluntariosSolicitados: projetoDetailsToEdit.voluntariosSolicitados,
        cargaHorariaSemana: projetoDetailsToEdit.cargaHorariaSemana || 4,
        numeroSemanas: projetoDetailsToEdit.numeroSemanas || 16,
        publicoAlvo: projetoDetailsToEdit.publicoAlvo || '',
        estimativaPessoasBenificiadas:
          projetoDetailsToEdit.estimativaPessoasBenificiadas || undefined,
        disciplinaIds:
          projetoDetailsToEdit.disciplinas?.map((pd) => pd.disciplina.id) || [],
        professoresParticipantesIds:
          projetoDetailsToEdit.professoresParticipantes?.map(
            (pp) => pp.professor.id,
          ) || [],
      });
      setSavedProjetoId(projetoDetailsToEdit.id);
    } else if (viewMode !== 'edit') {
      reset(defaultFormValues); // Use the memoized default values for reset
      setSavedProjetoId(null);
      setEditingProjeto(null);
    }
  }, [
    viewMode,
    editingProjeto,
    projetoDetailsToEdit,
    reset,
    defaultFormValues, // Now depends on the memoized, stable reference
  ]);

  const handleSubmit = async (data: ProjetoFormData) => {
    try {
      if (viewMode === 'edit' && editingProjeto) {
        await updateProjeto.mutateAsync({ id: editingProjeto.id, data });
        toast.success('Projeto atualizado com sucesso!');
      } else {
        const newProjeto = await createProjeto.mutateAsync(data);
        toast.success('Projeto criado com sucesso!');
        setSavedProjetoId(newProjeto.id);
      }
      form.reset();
      setEditingProjeto(null);
      setViewMode('list');
      refetchProjetos();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao salvar projeto');
    }
  };

  const handleSubmitForSigning = async (projectId: number) => {
    if (!projectId) return;
    try {
      await submitProjeto.mutateAsync(projectId);
      toast.success('Projeto submetido para aprovação e assinaturas!');
      setViewMode('list');
      refetchProjetos();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao submeter projeto.');
    }
  };

  const handleEdit = (projeto: ProjetoListItem) => {
    setEditingProjeto(projeto);
    setViewMode('edit');
  };

  const handleDelete = async (projetoId: number) => {
    if (window.confirm('Tem certeza que deseja excluir este projeto?')) {
      try {
        await deleteProjeto.mutateAsync(projetoId);
        toast.success('Projeto excluído com sucesso!');
        refetchProjetos();
      } catch (error: any) {
        toast.error(error.message || 'Erro ao excluir projeto');
      }
    }
  };

  const handleAnalisarProjeto = (projetoId: number) => {
    navigate({
      to: AnalisarProjetoRoute.fullPath,
      params: {
        project: projetoId.toString(),
      },
    });
  };

  const handleGeneratePDF = async () => {
    if (!formData.titulo || !formData.descricao || !departamentoSelecionado) {
      toast.error('Preencha todos os campos obrigatórios para gerar o PDF');
      return;
    }

    try {
      const { pdf, Document, Page, Text, View, StyleSheet } = await import(
        '@react-pdf/renderer'
      );

      const departamento = departamentos?.find(
        (d) => d.id === departamentoSelecionado,
      );
      const disciplinasSelecionadas =
        disciplinasFiltradas?.filter((d) =>
          formData.disciplinaIds?.includes(d.id),
        ) || [];

      const semestreLabel =
        formData.semestre === 'SEMESTRE_1'
          ? `${formData.ano}.1`
          : `${formData.ano}.2`;
      const tipoProposicaoLabel =
        formData.tipoProposicao === 'INDIVIDUAL' ? 'Individual' : 'Coletiva';
      const disciplinasText = disciplinasSelecionadas
        .map((d) => `${d.codigo} - ${d.nome}`)
        .join(', ');

      const styles = StyleSheet.create({
        page: {
          flexDirection: 'column',
          backgroundColor: '#FFFFFF',
          padding: 20,
          fontSize: 11,
          fontFamily: 'Helvetica',
        },
        header: {
          textAlign: 'center',
          marginBottom: 20,
        },
        title: {
          fontSize: 14,
          fontWeight: 'bold',
          textAlign: 'center',
          margin: '20 0',
        },
        section: {
          border: '2px solid #000',
          marginBottom: 10,
        },
        sectionHeader: {
          backgroundColor: '#d0d0d0',
          fontWeight: 'bold',
          padding: 5,
          borderBottom: '1px solid #000',
        },
        formRow: {
          borderBottom: '1px solid #000',
          padding: 4,
          minHeight: 18,
          flexDirection: 'row',
          alignItems: 'center',
        },
        fieldLabel: {
          fontWeight: 'bold',
          marginRight: 5,
        },
        fieldValue: {
          flex: 1,
        },
        descriptionBox: {
          minHeight: 100,
          padding: 10,
          border: '1px solid #000',
          margin: '10 0',
        },
      });

      const MyDocument = () => (
        <Document>
          <Page size="A4" style={styles.page}>
            <View style={styles.header}>
              <Text style={{ fontWeight: 'bold', marginBottom: 10 }}>
                UNIVERSIDADE FEDERAL DA BAHIA{'\n'}
                Pró - Reitoria de Ensino de Graduação{'\n'}
                Coordenação Acadêmica de Graduação
              </Text>
            </View>

            <Text style={styles.title}>
              ANEXO I – FORMULÁRIO PARA SUBMISSÃO DE PROJETO DE MONITORIA
            </Text>

            <View style={styles.section}>
              <Text style={styles.sectionHeader}>
                1. IDENTIFICAÇÃO DO PROJETO
              </Text>

              <View style={styles.formRow}>
                <Text style={styles.fieldLabel}>
                  1.1 Unidade Universitária:
                </Text>
                <Text style={styles.fieldValue}>Instituto de Computação</Text>
              </View>

              <View style={styles.formRow}>
                <Text style={styles.fieldLabel}>1.2 Órgão responsável:</Text>
                <Text style={styles.fieldValue}>
                  {departamento?.nome || 'Não selecionado'}
                </Text>
              </View>

              <View style={styles.formRow}>
                <Text style={styles.fieldLabel}>1.3 Título:</Text>
                <Text style={styles.fieldValue}>{formData.titulo}</Text>
              </View>

              <View style={styles.formRow}>
                <Text style={styles.fieldLabel}>
                  1.4 Componente(s) curricular(es):
                </Text>
                <Text style={styles.fieldValue}>
                  {disciplinasText || 'Nenhuma disciplina selecionada'}
                </Text>
              </View>

              <View style={styles.formRow}>
                <Text style={styles.fieldLabel}>1.5 Semestre:</Text>
                <Text style={styles.fieldValue}>{semestreLabel}</Text>
              </View>

              <View style={styles.formRow}>
                <Text style={styles.fieldLabel}>1.6 Proposição:</Text>
                <Text style={styles.fieldValue}>{tipoProposicaoLabel}</Text>
              </View>

              <View style={styles.formRow}>
                <Text style={styles.fieldLabel}>1.7 Número de monitores:</Text>
                <Text style={styles.fieldValue}>
                  {(formData.bolsasSolicitadas || 0) +
                    (formData.voluntariosSolicitados || 0)}
                </Text>
              </View>

              <View style={styles.formRow}>
                <Text style={styles.fieldLabel}>
                  1.8 Carga horária semanal:
                </Text>
                <Text style={styles.fieldValue}>
                  {formData.cargaHorariaSemana || 0}h
                </Text>
              </View>

              <View style={styles.formRow}>
                <Text style={styles.fieldLabel}>1.9 Carga horária total:</Text>
                <Text style={styles.fieldValue}>
                  {(formData.cargaHorariaSemana || 0) *
                    (formData.numeroSemanas || 0)}
                  h
                </Text>
              </View>

              <View style={styles.formRow}>
                <Text style={styles.fieldLabel}>1.10 Público-alvo:</Text>
                <Text style={styles.fieldValue}>
                  {formData.publicoAlvo || 'Não informado'}
                </Text>
              </View>

              <View style={styles.formRow}>
                <Text style={styles.fieldLabel}>
                  1.11 Estimativa de beneficiados:
                </Text>
                <Text style={styles.fieldValue}>
                  {formData.estimativaPessoasBenificiadas || 'Não informado'}
                </Text>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionHeader}>
                2. DADOS DO PROFESSOR RESPONSÁVEL
              </Text>
              <View style={{ padding: 5 }}>
                <Text>Nome: {user?.username || 'Professor Responsável'}</Text>
                <Text>E-mail: {user?.email || 'professor@ufba.br'}</Text>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionHeader}>3. DESCRIÇÃO DO PROJETO</Text>
              <View style={styles.descriptionBox}>
                <Text>{formData.descricao}</Text>
              </View>
            </View>
          </Page>
        </Document>
      );

      const blob = await pdf(<MyDocument />).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `projeto-monitoria-${formData.titulo?.replace(/[^a-zA-Z0-9]/g, '-')}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success('PDF gerado e download iniciado!');
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      toast.error('Erro ao gerar PDF do projeto');
    }
  };

  const handleUploadSignedProposal = async () => {
    if (!selectedFile || !savedProjetoId) {
      toast.error(
        'Selecione um arquivo e certifique-se que o projeto está salvo.',
      );
      return;
    }
    try {
      await uploadDocument.mutateAsync({
        projetoId: savedProjetoId,
        file: selectedFile,
        tipoDocumento: 'PROPOSTA_ASSINADA_PROFESSOR',
      });
      toast.success('Proposta assinada enviada com sucesso!');
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';

      try {
        await notifySigning.mutateAsync({
          projetoId: savedProjetoId,
          message:
            'A proposta do projeto foi assinada pelo professor responsável e está pronta para as próximas etapas.',
        });
        toast.info('Notificações sobre assinatura enviadas.');
      } catch (notificationError: any) {
        toast.error(
          notificationError.message ||
            'Erro ao enviar notificações de assinatura.',
        );
      }

      refetchProjetos();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao enviar proposta assinada.');
    }
  };

  if (loadingDepartamentos || loadingProfessores) {
    return (
      <PagesLayout
        title={
          viewMode === 'edit' ? 'Editar Projeto' : 'Novo Projeto de Monitoria'
        }
      >
        <div className="flex justify-center items-center py-8">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            <p className="mt-2">Carregando dados necessários...</p>
          </div>
        </div>
      </PagesLayout>
    );
  }

  if (
    (viewMode === 'create' || viewMode === 'edit') &&
    (!departamentos || departamentos.length === 0)
  ) {
    return (
      <PagesLayout
        title={
          viewMode === 'edit' ? 'Editar Projeto' : 'Novo Projeto de Monitoria'
        }
      >
        <div className="text-center py-12 border rounded-md bg-muted/20">
          <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">
            Dados necessários não encontrados
          </h3>
          <p className="text-muted-foreground mb-4">
            Para criar projetos de monitoria, é necessário ter departamentos
            cadastrados no sistema.
          </p>
          {user?.role === 'admin' && (
            <Button
              onClick={() => navigate({ to: '/home/admin/departamentos' })}
            >
              Gerenciar Departamentos
            </Button>
          )}
          {user?.role === 'admin' && viewMode === 'edit' && (
            <Button
              variant="outline"
              onClick={() => setViewMode('list')}
              className="mt-4"
            >
              Voltar para Lista
            </Button>
          )}
        </div>
      </PagesLayout>
    );
  }

  // Helper to render status badge
  const renderStatusBadge = (status: ProjetoListItem['status']) => {
    switch (status) {
      case 'APPROVED':
        return <Badge variant="success">Aprovado</Badge>;
      case 'REJECTED':
        return <Badge variant="destructive">Rejeitado</Badge>;
      case 'SUBMITTED':
        return <Badge variant="warning">Em Análise</Badge>;
      case 'DRAFT':
        return <Badge variant="secondary">Rascunho</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  if (viewMode === 'list' && user?.role === 'admin') {
    return (
      <PagesLayout
        title="Gerenciar Projetos de Monitoria"
        actions={
          <Button
            onClick={() => {
              setViewMode('create');
              setEditingProjeto(null);
              reset(form.formState.defaultValues);
            }}
          >
            <PlusCircle className="h-4 w-4 mr-2" />
            Novo Projeto
          </Button>
        }
      >
        {loadingProjetos ? (
          <div className="flex justify-center items-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            <p className="mt-2">Carregando projetos...</p>
          </div>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Lista de Projetos</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Título</TableHead>
                    <TableHead>Departamento</TableHead>
                    <TableHead>Responsável</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Semestre</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {projetos && projetos.length > 0 ? (
                    projetos.map((projeto) => (
                      <TableRow key={projeto.id}>
                        <TableCell className="font-medium">
                          {projeto.titulo}
                        </TableCell>
                        <TableCell>{projeto.departamentoNome}</TableCell>
                        <TableCell>
                          {projeto.professorResponsavelNome}
                        </TableCell>
                        <TableCell>
                          {renderStatusBadge(projeto.status)}
                        </TableCell>
                        <TableCell>
                          {projeto.ano}.
                          {projeto.semestre === 'SEMESTRE_1' ? 1 : 2}
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleAnalisarProjeto(projeto.id)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(projeto)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDelete(projeto.id)}
                            disabled={deleteProjeto.isPending}
                          >
                            {deleteProjeto.isPending ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center">
                        Nenhum projeto encontrado.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </PagesLayout>
    );
  }

  // CREATE OR EDIT FORM VIEW
  // This will render if viewMode is 'create' OR 'edit'
  // The specific title/subtitle will adjust based on viewMode inside PagesLayout
  if (viewMode === 'create' || viewMode === 'edit') {
    // Show loading state for form if fetching details for edit mode
    if (viewMode === 'edit' && loadingProjetoDetailsToEdit) {
      return (
        <PagesLayout title="Editar Projeto">
          <div className="flex justify-center items-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            <p className="mt-2">Carregando detalhes do projeto...</p>
          </div>
        </PagesLayout>
      );
    }

    return (
      <PagesLayout
        title={
          viewMode === 'edit'
            ? `Editar Projeto: ${editingProjeto?.titulo || ''}`
            : 'Novo projeto de monitoria'
        }
        subtitle={
          viewMode === 'edit'
            ? 'Atualize os detalhes do projeto de monitoria'
            : 'Formulário para submissão de projeto de monitoria'
        }
        actions={
          user?.role === 'admin' ? (
            <Button
              variant="outline"
              onClick={() => {
                setViewMode('list');
                setEditingProjeto(null);
                reset(form.formState.defaultValues);
              }}
            >
              Voltar para Lista
            </Button>
          ) : undefined
        }
      >
        <div className="grid grid-cols-1 @[800px]:grid-cols-2 gap-6">
          <div className="@[800px]:col-span-1 space-y-6">
            <form
              onSubmit={form.handleSubmit(handleSubmit)}
              className="space-y-6"
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Identificação do Projeto
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="titulo">1.1 Título do Projeto</Label>
                      <Input
                        id="titulo"
                        placeholder="Digite o título do projeto"
                        {...register('titulo')}
                        className={errors.titulo ? 'border-red-500' : ''}
                      />
                      {errors.titulo && (
                        <p className="text-sm text-red-500 mt-1">
                          {errors.titulo.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="departamentoId">
                        1.2 Órgão responsável (Departamento ou Coord. Acadêmica)
                      </Label>
                      <Controller
                        name="departamentoId"
                        control={control}
                        render={({ field }) => (
                          <Select
                            onValueChange={(value) => {
                              field.onChange(parseInt(value));
                              setValue('disciplinaIds', []);
                            }}
                            value={field.value?.toString()}
                            disabled={loadingDepartamentos}
                          >
                            <SelectTrigger
                              className={
                                errors.departamentoId ? 'border-red-500' : ''
                              }
                            >
                              <SelectValue
                                placeholder={
                                  loadingDepartamentos
                                    ? 'Carregando...'
                                    : 'Selecione o órgão'
                                }
                              />
                            </SelectTrigger>
                            <SelectContent>
                              {departamentos?.map(
                                (dept: DepartamentoResponse) => (
                                  <SelectItem
                                    key={dept.id}
                                    value={dept.id.toString()}
                                  >
                                    {dept.nome}
                                  </SelectItem>
                                ),
                              )}
                            </SelectContent>
                          </Select>
                        )}
                      />
                      {errors.departamentoId && (
                        <p className="text-sm text-red-500 mt-1">
                          {errors.departamentoId.message}
                        </p>
                      )}
                    </div>

                    {user?.role === 'admin' && (
                      <div>
                        <Label htmlFor="professorResponsavelId">
                          Professor Responsável (Admin)
                        </Label>
                        <Controller
                          name="professorResponsavelId"
                          control={control}
                          render={({ field }) => (
                            <Select
                              onValueChange={(value) =>
                                field.onChange(parseInt(value))
                              }
                              value={field.value?.toString()}
                              disabled={loadingProfessores}
                            >
                              <SelectTrigger
                                className={
                                  errors.professorResponsavelId
                                    ? 'border-red-500'
                                    : ''
                                }
                              >
                                <SelectValue
                                  placeholder={
                                    loadingProfessores
                                      ? 'Carregando...'
                                      : 'Selecione o professor'
                                  }
                                />
                              </SelectTrigger>
                              <SelectContent>
                                {professores?.map((professor) => (
                                  <SelectItem
                                    key={professor.id}
                                    value={professor.id.toString()}
                                  >
                                    {professor.nomeCompleto}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        />
                        {errors.professorResponsavelId && (
                          <p className="text-sm text-red-500 mt-1">
                            {errors.professorResponsavelId.message}
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="professoresParticipantesIds">
                        Professores Participantes (Opcional)
                      </Label>
                      <Controller
                        name="professoresParticipantesIds"
                        control={control}
                        render={({ field }) => (
                          <Select
                            onValueChange={(value) => {
                              const professorId = parseInt(value);
                              const currentIds = field.value || [];
                              if (
                                !currentIds.includes(professorId) &&
                                professorId !== watch('professorResponsavelId')
                              ) {
                                field.onChange([...currentIds, professorId]);
                              }
                            }}
                            disabled={loadingProfessores}
                            value=""
                          >
                            <SelectTrigger
                              className={
                                errors.professoresParticipantesIds
                                  ? 'border-red-500'
                                  : ''
                              }
                            >
                              <SelectValue
                                placeholder={
                                  loadingProfessores
                                    ? 'Carregando professores...'
                                    : 'Adicionar professor participante'
                                }
                              />
                            </SelectTrigger>
                            <SelectContent>
                              {professores && professores.length > 0 ? (
                                professores
                                  .filter(
                                    (p) =>
                                      p.id !== watch('professorResponsavelId'),
                                  )
                                  .map((professor) => (
                                    <SelectItem
                                      key={professor.id}
                                      value={professor.id.toString()}
                                      disabled={(field.value || []).includes(
                                        professor.id,
                                      )}
                                    >
                                      {professor.nomeCompleto}
                                    </SelectItem>
                                  ))
                              ) : (
                                <SelectItem value="no-data" disabled>
                                  {loadingProfessores
                                    ? 'Carregando...'
                                    : 'Nenhum professor encontrado'}
                                </SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                        )}
                      />
                      <div className="mt-2 space-y-1">
                        {watch('professoresParticipantesIds')?.map(
                          (professorId) => {
                            const professor = professores?.find(
                              (p) => p.id === professorId,
                            );
                            return professor ? (
                              <div
                                key={professorId}
                                className="flex items-center justify-between bg-muted p-2 rounded text-sm"
                              >
                                <span>{professor.nomeCompleto}</span>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    const current =
                                      watch('professoresParticipantesIds') ||
                                      [];
                                    setValue(
                                      'professoresParticipantesIds',
                                      current.filter(
                                        (id) => id !== professorId,
                                      ),
                                      { shouldValidate: true },
                                    );
                                  }}
                                >
                                  Remover
                                </Button>
                              </div>
                            ) : null;
                          },
                        )}
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="ano">1.3 Ano</Label>
                      <Input
                        id="ano"
                        type="number"
                        placeholder="Ex: 2025"
                        {...register('ano', { valueAsNumber: true })}
                        className={errors.ano ? 'border-red-500' : ''}
                      />
                      {errors.ano && (
                        <p className="text-sm text-red-500 mt-1">
                          {errors.ano.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="semestre">1.4 Semestre</Label>
                      <Controller
                        name="semestre"
                        control={control}
                        render={({ field }) => (
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <SelectTrigger
                              className={
                                errors.semestre ? 'border-red-500' : ''
                              }
                            >
                              <SelectValue placeholder="Selecione o semestre" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="SEMESTRE_1">.1</SelectItem>
                              <SelectItem value="SEMESTRE_2">.2</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      />
                      {errors.semestre && (
                        <p className="text-sm text-red-500 mt-1">
                          {errors.semestre.message}
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="disciplinaIds">
                      1.5 Componente(s) curricular(es) (código e nome)
                    </Label>
                    <Controller
                      name="disciplinaIds"
                      control={control}
                      render={({ field }) => (
                        <Select
                          onValueChange={(value) => {
                            const disciplinaId = parseInt(value);
                            const currentIds = field.value || [];
                            if (!currentIds.includes(disciplinaId)) {
                              field.onChange([...currentIds, disciplinaId]);
                            }
                          }}
                          disabled={
                            !departamentoSelecionado || loadingDisciplinas
                          }
                          value=""
                        >
                          <SelectTrigger
                            className={
                              errors.disciplinaIds ? 'border-red-500' : ''
                            }
                          >
                            <SelectValue
                              placeholder={
                                !departamentoSelecionado
                                  ? 'Primeiro selecione um departamento'
                                  : loadingDisciplinas
                                    ? 'Carregando disciplinas...'
                                    : 'Adicionar componente curricular'
                              }
                            />
                          </SelectTrigger>
                          <SelectContent>
                            {disciplinasFiltradas &&
                            disciplinasFiltradas.length > 0 ? (
                              disciplinasFiltradas.map((disciplina) => (
                                <SelectItem
                                  key={disciplina.id}
                                  value={disciplina.id.toString()}
                                  disabled={(field.value || []).includes(
                                    disciplina.id,
                                  )}
                                >
                                  {disciplina.codigo} - {disciplina.nome}
                                </SelectItem>
                              ))
                            ) : (
                              <SelectItem value="no-data" disabled>
                                {loadingDisciplinas
                                  ? 'Carregando...'
                                  : 'Nenhuma disciplina encontrada'}
                              </SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {errors.disciplinaIds && (
                      <p className="text-sm text-red-500 mt-1">
                        {errors.disciplinaIds.message}
                      </p>
                    )}
                    <div className="mt-2 space-y-1">
                      {watch('disciplinaIds')?.map((disciplinaId) => {
                        const disciplina = disciplinasFiltradas?.find(
                          (d) => d.id === disciplinaId,
                        );
                        return disciplina ? (
                          <div
                            key={disciplinaId}
                            className="flex items-center justify-between bg-muted p-2 rounded text-sm"
                          >
                            <span>
                              {disciplina.codigo} - {disciplina.nome}
                            </span>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const current = watch('disciplinaIds') || [];
                                setValue(
                                  'disciplinaIds',
                                  current.filter((id) => id !== disciplinaId),
                                  { shouldValidate: true },
                                );
                              }}
                            >
                              Remover
                            </Button>
                          </div>
                        ) : null;
                      })}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="publicoAlvo">Público Alvo</Label>
                    <Input
                      id="publicoAlvo"
                      placeholder="Ex: Estudantes de graduação em Ciência da Computação"
                      {...register('publicoAlvo')}
                      className={errors.publicoAlvo ? 'border-red-500' : ''}
                    />
                    {errors.publicoAlvo && (
                      <p className="text-sm text-red-500 mt-1">
                        {errors.publicoAlvo.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="estimativaPessoasBenificiadas">
                      Estimativa de Pessoas Beneficiadas
                    </Label>
                    <Input
                      id="estimativaPessoasBenificiadas"
                      type="number"
                      placeholder="Ex: 50"
                      {...register('estimativaPessoasBenificiadas', {
                        valueAsNumber: true,
                      })}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Vagas Solicitadas
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="bolsasSolicitadas">
                        Número de Bolsistas Solicitados
                      </Label>
                      <Input
                        id="bolsasSolicitadas"
                        type="number"
                        min="0"
                        {...register('bolsasSolicitadas', {
                          valueAsNumber: true,
                        })}
                        className={
                          errors.bolsasSolicitadas ? 'border-red-500' : ''
                        }
                      />
                      {errors.bolsasSolicitadas && (
                        <p className="text-sm text-red-500 mt-1">
                          {errors.bolsasSolicitadas.message}
                        </p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="voluntariosSolicitados">
                        Número de Voluntários Solicitados
                      </Label>
                      <Input
                        id="voluntariosSolicitados"
                        type="number"
                        min="0"
                        {...register('voluntariosSolicitados', {
                          valueAsNumber: true,
                        })}
                        className={
                          errors.voluntariosSolicitados ? 'border-red-500' : ''
                        }
                      />
                      {errors.voluntariosSolicitados && (
                        <p className="text-sm text-red-500 mt-1">
                          {errors.voluntariosSolicitados.message}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-center gap-4 pt-2">
                <Button
                  type="submit"
                  size="lg"
                  disabled={createProjeto.isPending || updateProjeto.isPending}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8"
                >
                  {createProjeto.isPending || updateProjeto.isPending ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Salvando...
                    </div>
                  ) : (
                    <>
                      <FileText className="h-4 w-4 mr-2" />
                      {viewMode === 'edit'
                        ? 'Atualizar Projeto'
                        : 'Salvar Rascunho'}
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  onClick={handleGeneratePDF}
                  disabled={
                    !formData.titulo ||
                    !formData.descricao ||
                    !departamentoSelecionado
                  }
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Baixar PDF Prévia
                </Button>
              </div>
              {viewMode === 'edit' && savedProjetoId && (
                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Documentos e Próximos Passos
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p>
                      Projeto salvo com ID: {savedProjetoId}. Agora você pode
                      gerenciar os documentos e submeter para aprovação.
                    </p>

                    <div className="space-y-2 pt-2">
                      <Label htmlFor="upload-proposta-assinada">
                        Carregar Proposta Assinada (PDF)
                      </Label>
                      <Input
                        id="upload-proposta-assinada"
                        type="file"
                        accept=".pdf"
                        ref={fileInputRef}
                        onChange={(e) =>
                          setSelectedFile(
                            e.target.files ? e.target.files[0] : null,
                          )
                        }
                        className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      />
                      <Button
                        onClick={handleUploadSignedProposal}
                        disabled={
                          !selectedFile ||
                          uploadDocument.isPending ||
                          !savedProjetoId
                        }
                        className="w-full"
                      >
                        {uploadDocument.isPending
                          ? 'Enviando...'
                          : 'Enviar Proposta Assinada'}
                      </Button>
                      {uploadDocument.isError && (
                        <p className="text-sm text-red-500 mt-1">
                          Erro ao enviar:{' '}
                          {uploadDocument.error?.message || 'Tente novamente.'}
                        </p>
                      )}
                    </div>

                    <div className="mt-4">
                      <Button
                        onClick={() => handleSubmitForSigning(savedProjetoId!)}
                        disabled={!savedProjetoId || submitProjeto.isPending}
                        className="w-full bg-green-600 hover:bg-green-700 text-white"
                      >
                        {submitProjeto.isPending
                          ? 'Submetendo...'
                          : 'Submeter para Aprovação e Assinaturas'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </form>
          </div>

          {(viewMode === 'create' || viewMode === 'edit') && (
            <div className="@[800px]:col-span-1 sticky top-24 h-[calc(100vh-10rem)] overflow-y-auto">
              <Card>
                <CardHeader>
                  <CardTitle>Prévia do PDF (ANEXO I)</CardTitle>
                </CardHeader>
                <CardContent>
                  <ProjetoPDFPreview
                    formData={formData}
                    departamentos={departamentos}
                    disciplinasFiltradas={disciplinasFiltradas}
                    user={user}
                  />
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </PagesLayout>
    );
  }

  // Default to list view for admin if no other view is active (should be caught by earlier if conditions)
  // Or if user is not admin and somehow tries to access a list view (though they are defaulted to 'create')
  // This final return acts as a fallback or default rendering for the component if none of the specific viewMode conditions are met for form rendering.
  // Given the logic, admin should see the list if viewMode is 'list', and form if 'create' or 'edit'.
  // Non-admins are defaulted to 'create' form.
  return (
    <PagesLayout title="Projetos de Monitoria">
      <div className="text-center p-8">
        <p>Selecione uma ação ou visualize os projetos.</p>
        {user?.role === 'admin' && viewMode !== 'list' && (
          <Button onClick={() => setViewMode('list')}>
            Ver Lista de Projetos
          </Button>
        )}
      </div>
    </PagesLayout>
  );
}
