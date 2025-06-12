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
import { FileText, Download, Save, Eye } from 'lucide-react'

// Simplified AtaSelecaoData type
type AtaSelecaoData = {
  projeto: {
    id: number
    titulo: string
    ano: number
    semestre: string
    departamento: { nome: string; sigla: string | null }
    professorResponsavel: { nomeCompleto: string; matriculaSiape: string | null }
    disciplinas: Array<{ codigo: string; nome: string }>
  }
  candidatos: Array<{
    id: number
    aluno: { nomeCompleto: string; matricula: string; cr: number | null }
    tipoVagaPretendida: string | null
    notaDisciplina: number | null
    notaSelecao: number | null
    coeficienteRendimento: number | null
    notaFinal: number | null
    status: string
    observacoes?: string | null
  }>
  ataInfo: {
    dataSelecao: string
    localSelecao: string | null
    observacoes: string | null
  }
}

// Simple AtaSelecaoTemplate component for PDF
function AtaSelecaoTemplate({ data }: { data: AtaSelecaoData }) {
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Ata de Seleção - Monitoria</h1>
      <p><strong>Projeto:</strong> {data.projeto.titulo}</p>
      <p><strong>Professor:</strong> {data.projeto.professorResponsavel.nomeCompleto}</p>
      <p><strong>Data da Seleção:</strong> {data.ataInfo.dataSelecao}</p>
      
      <h2>Candidatos Aprovados</h2>
      {data.candidatos.map(candidato => (
        <div key={candidato.id} style={{ margin: '10px 0', padding: '10px', border: '1px solid #ccc' }}>
          <p><strong>Nome:</strong> {candidato.aluno.nomeCompleto}</p>
          <p><strong>Matrícula:</strong> {candidato.aluno.matricula}</p>
          <p><strong>Nota Final:</strong> {candidato.notaFinal}</p>
          <p><strong>Tipo:</strong> {candidato.tipoVagaPretendida}</p>
        </div>
      ))}
    </div>
  )
}

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
  const { data: dadosAta, isLoading: loadingAta } = api.selecao.generateAtaData.useQuery(
    { projetoId: selectedProjectId!.toString() },
    { enabled: !!selectedProjectId }
  )

  // Mutation para salvar ata
  const saveAtaMutation = api.selecao.publishResults.useMutation({
    onSuccess: () => {
      toast({
        title: 'Sucesso',
        description: 'Ata salva com sucesso!',
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
    setSelectedProjectId(parseInt(projectId))
    setShowPDF(false)
  }

  const handleGeneratePDF = () => {
    if (!dadosAta) return

    const dataForPDF: AtaSelecaoData = {
      projeto: {
        id: dadosAta.projeto.id,
        titulo: dadosAta.projeto.titulo,
        ano: dadosAta.projeto.ano,
        semestre: dadosAta.projeto.semestre,
        departamento: dadosAta.projeto.departamento,
        professorResponsavel: dadosAta.projeto.professorResponsavel,
        disciplinas: [{ codigo: 'MON', nome: 'Monitoria' }],
      },
      candidatos: dadosAta.inscricoesBolsista.concat(dadosAta.inscricoesVoluntario).map(inscricao => ({
        id: inscricao.id,
        aluno: {
          nomeCompleto: inscricao.aluno.user.username,
          matricula: inscricao.aluno.matricula,
          cr: inscricao.aluno.cr,
        },
        tipoVagaPretendida: inscricao.tipoVagaPretendida,
        notaDisciplina: typeof inscricao.notaDisciplina === 'string' ? parseFloat(inscricao.notaDisciplina) : (inscricao.notaDisciplina ?? null),
        notaSelecao: typeof inscricao.notaSelecao === 'string' ? parseFloat(inscricao.notaSelecao) : (inscricao.notaSelecao ?? null),
        coeficienteRendimento: typeof inscricao.coeficienteRendimento === 'string' ? parseFloat(inscricao.coeficienteRendimento) : (inscricao.coeficienteRendimento ?? null),
        notaFinal: typeof inscricao.notaFinal === 'string' ? parseFloat(inscricao.notaFinal) : (inscricao.notaFinal ?? null),
        status: inscricao.status,
        observacoes: 'observacoes' in inscricao ? (inscricao as any).observacoes : null,
      })),
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
      projetoId: selectedProjectId.toString(),
      notifyStudents: false,
      mensagemPersonalizada: ataInfo.observacoes,
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
                  <div className="text-2xl font-bold">{dadosAta.totalInscritos}</div>
                  <div className="text-sm text-muted-foreground">Total Inscritos</div>
                </div>
                <div className="p-3 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {dadosAta.totalCompareceram}
                  </div>
                  <div className="text-sm text-muted-foreground">Compareceram</div>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {dadosAta.inscricoesBolsista.length}
                  </div>
                  <div className="text-sm text-muted-foreground">Bolsistas Aprovados</div>
                </div>
                <div className="p-3 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {dadosAta.inscricoesVoluntario.length}
                  </div>
                  <div className="text-sm text-muted-foreground">Voluntários Aprovados</div>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <h4 className="font-medium">Candidatos Aprovados</h4>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {dadosAta.inscricoesBolsista.map((candidato) => (
                    <div key={candidato.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">{candidato.aluno.user.username}</div>
                        <div className="text-sm text-muted-foreground">
                          Nota Final: {candidato.notaFinal} | Tipo: Bolsista
                        </div>
                      </div>
                      <Badge variant="default">Bolsista</Badge>
                    </div>
                  ))}
                  {dadosAta.inscricoesVoluntario.map((candidato) => (
                    <div key={candidato.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">{candidato.aluno.user.username}</div>
                        <div className="text-sm text-muted-foreground">
                          Nota Final: {candidato.notaFinal} | Tipo: Voluntário
                        </div>
                      </div>
                      <Badge variant="secondary">Voluntário</Badge>
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
              <AtaSelecaoTemplate data={ataData} />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}