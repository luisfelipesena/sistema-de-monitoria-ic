'use client'

import { useState } from 'react'
import { PDFViewer } from '@react-pdf/renderer'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/hooks/use-toast'
import { api } from '@/utils/api'
import { AtaSelecaoTemplate, type AtaSelecaoData } from '@/server/lib/pdfTemplates/ata-selecao'
import { FileText, Download, Save, Eye } from 'lucide-react'

export default function AtasSelecaoPage() {
  const { toast } = useToast()
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null)
  const [showPDF, setShowPDF] = useState(false)
  const [ataData, setAtaData] = useState<AtaSelecaoData | null>(null)
  const [ataInfo, setAtaInfo] = useState({
    dataSelecao: new Date().toLocaleDateString('pt-BR'),
    localSelecao: '',
    observacoes: '',
  })

  // Buscar projetos do professor
  const { data: projetos, isLoading: loadingProjetos } = api.projeto.getProjetos.useQuery()

  // Buscar dados da ata quando projeto for selecionado
  const { data: dadosAta, isLoading: loadingAta } = api.projeto.generateSelectionMinutesData.useQuery(
    { projetoId: selectedProjectId! },
    { enabled: !!selectedProjectId }
  )

  // Mutation para salvar ata
  const saveAtaMutation = api.projeto.saveSelectionMinutes.useMutation({
    onSuccess: () => {
      toast({
        title: 'Sucesso',
        description: 'Ata de seleção salva com sucesso',
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

  // Projetos que podem ter ata (com inscrições avaliadas)
  const projetosElegiveis = projetos?.filter(p => 
    p.status === 'APPROVED' && p.totalInscritos > 0
  ) || []

  const handleSelectProject = (projectId: string) => {
    const id = parseInt(projectId)
    setSelectedProjectId(id)
    setShowPDF(false)
  }

  const handleGeneratePDF = () => {
    if (!dadosAta) return

    const dataForPDF: AtaSelecaoData = {
      projeto: dadosAta.projeto,
      candidatos: dadosAta.candidatos,
      ataInfo: {
        dataSelecao: ataInfo.dataSelecao,
        localSelecao: ataInfo.localSelecao || null,
        observacoes: ataInfo.observacoes || null,
      },
    }

    setAtaData(dataForPDF)
    setShowPDF(true)
  }

  const handleSaveAta = () => {
    if (!selectedProjectId) return

    saveAtaMutation.mutate({
      projetoId: selectedProjectId,
      dataSelecao: ataInfo.dataSelecao,
      localSelecao: ataInfo.localSelecao || undefined,
      observacoes: ataInfo.observacoes || undefined,
    })
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Atas de Seleção</h1>
        <p className="text-muted-foreground">
          Gere e gerencie atas de seleção dos seus projetos de monitoria
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
            Escolha um projeto para gerar a ata de seleção
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

          {projetosElegiveis.length === 0 && !loadingProjetos && (
            <p className="text-sm text-muted-foreground">
              Nenhum projeto elegível encontrado. Para gerar uma ata, o projeto deve estar aprovado e ter candidatos inscritos.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Dados da Ata */}
      {selectedProjectId && dadosAta && (
        <Card>
          <CardHeader>
            <CardTitle>Informações da Ata</CardTitle>
            <CardDescription>
              Configure as informações adicionais da ata de seleção
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dataSelecao">Data da Seleção</Label>
                <Input
                  id="dataSelecao"
                  value={ataInfo.dataSelecao}
                  onChange={(e) => setAtaInfo(prev => ({ ...prev, dataSelecao: e.target.value }))}
                  placeholder="dd/mm/aaaa"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="localSelecao">Local da Seleção (opcional)</Label>
                <Input
                  id="localSelecao"
                  value={ataInfo.localSelecao}
                  onChange={(e) => setAtaInfo(prev => ({ ...prev, localSelecao: e.target.value }))}
                  placeholder="Ex: Sala 123, Instituto de Computação"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="observacoes">Observações (opcional)</Label>
              <Textarea
                id="observacoes"
                value={ataInfo.observacoes}
                onChange={(e) => setAtaInfo(prev => ({ ...prev, observacoes: e.target.value }))}
                placeholder="Observações sobre o processo seletivo..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Resumo dos Candidatos */}
      {dadosAta && (
        <Card>
          <CardHeader>
            <CardTitle>Candidatos</CardTitle>
            <CardDescription>
              Resumo dos candidatos inscritos no projeto
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div className="p-3 bg-muted rounded-lg">
                  <div className="text-2xl font-bold">{dadosAta.candidatos.length}</div>
                  <div className="text-sm text-muted-foreground">Total de Candidatos</div>
                </div>
                <div className="p-3 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {dadosAta.candidatos.filter(c => c.status.startsWith('SELECTED_')).length}
                  </div>
                  <div className="text-sm text-muted-foreground">Selecionados</div>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {dadosAta.candidatos.filter(c => c.status === 'SELECTED_BOLSISTA').length}
                  </div>
                  <div className="text-sm text-muted-foreground">Bolsistas</div>
                </div>
                <div className="p-3 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {dadosAta.candidatos.filter(c => c.status === 'SELECTED_VOLUNTARIO').length}
                  </div>
                  <div className="text-sm text-muted-foreground">Voluntários</div>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <h4 className="font-medium">Lista de Candidatos</h4>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {dadosAta.candidatos.map((candidato) => (
                    <div key={candidato.id} className="flex items-center justify-between p-3 border rounded-lg">
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
            </div>
          </CardContent>
        </Card>
      )}

      {/* Ações */}
      {selectedProjectId && dadosAta && (
        <Card>
          <CardHeader>
            <CardTitle>Ações</CardTitle>
            <CardDescription>
              Gere o PDF da ata ou salve as informações
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              <Button onClick={handleGeneratePDF} disabled={loadingAta}>
                <Eye className="w-4 h-4 mr-2" />
                Visualizar PDF
              </Button>
              <Button variant="outline" onClick={handleSaveAta} disabled={saveAtaMutation.isPending}>
                <Save className="w-4 h-4 mr-2" />
                Salvar Ata
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Visualizador de PDF */}
      {showPDF && ataData && (
        <Card>
          <CardHeader>
            <CardTitle>Visualização da Ata</CardTitle>
            <CardDescription>
              Prévia do documento PDF da ata de seleção
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div style={{ height: '800px', width: '100%' }}>
              <PDFViewer style={{ width: '100%', height: '100%' }}>
                <AtaSelecaoTemplate data={ataData} />
              </PDFViewer>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}