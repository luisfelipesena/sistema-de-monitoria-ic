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
import { useDepartamentoList } from '@/hooks/use-departamento';
import { useDisciplinas } from '@/hooks/use-disciplina';
import { useCreateProjeto } from '@/hooks/use-projeto';
import { DepartamentoResponse } from '@/routes/api/departamento/-types';
import { zodResolver } from '@hookform/resolvers/zod';
import { createFileRoute } from '@tanstack/react-router';
import { BookOpen, FileText, Target, Users } from 'lucide-react';
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

type ProjetoFormData = z.infer<typeof projetoFormSchema>;

function ProjectsComponent() {
  const { data: departamentos, isLoading: loadingDepartamentos } =
    useDepartamentoList();
  const createProjetoMutation = useCreateProjeto();

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ProjetoFormData>({
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

  const departamentoSelecionado = watch('departamentoId');

  // Usar hook com filtro por departamento
  const { data: disciplinasFiltradas, isLoading: loadingDisciplinas } =
    useDisciplinas(departamentoSelecionado);

  const onSubmit = async (data: ProjetoFormData) => {
    try {
      await createProjetoMutation.mutateAsync(data);
      toast.success('Projeto criado com sucesso!');
    } catch (error) {
      toast.error('Erro ao criar projeto. Tente novamente.');
    }
  };

  if (loadingDepartamentos) {
    return (
      <PagesLayout title="Novo edital de monitoria">
        <div className="flex justify-center items-center py-8">
          <p>Carregando dados...</p>
        </div>
      </PagesLayout>
    );
  }

  return (
    <PagesLayout title="Novo edital de monitoria">
      <div className="mx-auto space-y-6">
        <div className="text-sm text-muted-foreground">
          Formulário para submissão de projeto de monitoria
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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
                  <Label htmlFor="semestre">1.5 Semestre</Label>
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
                  1.4 Componente(s) curricular(es) (código e nome)
                </Label>
                <Controller
                  name="disciplinaIds"
                  control={control}
                  render={({ field }) => (
                    <Select
                      onValueChange={(value) => {
                        const disciplinaId = parseInt(value);
                        if (!field.value.includes(disciplinaId)) {
                          field.onChange([...field.value, disciplinaId]);
                        }
                      }}
                      disabled={!departamentoSelecionado}
                    >
                      <SelectTrigger
                        className={errors.disciplinaIds ? 'border-red-500' : ''}
                      >
                        <SelectValue placeholder="Escolha um dos componentes curriculares cadastrados" />
                      </SelectTrigger>
                      <SelectContent>
                        {disciplinasFiltradas?.map((disciplina) => (
                          <SelectItem
                            key={disciplina.id}
                            value={disciplina.id.toString()}
                          >
                            {disciplina.codigo} - {disciplina.nome}
                          </SelectItem>
                        ))}
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

          {/* Pré-visualização do edital */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Pré-visualização do edital
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-muted/20 border rounded-md p-8 text-center">
                <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  A pré-visualização do edital será gerada após o preenchimento
                  dos campos obrigatórios.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Botão de Finalizar */}
          <div className="flex justify-center">
            <Button
              type="submit"
              size="lg"
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8"
            >
              {isSubmitting ? 'Criando projeto...' : 'Finalizar'}
            </Button>
          </div>
        </form>
      </div>
    </PagesLayout>
  );
}
