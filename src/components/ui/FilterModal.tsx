import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useDepartamentoList } from '@/hooks/use-departamento';
import { 
  SUBMITTED, 
  SELECTED_BOLSISTA, 
  SELECTED_VOLUNTARIO,
  ACCEPTED_BOLSISTA,
  ACCEPTED_VOLUNTARIO,
  REJECTED_BY_PROFESSOR,
  WAITING_LIST
} from '@/types';
import { useState } from 'react';

export interface FilterValues {
  status?: string;
  departamento?: string;
  semestre?: string;
  ano?: string;
  tipoVaga?: string;
}

interface FilterModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: 'admin' | 'professor' | 'student';
  onApplyFilters: (filters: FilterValues) => void;
  initialFilters?: FilterValues;
}

export function FilterModal({
  open,
  onOpenChange,
  type,
  onApplyFilters,
  initialFilters = {},
}: FilterModalProps) {
  const [filters, setFilters] = useState<FilterValues>(initialFilters);
  const { data: departamentos } = useDepartamentoList();

  const handleApply = () => {
    onApplyFilters(filters);
    onOpenChange(false);
  };

  const handleClear = () => {
    const clearedFilters: FilterValues = {};
    setFilters(clearedFilters);
    onApplyFilters(clearedFilters);
    onOpenChange(false);
  };

  const getStatusOptions = () => {
    if (type === 'student') {
      return [
        { value: SUBMITTED, label: 'Inscrito' },
        { value: SELECTED_BOLSISTA, label: 'Selecionado (Bolsista)' },
        { value: SELECTED_VOLUNTARIO, label: 'Selecionado (Voluntário)' },
        { value: ACCEPTED_BOLSISTA, label: 'Aprovado (Bolsista)' },
        { value: ACCEPTED_VOLUNTARIO, label: 'Aprovado (Voluntário)' },
        { value: REJECTED_BY_PROFESSOR, label: 'Rejeitado' },
        { value: WAITING_LIST, label: 'Lista de Espera' },
      ];
    }

    return [
      { value: 'DRAFT', label: 'Rascunho' },
      { value: 'SUBMITTED', label: 'Submetido' },
      { value: 'APPROVED', label: 'Aprovado' },
      { value: 'REJECTED', label: 'Rejeitado' },
    ];
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Filtros</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Status Filter */}
          <div>
            <Label htmlFor="status">Status</Label>
            <Select
              value={filters.status || 'all'}
              onValueChange={(value) =>
                setFilters((prev) => ({
                  ...prev,
                  status: value === 'all' ? undefined : value,
                }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos os status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                {getStatusOptions().map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Department Filter (Admin only) */}
          {type === 'admin' && (
            <div>
              <Label htmlFor="departamento">Departamento</Label>
              <Select
                value={filters.departamento || 'all'}
                onValueChange={(value) =>
                  setFilters((prev) => ({
                    ...prev,
                    departamento: value === 'all' ? undefined : value,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos os departamentos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os departamentos</SelectItem>
                  {departamentos?.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id.toString()}>
                      {dept.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Semester Filter */}
          {type !== 'student' && (
            <div>
              <Label htmlFor="semestre">Semestre</Label>
              <Select
                value={filters.semestre || 'all'}
                onValueChange={(value) =>
                  setFilters((prev) => ({
                    ...prev,
                    semestre: value === 'all' ? undefined : value,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos os semestres" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os semestres</SelectItem>
                  <SelectItem value="SEMESTRE_1">2025.1</SelectItem>
                  <SelectItem value="SEMESTRE_2">2025.2</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Year Filter */}
          {type !== 'student' && (
            <div>
              <Label htmlFor="ano">Ano</Label>
              <Select
                value={filters.ano || 'all'}
                onValueChange={(value) =>
                  setFilters((prev) => ({
                    ...prev,
                    ano: value === 'all' ? undefined : value,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos os anos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os anos</SelectItem>
                  <SelectItem value="2024">2024</SelectItem>
                  <SelectItem value="2025">2025</SelectItem>
                  <SelectItem value="2026">2026</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Tipo de Vaga Filter (Student only) */}
          {type === 'student' && (
            <div>
              <Label htmlFor="tipoVaga">Tipo de Vaga</Label>
              <Select
                value={filters.tipoVaga || 'all'}
                onValueChange={(value) =>
                  setFilters((prev) => ({
                    ...prev,
                    tipoVaga: value === 'all' ? undefined : value,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos os tipos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  <SelectItem value="BOLSISTA">Bolsista</SelectItem>
                  <SelectItem value="VOLUNTARIO">Voluntário</SelectItem>
                  <SelectItem value="ANY">Qualquer</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClear}>
            Limpar Filtros
          </Button>
          <Button onClick={handleApply}>Aplicar Filtros</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
