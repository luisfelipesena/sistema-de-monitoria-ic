'use client'

import { useState } from 'react'
import { PDFViewer } from '@react-pdf/renderer'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/hooks/use-toast'
import { api } from '@/utils/api'
import { FileText, Send, Eye, CheckCircle } from 'lucide-react'

// Template simples para resultado - você pode expandir
function ResultadoTemplate({ data }: { data: any }) {
  return (
    <div style={{ fontFamily: 'Arial', padding: '20px' }}>
      <h1>Resultado da Seleção de Monitoria</h1>
      <h2>{data.projeto.titulo}</h2>
      <p><strong>Professor:</strong> {data.projeto.professorResponsavel.nomeCompleto}</p>
      <p><strong>Período:</strong> {data.projeto.ano}.{data.projeto.semestre === 'SEMESTRE_1' ? '1' : '2'}</p>
      
      <h3>Candidatos Selecionados</h3>
      {data.candidatos.filter((c: any) => c.status.includes('SELECTED_')).map((candidato: any) => (
        <div key={candidato.id}>
          <p><strong>{candidato.aluno.nomeCompleto}</strong> - {candidato.aluno.matricula}</p>
          <p>Tipo: {candidato.status === 'SELECTED_BOLSISTA' ? 'Bolsista' : 'Voluntário'}</p>
          <p>Nota Final: {candidato.notaFinal}</p>
        </div>
      ))}
    </div>
  )
}

