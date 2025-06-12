'use client'

import { PagesLayout } from '@/components/layout/PagesLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { usePeriodosInscricao } from '@/hooks/use-periodo-inscricao';
import { Calendar, Plus, Clock, CheckCircle, AlertTriangle, Loader, Edit, Eye } from 'lucide-react';
import { useMemo } from 'react';

export default function PeriodosInscricaoPage() {
  const { data: periodos, isLoading } = usePeriodosInscricao();

  const stats = useMemo(() => {
    if (!periodos) return { ativos: 0, planejados: 0, encerrados: 0, total: 0 };
    
    return periodos.reduce(
      (acc, periodo) => {
        acc.total++;
        if (periodo.statusAtual === 'ATIVO') acc.ativos++;
        else if (periodo.statusAtual === 'FUTURO') acc.planejados++;
        else if (periodo.statusAtual === 'ENCERRADO') acc.encerrados++;
        return acc;
      },
      { ativos: 0, planejados: 0, encerrados: 0, total: 0 }
    );
  }, [periodos]);

  const dashboardActions = (
    <Button variant="primary">
      <Plus className="w-4 h-4 mr-2" />
      Novo Período
    </Button>
  );

  if (isLoading) {
    return (
      <PagesLayout title="Períodos de Inscrição" subtitle="Gerenciar períodos de inscrição para monitoria" actions={dashboardActions}>
        <div className="flex justify-center items-center py-8">
          <Loader className="h-8 w-8 animate-spin" />
          <span className="ml-2">Carregando períodos...</span>
        </div>
      </PagesLayout>
    );
  }

  return (
    <PagesLayout 
      title="Períodos de Inscrição" 
      subtitle="Gerenciar períodos de inscrição para monitoria"
      actions={dashboardActions}
    >
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Períodos Ativos
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats.ativos}
            </div>
            <p className="text-xs text-muted-foreground">
              Períodos em andamento
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Períodos Planejados
            </CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {stats.planejados}
            </div>
            <p className="text-xs text-muted-foreground">
              Aguardando início
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Períodos Encerrados
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">
              {stats.encerrados}
            </div>
            <p className="text-xs text-muted-foreground">
              Períodos finalizados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total de Períodos
            </CardTitle>
            <Calendar className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-700">
              {stats.total}
            </div>
            <p className="text-xs text-muted-foreground">
              Períodos cadastrados
            </p>
          </CardContent>
        </Card>
      </div>

      {periodos && periodos.length > 0 ? (
        <div className="space-y-4">
          {periodos.map((periodo) => (
            <Card key={periodo.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">
                      {periodo.semestre === 'SEMESTRE_1' ? '1º' : '2º'} Semestre {periodo.ano}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {new Date(periodo.dataInicio).toLocaleDateString('pt-BR')} até {new Date(periodo.dataFim).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {periodo.statusAtual === 'ATIVO' && (
                      <Badge variant="default" className="bg-green-500">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Ativo
                      </Badge>
                    )}
                    {periodo.statusAtual === 'FUTURO' && (
                      <Badge variant="secondary" className="bg-blue-500 text-white">
                        <Clock className="w-3 h-3 mr-1" />
                        Planejado
                      </Badge>
                    )}
                    {periodo.statusAtual === 'ENCERRADO' && (
                      <Badge variant="outline">
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        Encerrado
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="font-medium text-muted-foreground">Projetos</p>
                    <p className="text-lg font-semibold">{periodo.totalProjetos}</p>
                  </div>
                  <div>
                    <p className="font-medium text-muted-foreground">Inscrições</p>
                    <p className="text-lg font-semibold">{periodo.totalInscricoes}</p>
                  </div>
                  <div>
                    <p className="font-medium text-muted-foreground">Data Início</p>
                    <p>{new Date(periodo.dataInicio).toLocaleDateString('pt-BR')}</p>
                  </div>
                  <div>
                    <p className="font-medium text-muted-foreground">Ações</p>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Eye className="w-3 h-3 mr-1" />
                        Ver
                      </Button>
                      <Button variant="outline" size="sm">
                        <Edit className="w-3 h-3 mr-1" />
                        Editar
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-8 text-center">
            <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhum período cadastrado
            </h3>
            <p className="text-gray-500 mb-4">
              Comece criando um novo período de inscrição para monitoria.
            </p>
            <Button variant="primary">
              <Plus className="w-4 h-4 mr-2" />
              Criar Primeiro Período
            </Button>
          </CardContent>
        </Card>
      )}
    </PagesLayout>
  );
} 