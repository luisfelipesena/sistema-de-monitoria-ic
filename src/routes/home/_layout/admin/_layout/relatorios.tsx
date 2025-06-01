import { PagesLayout } from '@/components/layout/PagesLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useDepartamentoList } from '@/hooks/use-departamento';
import { apiClient } from '@/utils/api-client';
import { createFileRoute } from '@tanstack/react-router';
import { Download, FileSpreadsheet, Loader, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

export const Route = createFileRoute('/home/_layout/admin/_layout/relatorios')({
  component: RelatoriosPage,
});

function RelatoriosPage() {
  const { data: departamentos, isLoading: loadingDepartamentos } =
    useDepartamentoList();
  const [isGenerating, setIsGenerating] = useState(false);
  const [filters, setFilters] = useState({
    ano: new Date().getFullYear().toString(),
    semestre: new Date().getMonth() <= 6 ? 'SEMESTRE_1' : 'SEMESTRE_2',
    departamentoId: 'ALL',
  });

  const handleGenerateReport = async () => {
    setIsGenerating(true);
    try {
      const params = new URLSearchParams();
      if (filters.ano) params.append('ano', filters.ano);
      if (filters.semestre) params.append('semestre', filters.semestre);
      if (filters.departamentoId && filters.departamentoId !== 'ALL')
        params.append('departamentoId', filters.departamentoId);

      const response = await apiClient.get(
        `/relatorios/planilhas-prograd?${params.toString()}`,
        {
          responseType: 'blob',
        },
      );

      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;

      const fileName =
        filters.departamentoId !== 'ALL'
          ? `monitores-${filters.ano}-${filters.semestre === 'SEMESTRE_1' ? '1' : '2'}-dept-${filters.departamentoId}.xlsx`
          : `monitores-${filters.ano}-${filters.semestre === 'SEMESTRE_1' ? '1' : '2'}-completo.xlsx`;

      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success('Relatório gerado com sucesso!');
    } catch (error: any) {
      console.error('Erro ao gerar relatório:', error);
      toast.error(
        error.response?.data?.error || 'Erro ao gerar relatório PROGRAD',
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  return (
    <PagesLayout
      title="Relatórios PROGRAD"
      subtitle="Geração de planilhas para envio à PROGRAD"
    >
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5" />
              Gerar Planilha de Monitores
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="ano">Ano</Label>
                  <Select
                    value={filters.ano}
                    onValueChange={(value) =>
                      setFilters({ ...filters, ano: value })
                    }
                  >
                    <SelectTrigger id="ano">
                      <SelectValue placeholder="Selecione o ano" />
                    </SelectTrigger>
                    <SelectContent>
                      {years.map((year) => (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="semestre">Semestre</Label>
                  <Select
                    value={filters.semestre}
                    onValueChange={(value) =>
                      setFilters({ ...filters, semestre: value })
                    }
                  >
                    <SelectTrigger id="semestre">
                      <SelectValue placeholder="Selecione o semestre" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SEMESTRE_1">1º Semestre</SelectItem>
                      <SelectItem value="SEMESTRE_2">2º Semestre</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="departamento">Departamento (opcional)</Label>
                  {loadingDepartamentos ? (
                    <Skeleton className="h-10 w-full" />
                  ) : (
                    <Select
                      value={filters.departamentoId}
                      onValueChange={(value) =>
                        setFilters({ ...filters, departamentoId: value })
                      }
                    >
                      <SelectTrigger id="departamento">
                        <SelectValue placeholder="Todos os departamentos" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ALL">
                          Todos os departamentos
                        </SelectItem>
                        {departamentos?.map((dept) => (
                          <SelectItem key={dept.id} value={dept.id.toString()}>
                            {dept.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                <h4 className="font-medium text-blue-900 mb-2">
                  Informações do Relatório
                </h4>
                <div className="text-sm text-blue-700 space-y-1">
                  <p>
                    <strong>Período:</strong> {filters.ano}.
                    {filters.semestre === 'SEMESTRE_1' ? '1' : '2'}
                  </p>
                  <p>
                    <strong>Departamento:</strong>{' '}
                    {filters.departamentoId !== 'ALL'
                      ? departamentos?.find(
                          (d) => d.id.toString() === filters.departamentoId,
                        )?.nome || 'Selecionando...'
                      : 'Todos os departamentos'}
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() =>
                    setFilters({
                      ano: new Date().getFullYear().toString(),
                      semestre:
                        new Date().getMonth() <= 6
                          ? 'SEMESTRE_1'
                          : 'SEMESTRE_2',
                      departamentoId: 'ALL',
                    })
                  }
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Limpar Filtros
                </Button>
                <Button
                  onClick={handleGenerateReport}
                  disabled={isGenerating}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isGenerating ? (
                    <>
                      <Loader className="h-4 w-4 mr-2 animate-spin" />
                      Gerando...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      Gerar Planilha
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Sobre o Relatório</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <div>
              <h4 className="font-medium text-foreground mb-2">
                O que contém:
              </h4>
              <ul className="list-disc list-inside space-y-1">
                <li>Resumo por departamento com totais de vagas e monitores</li>
                <li>
                  Lista completa de monitores ativos (bolsistas e voluntários)
                </li>
                <li>Dados detalhados dos projetos aprovados</li>
                <li>Informações de contato e matrícula dos monitores</li>
                <li>Carga horária e período de vigência</li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium text-foreground mb-2">Formato:</h4>
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="h-4 w-4 text-green-600" />
                <span>
                  Arquivo Excel (.xlsx) com múltiplas planilhas organizadas
                </span>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-foreground mb-2">
                Quando gerar:
              </h4>
              <ul className="list-disc list-inside space-y-1">
                <li>Após finalização do processo seletivo</li>
                <li>Para envio periódico à PROGRAD</li>
                <li>Para controle interno do departamento</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </PagesLayout>
  );
}