export default function PublicarResultadosPage() {
  const { toast } = useToast()
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null)
  const [showPDF, setShowPDF] = useState(false)
  const [mensagemPersonalizada, setMensagemPersonalizada] = useState('')

  // Buscar projetos do professor
  const { data: projetos, isLoading: loadingProjetos } = api.projeto.getProjetos.useQuery()

  // Buscar dados do resultado quando projeto for selecionado
  const { data: dadosResultado, isLoading: loadingResultado } = api.projeto.generateSelectionMinutesData.useQuery(
    { projetoId: selectedProjectId! },
    { enabled: !!selectedProjectId }
  )

  // Mutation para notificar candidatos
  const notificarCandidatosMutation = api.projeto.notifySelectionResults.useMutation({
    onSuccess: (data) => {
      toast({
        title: 'Sucesso',
        description: `Resultado publicado! ${data.notificationsCount} candidatos foram notificados por email.`,
      })
    },
    onError: (error) => {
      toast({
        title: 'Erro',
        description: error.message,
        variant: 'destructive',
      })
    },
  })

  // Projetos que podem ter resultado publicado (com avaliação feita)
  const projetosElegiveis = projetos?.filter(p => 
    p.status === 'APPROVED' && p.totalInscritos > 0
  ) || []

  const handleSelectProject = (projectId: string) => {
    const id = parseInt(projectId)
    setSelectedProjectId(id)
    setShowPDF(false)
  }

  const handlePublishResults = () => {
    if (!selectedProjectId) return

    notificarCandidatosMutation.mutate({
      projetoId: selectedProjectId,
      mensagemPersonalizada: mensagemPersonalizada || undefined,
    })
  }

  const handlePreviewPDF = () => {
    setShowPDF(true)
  }

  const formatStatus = (status: string) => {
    switch (status) {
      case 'SELECTED_BOLSISTA':
        return 'Selecionado (Bolsista)'
      case 'SELECTED_VOLUNTARIO':
        return 'Selecionado (Voluntário)'
      case 'REJECTED_BY_PROFESSOR':
        return 'Não Selecionado'
      case 'WAITING_LIST':
        return 'Lista de Espera'
      default:
        return status
    }
  }

  const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'SELECTED_BOLSISTA':
        return 'default'
      case 'SELECTED_VOLUNTARIO':
        return 'secondary'
      case 'REJECTED_BY_PROFESSOR':
        return 'destructive'
      case 'WAITING_LIST':
        return 'outline'
      default:
        return 'outline'
    }
  }

  const candidatosSelecionados = dadosResultado?.candidatos.filter(c => 
    c.status === 'SELECTED_BOLSISTA' || c.status === 'SELECTED_VOLUNTARIO'
  ) || []

  const candidatosNaoSelecionados = dadosResultado?.candidatos.filter(c => 
    c.status === 'REJECTED_BY_PROFESSOR' || c.status === 'WAITING_LIST'
  ) || []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Publicar Resultados</h1>
        <p className="text-muted-foreground">
          Publique os resultados da seleção de monitoria e notifique os candidatos
        </p>
      </div>

      {/* Seleção de Projeto */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Selecionar Projeto
          </CardTitle>
          <CardDescription>
            Escolha um projeto para publicar os resultados da seleção
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="projeto">Projeto de Monitoria</Label>
            <Select onValueChange={handleSelectProject} disabled={loadingProjetos}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um projeto..." />
              </SelectTrigger>
              <SelectContent>
                {projetosElegiveis.map((projeto) => (
                  <SelectItem key={projeto.id} value={projeto.id.toString()}>
                    <div className="flex flex-col">
                      <span className="font-medium">{projeto.titulo}</span>
                      <span className="text-sm text-muted-foreground">
                        {projeto.ano}.{projeto.semestre === 'SEMESTRE_1' ? '1' : '2'} - {projeto.totalInscritos} candidatos
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Resumo dos Resultados */}
      {dadosResultado && (
        <Card>
          <CardHeader>
            <CardTitle>Resumo dos Resultados</CardTitle>
            <CardDescription>
              Candidatos selecionados e não selecionados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Estatísticas */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div className="p-3 bg-muted rounded-lg">
                  <div className="text-2xl font-bold">{dadosResultado.candidatos.length}</div>
                  <div className="text-sm text-muted-foreground">Total de Candidatos</div>
                </div>
                <div className="p-3 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {candidatosSelecionados.length}
                  </div>
                  <div className="text-sm text-muted-foreground">Selecionados</div>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {dadosResultado.candidatos.filter(c => c.status === 'SELECTED_BOLSISTA').length}
                  </div>
                  <div className="text-sm text-muted-foreground">Bolsistas</div>
                </div>
                <div className="p-3 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {dadosResultado.candidatos.filter(c => c.status === 'SELECTED_VOLUNTARIO').length}
                  </div>
                  <div className="text-sm text-muted-foreground">Voluntários</div>
                </div>
              </div>

              <Separator />

              {/* Candidatos Selecionados */}
              {candidatosSelecionados.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-medium text-green-700 flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    Candidatos Selecionados ({candidatosSelecionados.length})
                  </h4>
                  <div className="space-y-2">
                    {candidatosSelecionados.map((candidato) => (
                      <div key={candidato.id} className="flex items-center justify-between p-3 border rounded-lg bg-green-50">
                        <div>
                          <div className="font-medium">{candidato.aluno.nomeCompleto}</div>
                          <div className="text-sm text-muted-foreground">
                            Matrícula: {candidato.aluno.matricula} | CR: {candidato.aluno.cr?.toFixed(2) || 'N/A'}
                            {candidato.notaFinal && ` | Nota Final: ${candidato.notaFinal.toFixed(1)}`}
                          </div>
                        </div>
                        <Badge variant={getStatusVariant(candidato.status)}>
                          {formatStatus(candidato.status)}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Candidatos Não Selecionados */}
              {candidatosNaoSelecionados.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-medium text-red-700">
                    Candidatos Não Selecionados ({candidatosNaoSelecionados.length})
                  </h4>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {candidatosNaoSelecionados.map((candidato) => (
                      <div key={candidato.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <div className="font-medium">{candidato.aluno.nomeCompleto}</div>
                          <div className="text-sm text-muted-foreground">
                            Matrícula: {candidato.aluno.matricula}
                            {candidato.notaFinal && ` | Nota Final: ${candidato.notaFinal.toFixed(1)}`}
                          </div>
                        </div>
                        <Badge variant={getStatusVariant(candidato.status)}>
                          {formatStatus(candidato.status)}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Mensagem Personalizada */}
      {selectedProjectId && dadosResultado && (
        <Card>
          <CardHeader>
            <CardTitle>Mensagem para os Candidatos</CardTitle>
            <CardDescription>
              Adicione uma mensagem personalizada que será enviada junto com o resultado (opcional)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="mensagem">Mensagem Personalizada</Label>
              <Textarea
                id="mensagem"
                value={mensagemPersonalizada}
                onChange={(e) => setMensagemPersonalizada(e.target.value)}
                placeholder="Ex: Agradecemos a participação de todos os candidatos. Para dúvidas, entrem em contato..."
                rows={4}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Ações */}
      {selectedProjectId && dadosResultado && (
        <Card>
          <CardHeader>
            <CardTitle>Publicar Resultado</CardTitle>
            <CardDescription>
              Publique o resultado e notifique automaticamente todos os candidatos por email
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              <Button onClick={handlePreviewPDF} variant="outline" disabled={loadingResultado}>
                <Eye className="w-4 h-4 mr-2" />
                Visualizar PDF
              </Button>
              <Button 
                onClick={handlePublishResults} 
                disabled={notificarCandidatosMutation.isPending}
                className="bg-green-600 hover:bg-green-700"
              >
                <Send className="w-4 h-4 mr-2" />
                Publicar e Notificar Candidatos
              </Button>
            </div>
            
            {candidatosSelecionados.length === 0 && (
              <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <strong>Atenção:</strong> Nenhum candidato foi selecionado para este projeto. 
                  Certifique-se de que a avaliação foi concluída antes de publicar os resultados.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Visualizador de PDF */}
      {showPDF && dadosResultado && (
        <Card>
          <CardHeader>
            <CardTitle>Visualização do Resultado</CardTitle>
            <CardDescription>
              Prévia do documento que será disponibilizado aos candidatos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="p-4 border rounded-lg bg-muted">
              <p className="text-sm text-muted-foreground mb-4">
                Visualização simplificada - O sistema enviará emails personalizados para cada candidato
              </p>
              <div className="bg-white p-6 rounded border">
                <ResultadoTemplate data={dadosResultado} />
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}