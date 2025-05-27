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
import { Target } from 'lucide-react';
import {
  Control,
  Controller,
  FieldErrors,
  UseFormRegister,
} from 'react-hook-form';
import type { ProjetoFormData } from './types';

interface ProjectVacanciesSectionProps {
  register: UseFormRegister<ProjetoFormData>;
  control: Control<ProjetoFormData>;
  errors: FieldErrors<ProjetoFormData>;
}

export function ProjectVacanciesSection({
  register,
  control,
  errors,
}: ProjectVacanciesSectionProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          Configuração do Projeto
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="tipoProposicao">Tipo de Proposição</Label>
            <Controller
              name="tipoProposicao"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger
                    className={errors.tipoProposicao ? 'border-red-500' : ''}
                  >
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INDIVIDUAL">Individual</SelectItem>
                    <SelectItem value="COLETIVA">Coletiva</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            {errors.tipoProposicao && (
              <p className="text-sm text-red-500 mt-1">
                {errors.tipoProposicao.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="bolsasSolicitadas">
              Número de Bolsistas Solicitados
            </Label>
            <Input
              id="bolsasSolicitadas"
              type="number"
              min="0"
              placeholder="Ex: 2"
              {...register('bolsasSolicitadas', { valueAsNumber: true })}
              className={errors.bolsasSolicitadas ? 'border-red-500' : ''}
            />
            {errors.bolsasSolicitadas && (
              <p className="text-sm text-red-500 mt-1">
                {errors.bolsasSolicitadas.message}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="voluntariosSolicitados">
              Número de Voluntários Solicitados
            </Label>
            <Input
              id="voluntariosSolicitados"
              type="number"
              min="0"
              placeholder="Ex: 3"
              {...register('voluntariosSolicitados', { valueAsNumber: true })}
              className={errors.voluntariosSolicitados ? 'border-red-500' : ''}
            />
            {errors.voluntariosSolicitados && (
              <p className="text-sm text-red-500 mt-1">
                {errors.voluntariosSolicitados.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="cargaHorariaSemana">
              Carga Horária Semanal (horas)
            </Label>
            <Input
              id="cargaHorariaSemana"
              type="number"
              min="1"
              placeholder="Ex: 4"
              {...register('cargaHorariaSemana', { valueAsNumber: true })}
              className={errors.cargaHorariaSemana ? 'border-red-500' : ''}
            />
            {errors.cargaHorariaSemana && (
              <p className="text-sm text-red-500 mt-1">
                {errors.cargaHorariaSemana.message}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="numeroSemanas">Número de Semanas</Label>
            <Input
              id="numeroSemanas"
              type="number"
              min="1"
              placeholder="Ex: 16"
              {...register('numeroSemanas', { valueAsNumber: true })}
              className={errors.numeroSemanas ? 'border-red-500' : ''}
            />
            {errors.numeroSemanas && (
              <p className="text-sm text-red-500 mt-1">
                {errors.numeroSemanas.message}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
