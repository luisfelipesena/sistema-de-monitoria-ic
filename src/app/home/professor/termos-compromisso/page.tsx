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
import { PDFDownloadWrapper } from '@/components/ui/pdf-download-wrapper'

export default function TermosCompromissoPage() {
  const { toast } = useToast()
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null)

  // Buscar projetos do professor
  const { data: projetos, isLoading: loadingProjetos } = api.projeto.getProjetos.useQuery()

  // Buscar inscrições aceitas do projeto selecionado
  const { data: inscricoesAceitas, isLoading: loadingInscricoes } = api.inscricao.getInscricoesProjeto.useQuery(
    { projetoId: selectedProjectId! },
    { enabled: !!selectedProjectId }
  )

  // Filtrar apenas inscrições aceitas
  const monitoresAceitos = inscricoesAceitas?.filter(inscricao => 
    inscricao.status === 'ACCEPTED_BOLSISTA' || inscricao.status === 'ACCEPTED_VOLUNTARIO'
  ) || []

  // Projetos que têm monitores aceitos
  const projetosComMonitores = projetos?.filter(p => 
    p.status === 'APPROVED' && p.totalInscritos > 0
  ) || []

  const handleSelectProject = (projectId: string) => {
    const id = parseInt(projectId)
    setSelectedProjectId(id)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACCEPTED_BOLSISTA':
        return <Badge className="bg-green-500">Monitor Bolsista</Badge>
      case 'ACCEPTED_VOLUNTARIO':
        return <Badge className="bg-blue-500">Monitor Voluntário</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getTipoIcon = (status: string) => {
    switch (status) {
      case 'ACCEPTED_BOLSISTA':
        return <Award className="h-4 w-4 text-yellow-600" />
      case 'ACCEPTED_VOLUNTARIO':
        return <Users className="h-4 w-4 text-blue-600" />
      default:
        return <User className="h-4 w-4 text-gray-500" />
    }
  }

  // Component para download do termo de compromisso
  function TermoCompromissoDownload({ inscricaoId, alunoNome }: { inscricaoId: number, alunoNome: string }) {
    const { data: termoData, isLoading } = api.inscricao.generateCommitmentTermData.useQuery(
      { inscricaoId },
      { enabled: !!inscricaoId }
    )

    if (isLoading) {
      return (
        <Button variant="outline" disabled size="sm">
          <FileText className="h-4 w-4 mr-1" />
          Carregando...
        </Button>
      )
    }

    if (!termoData) {
      return null
    }

    return (
      <PDFDownloadWrapper
        pdfData={termoData}
        fileName={`termo-compromisso-${termoData.termo.numero}-${alunoNome.replace(/\s+/g, '-')}.pdf`}
        buttonText="Baixar Termo"
        size="sm"
      />
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
                {projetosComMonitores.map((projeto) => (
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

      {/* Lista de Monitores Aceitos */}
      {selectedProjectId && (
        <Card>
          <CardHeader>
            <CardTitle>Monitores Aceitos</CardTitle>
            <p className="text-sm text-muted-foreground">
              {loadingInscricoes ? 'Carregando...' : `${monitoresAceitos.length} monitor(es) aceito(s)`}
            </p>
          </CardHeader>
          <CardContent>
            {loadingInscricoes ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Carregando monitores...</p>
              </div>
            ) : monitoresAceitos.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Nenhum monitor aceito</h3>
                <p className="text-muted-foreground">
                  Este projeto ainda não possui monitores que aceitaram suas vagas.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {monitoresAceitos.map((inscricao) => (
                  <div
                    key={inscricao.id}
                    className="border rounded-lg p-4 bg-green-50 border-green-200"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {getTipoIcon(inscricao.status)}
                          <h3 className="font-semibold text-lg">{inscricao.aluno.nomeCompleto}</h3>
                        </div>
                        <div className="space-y-1 text-sm text-muted-foreground mb-3">
                          <p>Matrícula: {inscricao.aluno.matricula}</p>
                          <p>E-mail: {inscricao.aluno.user.email}</p>
                          <p>CR: {inscricao.aluno.cr?.toFixed(2) || 'N/A'}</p>
                          {inscricao.notaFinal && (
                            <p>Nota Final: {Number(inscricao.notaFinal).toFixed(1)}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mb-3">
                          {getStatusBadge(inscricao.status)}
                        </div>
                      </div>
                      
                      {/* Botão de Download */}
                      <div className="ml-4">
                        <TermoCompromissoDownload 
                          inscricaoId={inscricao.id} 
                          alunoNome={inscricao.aluno.nomeCompleto}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Informações Adicionais */}
      {selectedProjectId && monitoresAceitos.length > 0 && (
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