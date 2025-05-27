'use client';

import { PagesLayout } from '@/components/layout/PagesLayout';
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
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/use-auth';
import { useDepartamentoList } from '@/hooks/use-departamento';
import { useDisciplinas } from '@/hooks/use-disciplina';
import { useProfessores } from '@/hooks/use-professor';
import {
  useCreateProjeto,
  useNotifyProfessorSigning,
  useProjetoDocuments,
  useProjetos,
  useUploadProjetoDocument,
} from '@/hooks/use-projeto';
import { DepartamentoResponse } from '@/routes/api/departamento/-types';
import { zodResolver } from '@hookform/resolvers/zod';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { BookOpen, FileText, Target, Users } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import * as z from 'zod';

export const Route = createFileRoute('/home/_layout/common/projects/')({
  component: ProjectsComponent,
});

const projetoFormSchema = z.object({
  titulo: z.string().min(1, 'Título é obrigatório'),
  descricao: z.string().min(10, 'Descrição deve ter pelo menos 10 caracteres'),
  departamentoId: z.number().min(1, 'Departamento é obrigatório'),
  professorResponsavelId: z.number().optional(),
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
});

export type ProjetoFormData = z.infer<typeof projetoFormSchema>;

function ProjectsComponent() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: departamentos, isLoading: loadingDepartamentos } =
    useDepartamentoList();
  const { data: professores, isLoading: loadingProfessores } = useProfessores();

  // State management
  const [savedProjetoId, setSavedProjetoId] = useState<number | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'create' | 'edit'>(
    'create',
  );
  const [editingProjetoId, setEditingProjetoId] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Hooks
  const { data: projetos, isLoading: loadingProjetos } = useProjetos();
  const createProjeto = useCreateProjeto();
  const uploadDocument = useUploadProjetoDocument();
  const notifySigning = useNotifyProfessorSigning();
  const { data: projetoDocuments } = useProjetoDocuments(savedProjetoId || 0);

  // Para admin, mostrar lista por padrão
  useEffect(() => {
    if (user?.role === 'admin') {
      setViewMode('list');
    }
  }, [user]);

  // Redirect students to the monitoria page instead
  useEffect(() => {
    if (user?.role === 'student') {
      navigate({ to: '/home/common/monitoria' });
    }
  }, [user, navigate]);

  const form = useForm<ProjetoFormData>({
    resolver: zodResolver(projetoFormSchema),
    defaultValues: {
      ano: new Date().getFullYear(),
      semestre: 'SEMESTRE_1',
      tipoProposicao: 'INDIVIDUAL',
      bolsasSolicitadas: 0,
      voluntariosSolicitados: 0,
      cargaHorariaSemana: 4,
      numeroSemanas: 16,
      disciplinaIds: [],
    },
  });

  const {
    register,
    control,
    watch,
    setValue,
    formState: { errors },
  } = form;

  const departamentoSelecionado = watch('departamentoId');

  // Usar hook com filtro por departamento
  const { data: disciplinasFiltradas, isLoading: loadingDisciplinas } =
    useDisciplinas(departamentoSelecionado);

  // Observar todos os campos do formulário
  const formData = watch();

  const handleSubmit = async (data: ProjetoFormData) => {
    try {
      await createProjeto.mutateAsync(data);

      toast.success('Projeto criado com sucesso!');

      // Reset form
      setValue('titulo', '');
      setValue('descricao', '');
      setValue('departamentoId', 0);
      setValue('disciplinaIds', []);
      setValue('publicoAlvo', '');
      setValue('estimativaPessoasBenificiadas', undefined);
      setValue('bolsasSolicitadas', 0);
      setValue('voluntariosSolicitados', 0);
      setValue('cargaHorariaSemana', 4);
      setValue('numeroSemanas', 16);
    } catch (error: any) {
      toast.error(error.message || 'Erro ao criar projeto');
    }
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

  if (loadingDepartamentos || loadingProfessores) {
    return (
      <PagesLayout title="Novo projeto de monitoria">
        <div className="flex justify-center items-center py-8">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            <p className="mt-2">Carregando dados necessários...</p>
          </div>
        </div>
      </PagesLayout>
    );
  }

  // Verificar se há dados necessários
  if (!departamentos || departamentos.length === 0) {
    return (
      <PagesLayout title="Novo projeto de monitoria">
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
        </div>
      </PagesLayout>
    );
  }

  return (
    <PagesLayout
      title="Novo projeto de monitoria"
      subtitle="Formulário para submissão de projeto de monitoria"
    >
      <form
        onSubmit={form.handleSubmit(async (data: ProjetoFormData) => {
          try {
            await createProjeto.mutateAsync(data);
            toast.success('Projeto criado com sucesso!');
            form.reset();
          } catch (error: any) {
            toast.error(error.message || 'Erro ao criar projeto');
          }
        })}
        className="mx-auto space-y-6"
      >
        <div className="space-y-6">
          {/* Identificação do Projeto */}
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
                          setValue('disciplinaIds', []); // Reset disciplinas quando departamento muda
                        }}
                        value={field.value?.toString()}
                      >
                        <SelectTrigger
                          className={
                            errors.departamentoId ? 'border-red-500' : ''
                          }
                        >
                          <SelectValue placeholder="Digite o órgão responsável" />
                        </SelectTrigger>
                        <SelectContent>
                          {departamentos?.map((dept: DepartamentoResponse) => (
                            <SelectItem
                              key={dept.id}
                              value={dept.id.toString()}
                            >
                              {dept.nome}
                            </SelectItem>
                          ))}
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

                {/* Campo Professor Responsável - apenas para admins */}
                {user?.role === 'admin' && (
                  <div>
                    <Label htmlFor="professorResponsavelId">
                      1.2 Professor Responsável
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
                        >
                          <SelectTrigger
                            className={
                              errors.professorResponsavelId
                                ? 'border-red-500'
                                : ''
                            }
                          >
                            <SelectValue placeholder="Selecione o professor responsável" />
                          </SelectTrigger>
                          <SelectContent>
                            {loadingProfessores ? (
                              <SelectItem value="loading" disabled>
                                Carregando professores...
                              </SelectItem>
                            ) : (
                              professores?.map((professor) => (
                                <SelectItem
                                  key={professor.id}
                                  value={professor.id.toString()}
                                >
                                  {professor.nomeCompleto}
                                </SelectItem>
                              ))
                            )}
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
                  <Label htmlFor="ano">1.3 Ano</Label>
                  <Input
                    id="ano"
                    type="number"
                    placeholder="Ex: 2025.1"
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
                          className={errors.semestre ? 'border-red-500' : ''}
                        >
                          <SelectValue placeholder="Ex: 2025.1" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="SEMESTRE_1">2025.1</SelectItem>
                          <SelectItem value="SEMESTRE_2">2025.2</SelectItem>
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
                      disabled={!departamentoSelecionado || loadingDisciplinas}
                      value=""
                    >
                      <SelectTrigger
                        className={errors.disciplinaIds ? 'border-red-500' : ''}
                      >
                        <SelectValue
                          placeholder={
                            !departamentoSelecionado
                              ? 'Primeiro selecione um departamento'
                              : loadingDisciplinas
                                ? 'Carregando disciplinas...'
                                : 'Escolha um dos componentes curriculares cadastrados'
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
                            >
                              {disciplina.codigo} - {disciplina.nome}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="no-data" disabled>
                            Nenhuma disciplina encontrada
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

                {/* Mostrar disciplinas selecionadas */}
                <div className="mt-2 space-y-1">
                  {watch('disciplinaIds')?.map((disciplinaId) => {
                    const disciplina = disciplinasFiltradas?.find(
                      (d) => d.id === disciplinaId,
                    );
                    return disciplina ? (
                      <div
                        key={disciplinaId}
                        className="flex items-center justify-between bg-muted p-2 rounded"
                      >
                        <span className="text-sm">
                          {disciplina.codigo} - {disciplina.nome}
                        </span>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const current = watch('disciplinaIds');
                            setValue(
                              'disciplinaIds',
                              current.filter((id) => id !== disciplinaId),
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
            </CardContent>
          </Card>

          {/* Descrição do Projeto */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Descrição do Projeto
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="descricao">
                  Descrição detalhada do projeto
                </Label>
                <Textarea
                  id="descricao"
                  rows={6}
                  placeholder="Descreva os objetivos, metodologia e atividades do projeto..."
                  {...register('descricao')}
                  className={errors.descricao ? 'border-red-500' : ''}
                />
                {errors.descricao && (
                  <p className="text-sm text-red-500 mt-1">
                    {errors.descricao.message}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="cargaHorariaSemana">
                    Carga Horária Semanal (horas)
                  </Label>
                  <Input
                    id="cargaHorariaSemana"
                    type="number"
                    {...register('cargaHorariaSemana', { valueAsNumber: true })}
                    className={
                      errors.cargaHorariaSemana ? 'border-red-500' : ''
                    }
                  />
                  {errors.cargaHorariaSemana && (
                    <p className="text-sm text-red-500 mt-1">
                      {errors.cargaHorariaSemana.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="numeroSemanas">Número de Semanas</Label>
                  <Input
                    id="numeroSemanas"
                    type="number"
                    {...register('numeroSemanas', { valueAsNumber: true })}
                    className={errors.numeroSemanas ? 'border-red-500' : ''}
                  />
                  {errors.numeroSemanas && (
                    <p className="text-sm text-red-500 mt-1">
                      {errors.numeroSemanas.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="tipoProposicao">Tipo de Proposição</Label>
                  <Controller
                    name="tipoProposicao"
                    control={control}
                    render={({ field }) => (
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="INDIVIDUAL">Individual</SelectItem>
                          <SelectItem value="COLETIVA">Coletiva</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Vagas */}
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
                    {...register('bolsasSolicitadas', { valueAsNumber: true })}
                    className={errors.bolsasSolicitadas ? 'border-red-500' : ''}
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

          {/* Botões de Ação */}
          <div className="flex justify-center gap-4">
            <Button
              type="submit"
              size="lg"
              disabled={createProjeto.isPending}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8"
            >
              {createProjeto.isPending ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Salvando...
                </div>
              ) : (
                <>
                  <FileText className="h-4 w-4 mr-2" />
                  Salvar Projeto
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
              Gerar PDF Prévia
            </Button>
          </div>
        </div>
      </form>
    </PagesLayout>
  );
}
