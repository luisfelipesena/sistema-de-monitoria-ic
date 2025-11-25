'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { SEMESTRE_1, SEMESTRE_2, SEMESTRE_LABELS, type Semestre } from '@/types'
import { api } from '@/utils/api'
import {
  AlertCircle,
  CheckCircle,
  ClipboardCopy,
  Download,
  FileSpreadsheet,
  Loader2,
  Mail,
  Send,
} from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

export default function ValidacaoRelatoriosPage() {
  const currentYear = new Date().getFullYear()
  const [ano, setAno] = useState(currentYear)
  const [semestre, setSemestre] = useState<Semestre>(SEMESTRE_1)
  const [emailNUMOP, setEmailNUMOP] = useState('')
  const [prazoFinal, setPrazoFinal] = useState('')

  // Queries
  const { data: validationStatus, isLoading: loadingStatus, refetch: refetchStatus } = api.relatorios.getValidationStatus.useQuery(
    { ano, semestre },
    { enabled: true }
  )

  const { data: textoAta, isLoading: loadingAta, refetch: refetchAta } = api.relatorios.gerarTextoAta.useQuery(
    { ano, semestre },
    { enabled: false }
  )

  // Mutations
  const notifyProfessorsMutation = api.relatorios.notifyProfessorsToGenerateReports.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        toast.success(`${data.emailsEnviados} emails enviados para professores`)
      } else {
        toast.warning(`${data.emailsEnviados} emails enviados. ${data.errors.length} erros ocorreram.`)
      }
    },
    onError: (error) => {
      toast.error(`Erro: ${error.message}`)
    },
  })

  const notifyStudentsMutation = api.relatorios.notifyStudentsWithPendingReports.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        toast.success(`${data.emailsEnviados} emails enviados para alunos`)
      } else {
        toast.warning(`${data.emailsEnviados} emails enviados. ${data.errors.length} erros ocorreram.`)
      }
    },
    onError: (error) => {
      toast.error(`Erro: ${error.message}`)
    },
  })

  const enviarCertificadosMutation = api.relatorios.enviarCertificadosParaNUMOP.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        toast.success(data.message)
      } else {
        toast.error(data.message)
      }
    },
    onError: (error) => {
      toast.error(`Erro: ${error.message}`)
    },
  })

  const gerarPlanilhasMutation = api.relatorios.gerarPlanilhasCertificados.useMutation({
    onSuccess: (data) => {
      const downloadBase64File = (base64: string, filename: string) => {
        const binaryString = atob(base64)
        const bytes = new Uint8Array(binaryString.length)
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i)
        }
        const blob = new Blob([bytes], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = filename
        link.click()
        URL.revokeObjectURL(url)
      }

      downloadBase64File(data.bolsistas, `Certificados_Bolsistas_${ano}_${SEMESTRE_LABELS[semestre]}.xlsx`)
      downloadBase64File(data.voluntarios, `Certificados_Voluntarios_${ano}_${SEMESTRE_LABELS[semestre]}.xlsx`)
      downloadBase64File(data.relatoriosDisciplina, `Relatorios_Disciplinas_${ano}_${SEMESTRE_LABELS[semestre]}.xlsx`)

      toast.success('Planilhas geradas e baixadas com sucesso!')
    },
    onError: (error) => {
      toast.error(`Erro: ${error.message}`)
    },
  })

  const handleNotifyProfessors = () => {
    notifyProfessorsMutation.mutate({
      ano,
      semestre,
      prazoFinal: prazoFinal ? new Date(prazoFinal) : undefined,
    })
  }

  const handleNotifyStudents = () => {
    notifyStudentsMutation.mutate({ ano, semestre })
  }

  const handleGerarPlanilhas = () => {
    gerarPlanilhasMutation.mutate({ ano, semestre })
  }

  const handleEnviarNUMOP = () => {
    if (!emailNUMOP) {
      toast.error('Informe o email do NUMOP/Departamento')
      return
    }
    enviarCertificadosMutation.mutate({ ano, semestre, emailDestino: emailNUMOP })
  }

  const handleGerarAta = async () => {
    await refetchAta()
  }

  const handleCopyAta = () => {
    if (textoAta) {
      navigator.clipboard.writeText(textoAta)
      toast.success('Texto copiado para a área de transferência')
    }
  }

  const calcularProgresso = (atual: number, total: number) => {
    if (total === 0) return 0
    return Math.round((atual / total) * 100)
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Validação de Relatórios Finais</h1>
        <p className="text-muted-foreground">
          Gerencie e valide os relatórios finais de monitoria antes de gerar certificados
        </p>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Período</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-4">
          <div className="w-32">
            <Label>Ano</Label>
            <Select value={String(ano)} onValueChange={(v) => setAno(Number(v))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[currentYear - 1, currentYear, currentYear + 1].map((y) => (
                  <SelectItem key={y} value={String(y)}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="w-40">
            <Label>Semestre</Label>
            <Select value={semestre} onValueChange={(v) => setSemestre(v as Semestre)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={SEMESTRE_1}>{SEMESTRE_LABELS[SEMESTRE_1]}</SelectItem>
                <SelectItem value={SEMESTRE_2}>{SEMESTRE_LABELS[SEMESTRE_2]}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button variant="outline" onClick={() => refetchStatus()} className="self-end">
            Atualizar
          </Button>
        </CardContent>
      </Card>

      {/* Status de Validação */}
      {loadingStatus ? (
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </CardContent>
        </Card>
      ) : validationStatus ? (
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5" />
                Relatórios de Disciplina
              </CardTitle>
              <CardDescription>Progresso dos relatórios por projeto</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Com relatório</span>
                  <span>
                    {validationStatus.projetos.comRelatorio}/{validationStatus.projetos.total}
                  </span>
                </div>
                <Progress
                  value={calcularProgresso(
                    validationStatus.projetos.comRelatorio,
                    validationStatus.projetos.total
                  )}
                />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Assinados pelo professor</span>
                  <span>
                    {validationStatus.projetos.assinados}/{validationStatus.projetos.total}
                  </span>
                </div>
                <Progress
                  value={calcularProgresso(validationStatus.projetos.assinados, validationStatus.projetos.total)}
                  className="bg-green-100"
                />
              </div>
              {validationStatus.projetos.assinados === validationStatus.projetos.total &&
              validationStatus.projetos.total > 0 ? (
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  <span className="text-sm">Todos os relatórios de disciplina estão assinados</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-amber-600">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm">
                    {validationStatus.projetos.total - validationStatus.projetos.assinados} relatórios pendentes
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5" />
                Relatórios de Monitores
              </CardTitle>
              <CardDescription>Progresso dos relatórios individuais</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Com relatório</span>
                  <span>
                    {validationStatus.monitores.comRelatorio}/{validationStatus.monitores.total}
                  </span>
                </div>
                <Progress
                  value={calcularProgresso(
                    validationStatus.monitores.comRelatorio,
                    validationStatus.monitores.total
                  )}
                />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Totalmente assinados (professor + aluno)</span>
                  <span>
                    {validationStatus.monitores.totalmenteAssinados}/{validationStatus.monitores.total}
                  </span>
                </div>
                <Progress
                  value={calcularProgresso(
                    validationStatus.monitores.totalmenteAssinados,
                    validationStatus.monitores.total
                  )}
                  className="bg-green-100"
                />
              </div>
              {validationStatus.monitores.totalmenteAssinados === validationStatus.monitores.total &&
              validationStatus.monitores.total > 0 ? (
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  <span className="text-sm">Todos os relatórios de monitores estão assinados</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-amber-600">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm">
                    {validationStatus.monitores.total - validationStatus.monitores.totalmenteAssinados} relatórios
                    pendentes
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      ) : null}

      {/* Ações de Notificação */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Notificações
          </CardTitle>
          <CardDescription>Envie lembretes para professores e alunos</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Label>Prazo Final (opcional)</Label>
              <Input type="date" value={prazoFinal} onChange={(e) => setPrazoFinal(e.target.value)} />
            </div>
            <div className="flex gap-2 self-end">
              <Button
                onClick={handleNotifyProfessors}
                disabled={notifyProfessorsMutation.isPending}
                variant="outline"
              >
                {notifyProfessorsMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Send className="h-4 w-4 mr-2" />
                )}
                Notificar Professores
              </Button>
              <Button
                onClick={handleNotifyStudents}
                disabled={notifyStudentsMutation.isPending}
                variant="outline"
              >
                {notifyStudentsMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Send className="h-4 w-4 mr-2" />
                )}
                Notificar Alunos
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Texto para Ata */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardCopy className="h-5 w-5" />
            Texto para Ata do Departamento
          </CardTitle>
          <CardDescription>
            Gere o texto padrão para incluir na ata do departamento
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={handleGerarAta} disabled={loadingAta} variant="outline">
            {loadingAta ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Gerar Texto
          </Button>
          {textoAta && (
            <>
              <Textarea value={textoAta} readOnly rows={10} className="font-mono text-sm" />
              <Button onClick={handleCopyAta} variant="secondary">
                <ClipboardCopy className="h-4 w-4 mr-2" />
                Copiar Texto
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* Geração de Planilhas e Envio */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Planilhas de Certificados
          </CardTitle>
          <CardDescription>
            Gere e envie as planilhas de certificados para o NUMOP
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!validationStatus?.podeExportar && validationStatus && (
            <div className="flex items-start gap-2 p-3 rounded-md bg-amber-50 border border-amber-200">
              <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-amber-700">
                <p className="font-medium">Atenção: Ainda há relatórios pendentes</p>
                <p className="mt-1">
                  As planilhas conterão apenas dados de relatórios já assinados. Para exportação completa, aguarde todos
                  os relatórios serem finalizados.
                </p>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              onClick={handleGerarPlanilhas}
              disabled={gerarPlanilhasMutation.isPending}
              variant="outline"
            >
              {gerarPlanilhasMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              Baixar Planilhas
            </Button>
          </div>

          <div className="border-t pt-4 mt-4">
            <Label>Email do Departamento/NUMOP</Label>
            <div className="flex gap-2 mt-2">
              <Input
                type="email"
                placeholder="numop@ufba.br"
                value={emailNUMOP}
                onChange={(e) => setEmailNUMOP(e.target.value)}
                className="max-w-md"
              />
              <Button
                onClick={handleEnviarNUMOP}
                disabled={enviarCertificadosMutation.isPending || !emailNUMOP}
              >
                {enviarCertificadosMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Send className="h-4 w-4 mr-2" />
                )}
                Enviar para NUMOP
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
