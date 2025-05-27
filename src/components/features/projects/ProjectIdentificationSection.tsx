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
import type { DepartamentoResponse } from '@/routes/api/department/-types';
import { Info, Users } from 'lucide-react';
import {
  Control,
  Controller,
  FieldErrors,
  UseFormRegister,
  UseFormSetValue,
} from 'react-hook-form';
import type { ProjetoFormData } from './types';

interface ProjectIdentificationSectionProps {
  register: UseFormRegister<ProjetoFormData>;
  control: Control<ProjetoFormData>;
  setValue: UseFormSetValue<ProjetoFormData>;
  errors: FieldErrors<ProjetoFormData>;
  departamentos: DepartamentoResponse[] | undefined;
  professores: any[] | undefined;
  disciplinasFiltradas: any[] | undefined;
  departamentoSelecionado: number;
  loadingDisciplinas: boolean;
  user: any;
  watchedDisciplinaIds: number[];
  isAdminForm?: boolean;
}

export function ProjectIdentificationSection({
  register,
  control,
  setValue,
  errors,
  departamentos,
  professores,
  disciplinasFiltradas,
  departamentoSelecionado,
  loadingDisciplinas,
  user,
  watchedDisciplinaIds,
  isAdminForm = false,
}: ProjectIdentificationSectionProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
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
              1.2 Órgão responsável (Departamento)
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
                >
                  <SelectTrigger
                    className={errors.departamentoId ? 'border-red-500' : ''}
                  >
                    <SelectValue placeholder="Selecione o órgão" />
                  </SelectTrigger>
                  <SelectContent>
                    {departamentos?.map((dept) => (
                      <SelectItem key={dept.id} value={dept.id.toString()}>
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

          <div className="md:col-span-2">
            <Label htmlFor="coordenadorResponsavel">
              Coordenador Responsável pela Aprovação
            </Label>
            <Input
              id="coordenadorResponsavel"
              placeholder="Nome do coordenador que aprovou o projeto"
              value={isAdminForm ? user?.username || '' : ''}
              readOnly={isAdminForm}
              {...register('coordenadorResponsavel')}
            />
            {isAdminForm && (
              <p className="text-xs text-muted-foreground mt-1">
                <Info className="h-3 w-3 inline mr-1" />
                Como administrador, você será o coordenador responsável pela
                aprovação.
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
              placeholder="Ex: 2025"
              {...register('ano', { valueAsNumber: true })}
              className={errors.ano ? 'border-red-500' : ''}
            />
            {errors.ano && (
              <p className="text-sm text-red-500 mt-1">{errors.ano.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="semestre">1.4 Semestre</Label>
            <Controller
              name="semestre"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger
                    className={errors.semestre ? 'border-red-500' : ''}
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
            1.5 Componente(s) curricular(es)
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
                          : 'Adicionar componente curricular'
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {disciplinasFiltradas && disciplinasFiltradas.length > 0 ? (
                    disciplinasFiltradas.map((disciplina) => (
                      <SelectItem
                        key={disciplina.id}
                        value={disciplina.id.toString()}
                        disabled={watchedDisciplinaIds.includes(disciplina.id)}
                      >
                        {disciplina.codigo} - {disciplina.nome}
                        {disciplina.professorResponsavel && (
                          <div className="text-xs text-blue-600 font-medium mt-1">
                            <span className="bg-blue-50 px-1 py-0.5 rounded">
                              Professor: {disciplina.professorResponsavel}
                            </span>
                          </div>
                        )}
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

          <p className="text-xs text-muted-foreground mt-1">
            <Info className="h-3 w-3 inline mr-1" />
            Os professores responsáveis serão vinculados automaticamente às
            disciplinas selecionadas.
          </p>

          <div className="mt-2 space-y-1">
            {watchedDisciplinaIds.map((disciplinaId) => {
              const disciplina = disciplinasFiltradas?.find(
                (d) => d.id === disciplinaId,
              );
              return disciplina ? (
                <div
                  key={disciplinaId}
                  className="flex items-center justify-between bg-muted p-2 rounded text-sm"
                >
                  <div>
                    <span>
                      {disciplina.codigo} - {disciplina.nome}
                    </span>
                    {disciplina.professorResponsavel && (
                      <div className="text-xs text-blue-600 font-medium mt-1">
                        <span className="bg-blue-50 px-1 py-0.5 rounded">
                          Professor: {disciplina.professorResponsavel}
                        </span>
                      </div>
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const current = watchedDisciplinaIds;
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

        <div>
          <Label htmlFor="descricao">Descrição do Projeto</Label>
          <Textarea
            id="descricao"
            placeholder="Descreva os objetivos, metodologia e justificativa do projeto"
            rows={4}
            {...register('descricao')}
            className={errors.descricao ? 'border-red-500' : ''}
          />
          {errors.descricao && (
            <p className="text-sm text-red-500 mt-1">
              {errors.descricao.message}
            </p>
          )}
        </div>

        <div className="bg-blue-50 p-3 rounded-md border border-blue-200">
          <h4 className="text-sm font-medium text-blue-800 mb-1">
            <Info className="h-4 w-4 inline mr-1" />
            Importante: Novo fluxo de professores e disciplinas
          </h4>
          <p className="text-xs text-blue-700">
            {isAdminForm
              ? 'Como administrador, você está criando um projeto onde os professores serão automaticamente associados com base nas disciplinas selecionadas. Cada disciplina será vinculada ao seu professor responsável para o semestre atual.'
              : 'Os professores serão automaticamente associados às disciplinas selecionadas com base nas responsabilidades do semestre atual.'}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
