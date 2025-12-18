'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/hooks/use-auth'
import { SEMESTRE_LABELS, type Semestre, TIPO_VAGA_LABELS, type TipoVaga } from '@/types'
import { api } from '@/utils/api'
import { AlertCircle, Award, CheckCircle, Download, Eye, FileText, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

export default function CertificadosAlunoPage() {
  const { user } = useAuth()
  const [selectedVaga, setSelectedVaga] = useState<number | null>(null)

  const alunoId = user?.aluno?.id

  const { data: certificados, isLoading } = api.certificado.listStudentCertificates.useQuery(
    { alunoId: alunoId! },
    { enabled: !!alunoId }
  )

  const { data: preview, isLoading: loadingPreview } = api.certificado.preview.useQuery(
    { vagaId: selectedVaga! },
    { enabled: !!selectedVaga }
  )

  const generateCertificado = api.certificado.generate.useMutation({
    onSuccess: (data) => {
      window.open(data.url, '_blank')
      toast.success('Certificado gerado com sucesso!')
    },
    onError: (err: { message: string }) => toast.error(err.message),
  })

  const handleDownload = (vagaId: number) => {
    generateCertificado.mutate({ vagaId })
  }

  const formatDate = (date: Date | string | null) => {
    if (!date) return 'N/A'
    return new Date(date).toLocaleDateString('pt-BR')
  }

  if (!alunoId) {
    return (
      <div className="container mx-auto p-6">
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="py-8 text-center">
            <AlertCircle className="h-12 w-12 mx-auto text-amber-600 mb-4" />
            <p className="text-amber-800">
              Você precisa completar seu perfil de aluno para acessar os certificados.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Meus Certificados</h1>
        <p className="text-muted-foreground">
          Visualize e baixe os certificados das suas monitorias concluídas
        </p>
      </div>

      {/* Info Card */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="py-4 flex items-start gap-3">
          <Award className="h-5 w-5 text-blue-600 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium">Sobre os Certificados</p>
            <p>
              Os certificados são emitidos após a conclusão do período de monitoria e assinatura do
              relatório final. Clique em "Baixar" para gerar o PDF do certificado.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Certificados Disponíveis */}
      <div>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Certificados Disponíveis
        </h2>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        ) : certificados?.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                Você ainda não possui certificados disponíveis.
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Os certificados ficarão disponíveis após a conclusão das suas monitorias.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {certificados?.map((cert) => (
              <Card key={cert.vagaId} className="hover:border-primary/50 transition-colors">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{cert.projeto.titulo}</CardTitle>
                      <CardDescription>
                        {cert.projeto.ano}/{SEMESTRE_LABELS[cert.projeto.semestre as Semestre]}
                      </CardDescription>
                    </div>
                    <Badge variant={cert.tipo === 'BOLSISTA' ? 'default' : 'secondary'}>
                      {TIPO_VAGA_LABELS[cert.tipo as TipoVaga]}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>Professor: {cert.professor}</p>
                      <p>Departamento: {cert.departamento}</p>
                      <p>
                        Período: {formatDate(cert.dataInicio)} - {formatDate(cert.dataFim)}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedVaga(cert.vagaId)}
                      >
                        <Eye className="h-4 w-4 mr-1" /> Visualizar
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleDownload(cert.vagaId)}
                        disabled={generateCertificado.isPending}
                      >
                        {generateCertificado.isPending ? (
                          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                        ) : (
                          <Download className="h-4 w-4 mr-1" />
                        )}
                        Baixar
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Preview Dialog */}
      <Dialog open={!!selectedVaga} onOpenChange={(open) => !open && setSelectedVaga(null)}>
        <DialogContent className="max-w-2xl">
          {loadingPreview ? (
            <div className="py-12 flex justify-center">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : preview ? (
            <>
              <DialogHeader>
                <DialogTitle>Prévia do Certificado</DialogTitle>
                <DialogDescription>
                  Verifique os dados antes de gerar o certificado oficial
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6">
                {/* Monitor Info */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Dados do Monitor</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Nome:</span>
                      <p className="font-medium">{preview.monitor.nome}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Matrícula:</span>
                      <p className="font-medium">{preview.monitor.matricula || 'N/A'}</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Projeto Info */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Dados da Monitoria</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div>
                      <span className="text-muted-foreground">Projeto:</span>
                      <p className="font-medium">{preview.projeto.titulo}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Disciplinas:</span>
                      <p className="font-medium">
                        {preview.projeto.disciplinas.map((d) => `${d.codigo} - ${d.nome}`).join(', ')}
                      </p>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <span className="text-muted-foreground">Semestre:</span>
                        <p className="font-medium">
                          {preview.projeto.ano}/{SEMESTRE_LABELS[preview.projeto.semestre as Semestre]}
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Carga Horária:</span>
                        <p className="font-medium">{preview.projeto.cargaHorariaTotal}h</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Modalidade:</span>
                        <p className="font-medium">{TIPO_VAGA_LABELS[preview.tipo as TipoVaga]}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-muted-foreground">Professor:</span>
                        <p className="font-medium">{preview.professor}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Departamento:</span>
                        <p className="font-medium">{preview.departamento}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-muted-foreground">Início:</span>
                        <p className="font-medium">{formatDate(preview.periodo.inicio)}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Término:</span>
                        <p className="font-medium">{formatDate(preview.periodo.fim)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Elegibilidade */}
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="h-5 w-5" />
                  <span className="text-sm font-medium">Certificado disponível para download</span>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setSelectedVaga(null)}>
                  Fechar
                </Button>
                <Button
                  onClick={() => handleDownload(selectedVaga!)}
                  disabled={generateCertificado.isPending}
                >
                  {generateCertificado.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4 mr-2" />
                  )}
                  Gerar e Baixar Certificado
                </Button>
              </DialogFooter>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  )
}
