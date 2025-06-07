'use client';

import { useProjetos } from '@/hooks/use-projeto';
import { createFileRoute } from '@tanstack/react-router';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/utils/api-client';
import { QueryKeys } from '@/hooks/query-keys';
import { toast } from 'sonner';
import { Award, Check, Loader2 } from 'lucide-react';
import { PagesLayout } from '@/components/layout/PagesLayout';
import type { ProjetoResponse, ProjetoListItem } from '@/routes/api/projeto/-types';

// This hook should be in its own file, but placing it here as a workaround.
function useScholarshipAllocation() {
  const queryClient = useQueryClient();
  return useMutation<
    ProjetoResponse,
    Error,
    { projetoId: number; bolsasDisponibilizadas: number }
  >({
    mutationFn: async ({ projetoId, bolsasDisponibilizadas }) => {
      const response = await apiClient.post<ProjetoResponse>(
        `/projeto/${projetoId}/allocate-scholarships`,
        { bolsasDisponibilizadas },
      );
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: QueryKeys.projeto.list });
      queryClient.invalidateQueries({
        queryKey: QueryKeys.projeto.byId(data.id.toString()),
      });
    },
  });
}

export const Route = createFileRoute(
  '/home/_layout/admin/_layout/scholarship-allocation',
)({
  component: ScholarshipAllocationComponent,
});

function AllocationRow({ projeto }: { projeto: ProjetoListItem }) {
  const [allocated, setAllocated] = useState(
    projeto.bolsasDisponibilizadas || 0,
  );
  const allocationMutation = useScholarshipAllocation();

  const handleSave = () => {
    toast.promise(
      allocationMutation.mutateAsync({
        projetoId: projeto.id,
        bolsasDisponibilizadas: Number(allocated),
      }),
      {
        loading: 'Salvando...',
        success: 'Bolsas alocadas com sucesso!',
        error: 'Erro ao salvar.',
      },
    );
  };

  return (
    <TableRow>
      <TableCell className="font-medium">{projeto.titulo}</TableCell>
      <TableCell>{projeto.departamentoNome}</TableCell>
      <TableCell className="text-center">{projeto.bolsasSolicitadas}</TableCell>
      <TableCell>
        <Input
          type="number"
          min={0}
          value={allocated}
          onChange={(e) => setAllocated(Number(e.target.value))}
          className="w-24 mx-auto"
        />
      </TableCell>
      <TableCell className="text-right">
        <Button
          size="sm"
          onClick={handleSave}
          disabled={allocationMutation.isPending}
          className="w-28"
        >
          {allocationMutation.isPending ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Check className="h-4 w-4 mr-2" />
          )}
          Salvar
        </Button>
      </TableCell>
    </TableRow>
  );
    }

function ScholarshipAllocationComponent() {
  const { data: projetos, isLoading } = useProjetos();

  const approvedProjects =
    projetos?.filter((p) => p.status === 'APPROVED') || [];

  return (
    <PagesLayout
      title="Alocação de Bolsas"
      subtitle="Distribua as bolsas de monitoria para os projetos aprovados."
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Distribuir Bolsas de Monitoria
          </CardTitle>
          <CardDescription>
            Defina o número de bolsas que cada projeto aprovado receberá neste
            semestre. Apenas projetos com status "APPROVED" são listados aqui.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40%]">Projeto</TableHead>
                  <TableHead>Departamento</TableHead>
                  <TableHead className="text-center">Solicitadas</TableHead>
                  <TableHead className="text-center">Alocadas</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {approvedProjects.length > 0 ? (
                  approvedProjects.map((projeto) => (
                    <AllocationRow key={projeto.id} projeto={projeto} />
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      Nenhum projeto aprovado encontrado para alocação de bolsas.
                      </TableCell>
                    </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </PagesLayout>
  );
} 