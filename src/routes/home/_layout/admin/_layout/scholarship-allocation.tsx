import { createFileRoute } from '@tanstack/react-router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useProjetos } from '@/hooks/use-projeto'; // Corrigido para useProjetos
import { useUpdateProjectAllocations } from '@/hooks/use-projeto-allocations';
import { useState } from 'react';
import type { ProjetoListItem } from '@/routes/api/projeto/-types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, Save } from 'lucide-react';

export const Route = createFileRoute('/home/_layout/admin/_layout/scholarship-allocation')({
  component: ScholarshipAllocationPage,
});

// Interface para o estado local de edição
interface EditableAllocation extends Partial<ProjetoListItem> {
  id: number;
  editBolsasDisponibilizadas?: string | number;
  editVoluntariosSolicitados?: string | number;
  editFeedbackAdmin?: string;
  isEditing?: boolean;
}

function ScholarshipAllocationPage() {
  const currentYear = new Date().getFullYear();
  const [filterYear, setFilterYear] = useState<string>(currentYear.toString());
  const [filterSemester, setFilterSemester] = useState<'SEMESTRE_1' | 'SEMESTRE_2' | 'ALL'>(
    new Date().getMonth() < 6 ? 'SEMESTRE_1' : 'SEMESTRE_2'
  );
  // TODO: Adicionar filtro de departamento se necessário

  // Corrigida a chamada do hook e removidos os parâmetros de filtro não suportados
  const { data: todosProjetos, isLoading, error } = useProjetos(); 

  const updateAllocationsMutation = useUpdateProjectAllocations();

  const [editableProjetos, setEditableProjetos] = useState<Record<number, EditableAllocation>>({});

  const handleEditChange = (
    projectId: number,
    field: keyof EditableAllocation,
    value: string | number,
  ) => {
    setEditableProjetos((prev) => ({
      ...prev,
      [projectId]: {
        ...prev[projectId],
        id: projectId,
        [field]: value,
        isEditing: true,
      },
    }));
  };

  const handleSave = (projectId: number) => {
    const editedData = editableProjetos[projectId];
    if (!editedData) return;

    const originalProject = todosProjetos?.find((p: ProjetoListItem) => p.id === projectId);
    if (!originalProject) return;

    const payload: Partial<EditableAllocation> = {};
    let hasChanges = false;

    // Tratar bolsasDisponibilizadas
    let bolsasDisp: number | undefined;
    if (editedData.editBolsasDisponibilizadas !== undefined) {
      bolsasDisp = parseInt(String(editedData.editBolsasDisponibilizadas), 10);
      if (isNaN(bolsasDisp)) bolsasDisp = 0; // Default para 0 se NaN
    } else {
      bolsasDisp = originalProject.bolsasDisponibilizadas === null ? 0 : originalProject.bolsasDisponibilizadas;
    }
    // Garantir que bolsasDisp não seja undefined aqui para comparação, mas pode ser para o payload
    const currentBolsasDisponibilizadas = bolsasDisp ?? 0;

    // Tratar voluntariosSolicitados (agora chamado voluntariosAjuste na UI, mas no backend é voluntariosSolicitados)
    let voluntariosSol: number | undefined;
    if (editedData.editVoluntariosSolicitados !== undefined) {
      voluntariosSol = parseInt(String(editedData.editVoluntariosSolicitados), 10);
      if (isNaN(voluntariosSol)) voluntariosSol = 0; // Default para 0 se NaN
    } else {
      // No backend, o campo que o admin pode ajustar para voluntários é `voluntariosSolicitados` do projeto.
      // Se o admin não editar, mantém o valor original (ou 0 se null).
      voluntariosSol = originalProject.voluntariosSolicitados === null ? 0 : originalProject.voluntariosSolicitados;
    }
    const currentVoluntariosSolicitados = voluntariosSol ?? 0;

    const feedbackAdmin = editedData.editFeedbackAdmin !== undefined 
      ? editedData.editFeedbackAdmin 
      : (originalProject.feedbackAdmin === null ? undefined : originalProject.feedbackAdmin);

    // Verificar mudanças e validar bolsasDisponibilizadas
    if (currentBolsasDisponibilizadas !== (originalProject.bolsasDisponibilizadas ?? 0)) {
      if (currentBolsasDisponibilizadas > (originalProject.bolsasSolicitadas ?? 0)) {
        alert('Número de bolsas disponibilizadas não pode exceder o solicitado pelo professor.');
        return;
      }
      payload.bolsasDisponibilizadas = currentBolsasDisponibilizadas;
      hasChanges = true;
    }

    if (currentVoluntariosSolicitados !== (originalProject.voluntariosSolicitados ?? 0)) {
      payload.voluntariosSolicitados = currentVoluntariosSolicitados;
      hasChanges = true;
    }

    if (feedbackAdmin !== (originalProject.feedbackAdmin === null ? undefined : originalProject.feedbackAdmin)) {
      payload.feedbackAdmin = feedbackAdmin;
      hasChanges = true;
    }

    if (hasChanges) {
      updateAllocationsMutation.mutate({
        projetoId: projectId, 
        data: payload as any, 
      }, {
        onSuccess: () => {
          setEditableProjetos(prev => ({
            ...prev,
            [projectId]: { ...prev[projectId], isEditing: false }
          }));
        }
      });
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'APPROVED': return 'success';
      case 'PENDING_ADMIN_SIGNATURE':
      case 'SUBMITTED': return 'warning';
      case 'PENDING_PROFESSOR_SIGNATURE': return 'outline';
      case 'REJECTED': return 'destructive';
      case 'DRAFT':
      default: return 'secondary';
    }
  };

  // Aplicar filtros no cliente
  const filteredProjetos = todosProjetos?.filter((p: ProjetoListItem) => {
    const anoMatch = filterYear ? p.ano === parseInt(filterYear) : true;
    const semesterMatch = filterSemester && filterSemester !== 'ALL' ? p.semestre === filterSemester : true;
    return anoMatch && semesterMatch;
  }) || [];

  const relevantProjetos = filteredProjetos.filter((p: ProjetoListItem) => 
    ['SUBMITTED', 'PENDING_ADMIN_SIGNATURE', 'APPROVED'].includes(p.status)
  );

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Alocação de Bolsas e Voluntários</h1>
          <p className="text-muted-foreground">
            Defina ou ajuste o número de bolsas e voluntários para os projetos.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-2">
            <div>
              <Label htmlFor="filterYear">Ano</Label>
              <Select value={filterYear} onValueChange={setFilterYear}>
                <SelectTrigger id="filterYear"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[currentYear, currentYear - 1, currentYear + 1].map(year => (
                    <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="filterSemester">Semestre</Label>
              <Select value={filterSemester} onValueChange={(v) => setFilterSemester(v as any)}>
                <SelectTrigger id="filterSemester"><SelectValue placeholder="Todos" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todos os Semestres</SelectItem>
                  <SelectItem value="SEMESTRE_1">1º Semestre</SelectItem>
                  <SelectItem value="SEMESTRE_2">2º Semestre</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {/* TODO: Filtro por Departamento */}
          </div>
        </CardHeader>
        <CardContent>
          {isLoading && (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          )}
          {error && (
            <div className="text-red-600 p-4 border border-red-300 bg-red-50 rounded-md">
              <AlertCircle className="inline mr-2 h-5 w-5" /> Erro ao carregar projetos: {error.message}
            </div>
          )}
          {!isLoading && !error && relevantProjetos.length === 0 && (
            <p className="text-center text-muted-foreground py-8">Nenhum projeto encontrado para os filtros selecionados que necessite de alocação.</p>
          )}
          {!isLoading && !error && relevantProjetos.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[250px]">Projeto (ID)</TableHead>
                  <TableHead>Professor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-center">Bolsas Solicit.</TableHead>
                  <TableHead className="text-center w-[150px]">Bolsas Disp.</TableHead>
                  <TableHead className="text-center">Volunt. Solicit.</TableHead>
                  <TableHead className="text-center w-[150px]">Volunt. Ajuste</TableHead>
                  <TableHead>Feedback Admin</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {relevantProjetos.map((projeto: ProjetoListItem) => {
                  const editState = editableProjetos[projeto.id] || {};
                  const currentBolsasDisp = editState.editBolsasDisponibilizadas !== undefined 
                                            ? editState.editBolsasDisponibilizadas 
                                            : projeto.bolsasDisponibilizadas ?? 0;
                  const currentVolSol = editState.editVoluntariosSolicitados !== undefined
                                          ? editState.editVoluntariosSolicitados
                                          : projeto.voluntariosSolicitados ?? 0;
                  const currentFeedback = editState.editFeedbackAdmin !== undefined
                                          ? editState.editFeedbackAdmin
                                          : projeto.feedbackAdmin ?? '';
                  return (
                    <TableRow key={projeto.id}>
                      <TableCell>
                        <div className="font-medium">{projeto.titulo}</div>
                        <div className="text-xs text-muted-foreground">ID: {projeto.id}</div>
                      </TableCell>
                      <TableCell>{projeto.professorResponsavelNome}</TableCell>
                      <TableCell><Badge variant={getStatusVariant(projeto.status) as any}>{projeto.status}</Badge></TableCell>
                      <TableCell className="text-center">{projeto.bolsasSolicitadas}</TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min={0}
                          max={projeto.bolsasSolicitadas} // Não pode alocar mais que o solicitado
                          value={currentBolsasDisp}
                          onChange={(e) => handleEditChange(projeto.id, 'editBolsasDisponibilizadas', e.target.value)}
                          className="h-8 text-center"
                        />
                      </TableCell>
                      <TableCell className="text-center">{projeto.voluntariosSolicitados}</TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min={0}
                          value={currentVolSol}
                          onChange={(e) => handleEditChange(projeto.id, 'editVoluntariosSolicitados', e.target.value)}
                          className="h-8 text-center"
                        />
                      </TableCell>
                       <TableCell>
                        <Input
                          type="text"
                          placeholder="Observações..."
                          value={currentFeedback}
                          onChange={(e) => handleEditChange(projeto.id, 'editFeedbackAdmin', e.target.value)}
                          className="h-8"
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          onClick={() => handleSave(projeto.id)}
                          disabled={updateAllocationsMutation.isPending || !editState.isEditing}
                        >
                          <Save className="mr-2 h-4 w-4" /> Salvar
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 