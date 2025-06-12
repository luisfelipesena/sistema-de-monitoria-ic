'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { api } from '@/utils/api'
import { FileText, Download, User, Award, Users } from 'lucide-react'

export default function TermosCompromissoPage() {
  const { toast } = useToast()
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null)

  // Buscar projetos do professor
  const { data: projetos, isLoading: loadingProjetos } = api.projeto.getProjetos.useQuery()

  // Buscar vagas do projeto selecionado
  const { data: vagasProjeto, isLoading: loadingVagas } = api.vagas.getVagasByProject.useQuery(
    { projetoId: selectedProjectId!.toString() },
    { enabled: !!selectedProjectId }
  )

  // Buscar status dos termos
  const { data: termosStatus, isLoading: loadingTermos } = api.termos.getTermosStatus.useQuery(
    { projetoId: selectedProjectId?.toString() },
    { enabled: !!selectedProjectId }
  )

  // Projetos que têm vagas ativas
  const projetosComVagas = projetos?.filter(p => 
    p.status === 'APPROVED'
  ) || []

  const handleSelectProject = (projectId: string) => {
    const id = parseInt(projectId)
    setSelectedProjectId(id)
  }

  const getStatusBadge = (tipoBolsa: string) => {
    switch (tipoBolsa) {
      case 'bolsista':
        return <Badge className="bg-green-500">Monitor Bolsista</Badge>
      case 'voluntario':
        return <Badge className="bg-blue-500">Monitor Voluntário</Badge>
      default:
        return <Badge variant="outline">{tipoBolsa}</Badge>
    }
  }

  const getTipoIcon = (tipoBolsa: string) => {
    switch (tipoBolsa) {
      case 'bolsista':
        return <Award className="h-4 w-4 text-yellow-600" />
      case 'voluntario':
        return <Users className="h-4 w-4 text-blue-600" />
      default:
        return <User className="h-4 w-4 text-gray-500" />
    }
  }

  const getTermoStatusBadge = (statusTermo: string) => {
    switch (statusTermo) {
      case 'pendente_assinatura':
        return <Badge variant="outline" className="text-orange-600">Pendente Assinatura</Badge>
      case 'parcialmente_assinado':
        return <Badge variant="secondary" className="text-blue-600">Parcialmente Assinado</Badge>
      case 'assinado_completo':
        return <Badge className="bg-green-500">Assinado Completo</Badge>
      default:
        return <Badge variant="outline">{statusTermo}</Badge>
    }
  }

  // Component para gerar e baixar termo de compromisso
  function TermoCompromissoActions({ vagaId, alunoNome }: { vagaId: string, alunoNome: string }) {
    const generateTermoMutation = api.termos.generateTermo.useMutation({
      onSuccess: () => {
        toast({
          title: "Termo gerado com sucesso",
          description: "O termo de compromisso foi gerado e está disponível para download.",
        })
      },
      onError: (error) => {
        toast({
          title: "Erro ao gerar termo",
          description: error.message,
          variant: "destructive",
        })
      }
    })

    const downloadTermoMutation = api.termos.downloadTermo.useMutation({
      onSuccess: (data) => {
        // Create download link
        const link = document.createElement('a')
        link.href = data.downloadUrl
        link.download = data.fileName
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      },
      onError: (error) => {
        toast({
          title: "Erro ao baixar termo",
          description: error.message,
          variant: "destructive",
        })
      }
    })

    const handleGenerateTermo = () => {
      generateTermoMutation.mutate({ vagaId })
    }

    const handleDownloadTermo = () => {
      downloadTermoMutation.mutate({ vagaId })
    }

    return (
      <div className="flex gap-2">
        <Button 
          variant="outline" 
          size="sm"
          onClick={handleGenerateTermo}
          disabled={generateTermoMutation.isPending}
        >
          <FileText className="h-4 w-4 mr-1" />
          {generateTermoMutation.isPending ? 'Gerando...' : 'Gerar Termo'}
        </Button>
        <Button 
          variant="default" 
          size="sm"
          onClick={handleDownloadTermo}
          disabled={downloadTermoMutation.isPending}
        >
          <Download className="h-4 w-4 mr-1" />
          {downloadTermoMutation.isPending ? 'Baixando...' : 'Baixar'}
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Termos de Compromisso</h1>
        <p className="text-muted-foreground">
          Gerencie os termos de compromisso dos monitores aceitos em seus projetos
        </p>
      </div>

      {/* Seleção de Projeto */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Selecionar Projeto
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="projeto">Projeto de Monitoria</Label>
            <Select onValueChange={handleSelectProject} disabled={loadingProjetos}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um projeto..." />
              </SelectTrigger>
              <SelectContent>
                {projetosComVagas.map((projeto) => (
                  <SelectItem key={projeto.id} value={projeto.id.toString()}>
                    <div className="flex flex-col">
                      <span className="font-medium">{projeto.titulo}</span>
                      <span className="text-sm text-muted-foreground">
                        {projeto.ano}.{projeto.semestre === 'SEMESTRE_1' ? '1' : '2'}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Vagas Ativas */}
      {selectedProjectId && (
        <Card>
          <CardHeader>
            <CardTitle>Vagas Ativas do Projeto</CardTitle>
            <p className="text-sm text-muted-foreground">
              {loadingVagas ? 'Carregando...' : `${vagasProjeto?.vagas.length || 0} vaga(s) ativa(s)`}
            </p>
          </CardHeader>
          <CardContent>
            {loadingVagas ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Carregando vagas...</p>
              </div>
            ) : !vagasProjeto || vagasProjeto.vagas.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Nenhuma vaga ativa</h3>
                <p className="text-muted-foreground">
                  Este projeto ainda não possui vagas ativas.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {vagasProjeto.vagas.map((vaga: any) => {
                  const statusTermo = termosStatus?.find(t => t.vagaId === vaga.id)
                  return (
                    <div
                      key={vaga.id}
                      className="border rounded-lg p-4 bg-blue-50 border-blue-200"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            {getTipoIcon(vaga.tipoBolsa)}
                            <h3 className="font-semibold text-lg">{vaga.aluno.nomeCompleto}</h3>
                          </div>
                          <div className="space-y-1 text-sm text-muted-foreground mb-3">
                            <p>Matrícula: {vaga.aluno.matricula}</p>
                            <p>E-mail: {vaga.aluno.user.email}</p>
                            <p>CR: {vaga.aluno.cr?.toFixed(2) || 'N/A'}</p>
                            <p>Data de Início: {vaga.dataInicio ? new Date(vaga.dataInicio).toLocaleDateString('pt-BR') : 'N/A'}</p>
                          </div>
                          <div className="flex items-center gap-2 mb-3">
                            {getStatusBadge(vaga.tipoBolsa)}
                            {statusTermo && getTermoStatusBadge(statusTermo.statusTermo)}
                          </div>
                          {statusTermo?.observacoes && (
                            <div className="text-sm text-muted-foreground bg-yellow-50 p-2 rounded">
                              <strong>Observações:</strong> {statusTermo.observacoes}
                            </div>
                          )}
                        </div>
                        
                        {/* Ações do Termo */}
                        <div className="ml-4">
                          <TermoCompromissoActions 
                            vagaId={vaga.id.toString()}
                            alunoNome={vaga.aluno.nomeCompleto}
                          />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Resumo dos Status dos Termos */}
      {selectedProjectId && termosStatus && termosStatus.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Resumo dos Termos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center mb-4">
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold">{termosStatus.length}</div>
                <div className="text-sm text-muted-foreground">Total de Vagas</div>
              </div>
              <div className="p-3 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">
                  {termosStatus.filter(t => t.statusTermo === 'pendente_assinatura').length}
                </div>
                <div className="text-sm text-muted-foreground">Pendentes</div>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {termosStatus.filter(t => t.statusTermo === 'parcialmente_assinado').length}
                </div>
                <div className="text-sm text-muted-foreground">Parciais</div>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {termosStatus.filter(t => t.statusTermo === 'assinado_completo').length}
                </div>
                <div className="text-sm text-muted-foreground">Completos</div>
              </div>
            </div>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>• Os termos de compromisso devem ser assinados por ambas as partes (monitor e professor).</p>
              <p>• Gere o termo antes de enviar para assinatura do aluno.</p>
              <p>• Mantenha uma cópia do termo assinado para seus registros.</p>
              <p>• O termo estabelece as responsabilidades e obrigações durante o período de monitoria.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Informações Adicionais */}
      {selectedProjectId && vagasProjeto && vagasProjeto.vagas.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Informações Importantes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <p>• Os termos de compromisso devem ser assinados por ambas as partes (monitor e professor).</p>
              <p>• Mantenha uma cópia do termo assinado para seus registros.</p>
              <p>• O termo estabelece as responsabilidades e obrigações durante o período de monitoria.</p>
              <p>• Em caso de descumprimento, o termo pode ser usado como base para cancelamento da monitoria.</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}