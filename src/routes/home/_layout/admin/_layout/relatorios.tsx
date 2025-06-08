import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useDepartamentoList } from '@/hooks/use-departamento';
import { useProgradExport } from '@/hooks/use-relatorios';
import { zodResolver } from '@hookform/resolvers/zod';
import { createFileRoute } from '@tanstack/react-router';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { selectDepartamentoTableSchema } from '@/server/database/schema';

export const Route = createFileRoute('/home/_layout/admin/_layout/relatorios')({
  component: RelatoriosComponent,
});

const reportSchema = z.object({
  ano: z.coerce.number().int().min(2020).max(new Date().getFullYear() + 1),
  semestre: z.enum(['SEMESTRE_1', 'SEMESTRE_2']),
  departamentoId: z.coerce.number().int().optional(),
});

type ReportForm = z.infer<typeof reportSchema>;
type Departamento = z.infer<typeof selectDepartamentoTableSchema>;

function RelatoriosComponent() {
  const exportMutation = useProgradExport();
  const { data: departamentos, isLoading: isLoadingDepartamentos } = useDepartamentoList();

  const form = useForm<ReportForm>({
    resolver: zodResolver(reportSchema),
    defaultValues: {
      ano: new Date().getFullYear(),
      semestre: new Date().getMonth() < 6 ? 'SEMESTRE_1' : 'SEMESTRE_2',
    },
  });

  const onSubmit = (data: ReportForm) => {
    toast.promise(exportMutation.mutateAsync(data), {
      loading: 'Gerando relatório...',
      success: 'Relatório gerado com sucesso! O download começará em breve.',
      error: 'Falha ao gerar o relatório.',
    });
  };

  return (
    <div className="p-4">
        <Card>
          <CardHeader>
          <CardTitle>Relatórios para PROGRAD</CardTitle>
          <CardDescription>
            Gere e baixe as planilhas de monitoria no formato exigido pela
            PROGRAD. Selecione os filtros desejados.
          </CardDescription>
          </CardHeader>
          <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="ano">Ano</Label>
                <input
                  id="ano"
                  type="number"
                  {...form.register('ano')}
                  className="w-full p-2 border rounded"
                />
                </div>
                <div>
                  <Label htmlFor="semestre">Semestre</Label>
                  <Select
                  onValueChange={(value) => form.setValue('semestre', value as any)}
                  defaultValue={form.getValues('semestre')}
                  >
                    <SelectTrigger id="semestre">
                    <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SEMESTRE_1">1º Semestre</SelectItem>
                      <SelectItem value="SEMESTRE_2">2º Semestre</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                <Label htmlFor="departamentoId">Departamento (Opcional)</Label>
                    <Select
                  onValueChange={(value) => form.setValue('departamentoId', Number(value))}
                    >
                  <SelectTrigger id="departamentoId">
                        <SelectValue placeholder="Todos os departamentos" />
                      </SelectTrigger>
                      <SelectContent>
                    {isLoadingDepartamentos ? (
                      <SelectItem value="loading" disabled>Carregando...</SelectItem>
                    ) : (
                      departamentos?.map((dept: Departamento) => (
                        <SelectItem key={dept.id} value={String(dept.id)}>
                          {dept.nome}
                        </SelectItem>
                      ))
                    )}
                      </SelectContent>
                    </Select>
              </div>
            </div>

            <Button type="submit" disabled={exportMutation.isPending} className="w-full">
              {exportMutation.isPending ? 'Gerando...' : 'Gerar Planilha'}
            </Button>
          </form>
          </CardContent>
        </Card>
      </div>
  );
}
