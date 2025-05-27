import { Badge } from '@/components/ui/badge';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { DisciplinaWithProfessor } from '@/hooks/use-disciplina';
import type { DepartamentoResponse } from '@/routes/api/department/-types';
import { CircleAlert, Loader2 } from 'lucide-react';
import {
  Control,
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
  disciplinasFiltradas: DisciplinaWithProfessor[] | undefined;
  departamentoSelecionado: DepartamentoResponse | undefined;
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
  // Function to handle checking/unchecking a disciplina
  const handleDisciplinaChange = (disciplinaId: number) => {
    const isSelected = watchedDisciplinaIds.includes(disciplinaId);
    if (isSelected) {
      setValue(
        'disciplinaIds',
        watchedDisciplinaIds.filter((id) => id !== disciplinaId),
        { shouldValidate: true },
      );
    } else {
      setValue('disciplinaIds', [...watchedDisciplinaIds, disciplinaId], {
        shouldValidate: true,
      });
    }
  };

  return (
    <div className="space-y-6 bg-white p-6 rounded-lg border shadow-sm">
      <h2 className="text-lg font-semibold border-b pb-2">
        Identificação do Projeto
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField
          control={control}
          name="titulo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Título do Projeto</FormLabel>
              <FormControl>
                <Input
                  placeholder="Digite o título do projeto"
                  {...field}
                  className="w-full"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="departamentoId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Departamento</FormLabel>
              <Select
                onValueChange={(value) => {
                  field.onChange(parseInt(value));
                  setValue('disciplinaIds', []); // Limpar disciplinas ao mudar departamento
                }}
                defaultValue={field.value?.toString()}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um departamento" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {departamentos?.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id.toString()}>
                      {dept.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="grid grid-cols-1 gap-4">
        <FormField
          control={control}
          name="disciplinaIds"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Disciplinas</FormLabel>
              <div className="border rounded-md p-4 bg-gray-50">
                {!departamentoSelecionado ? (
                  <div className="text-center py-6">
                    <p className="text-gray-500">
                      Selecione um departamento para ver as disciplinas
                      disponíveis
                    </p>
                  </div>
                ) : loadingDisciplinas ? (
                  <div className="flex justify-center items-center py-6">
                    <Loader2 className="w-5 h-5 animate-spin text-blue-500 mr-2" />
                    <span className="text-sm text-gray-600">
                      Carregando disciplinas...
                    </span>
                  </div>
                ) : disciplinasFiltradas && disciplinasFiltradas.length > 0 ? (
                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {disciplinasFiltradas.map((disciplina) => {
                      const isSelected = field.value?.includes(disciplina.id);
                      return (
                        <div
                          key={disciplina.id}
                          className={`px-4 py-3 border rounded-md flex justify-between items-center ${
                            isSelected ? 'bg-blue-50 border-blue-300' : ''
                          }`}
                        >
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id={`disciplina-${disciplina.id}`}
                              value={disciplina.id}
                              checked={isSelected}
                              onChange={() =>
                                handleDisciplinaChange(disciplina.id)
                              }
                              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <label
                              htmlFor={`disciplina-${disciplina.id}`}
                              className={`text-sm ${isSelected ? 'font-medium' : ''}`}
                            >
                              <span className="font-medium">
                                {disciplina.codigo}
                              </span>{' '}
                              - {disciplina.nome}
                              {disciplina.professorResponsavel && (
                                <span className="ml-2 text-xs text-gray-500">
                                  (Prof. {disciplina.professorResponsavel})
                                </span>
                              )}
                            </label>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <CircleAlert className="h-6 w-6 text-yellow-500 mx-auto mb-2" />
                    <p className="text-gray-600">
                      Nenhuma disciplina encontrada para este departamento.
                    </p>
                  </div>
                )}
              </div>
              <FormMessage />
              {watchedDisciplinaIds.length > 0 && (
                <div className="mt-2">
                  <p className="text-sm font-medium mb-1">
                    Disciplinas selecionadas ({watchedDisciplinaIds.length}):
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {watchedDisciplinaIds.map((id) => {
                      const disciplina = disciplinasFiltradas?.find(
                        (d) => d.id === id,
                      );
                      return (
                        <Badge
                          key={id}
                          variant="outline"
                          className="flex items-center gap-1 bg-blue-50"
                        >
                          {disciplina?.codigo}
                          <button
                            type="button"
                            className="ml-1 text-gray-500 hover:text-gray-700 focus:outline-none"
                            onClick={() => handleDisciplinaChange(id)}
                          >
                            ×
                          </button>
                        </Badge>
                      );
                    })}
                  </div>
                </div>
              )}
            </FormItem>
          )}
        />
      </div>

      {isAdminForm && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={control}
            name="professorResponsavelId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Professor Responsável</FormLabel>
                <Select
                  onValueChange={(value) => field.onChange(parseInt(value))}
                  defaultValue={field.value?.toString()}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o professor responsável" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {professores?.map((prof) => (
                      <SelectItem key={prof.id} value={prof.id.toString()}>
                        {prof.nomeCompleto}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      )}

      <div className="grid grid-cols-1 gap-4">
        <FormField
          control={control}
          name="descricao"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição do Projeto</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Descreva os objetivos e justificativa do projeto"
                  {...field}
                  className="min-h-[100px]"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField
          control={control}
          name="publicoAlvo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Público Alvo</FormLabel>
              <FormControl>
                <Input
                  placeholder="Ex: Estudantes de Ciência da Computação"
                  {...field}
                  className="w-full"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="estimativaPessoasBenificiadas"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Estimativa de Pessoas Beneficiadas</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder="Ex: 50"
                  {...field}
                  onChange={(e) => {
                    const value = parseInt(e.target.value);
                    field.onChange(isNaN(value) ? '' : value);
                  }}
                  className="w-full"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}
