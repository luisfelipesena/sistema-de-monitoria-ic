import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { Semestre } from "@/types"
import { SEMESTRE_LABELS } from "@/types"
import { AlertTriangle, Bell, CheckCircle, FileText, Loader2, Mail, Users } from "lucide-react"
import { useState } from "react"

interface ValidationStatus {
  projetos: {
    total: number
    comRelatorio: number
    assinados: number
  }
  monitores: {
    total: number
    comRelatorio: number
    totalmenteAssinados: number
  }
  podeExportar: boolean
}

interface ReportNotificationsSectionProps {
  selectedYear: number
  selectedSemester: Semestre
  validationStatus: ValidationStatus | undefined
  isLoadingValidation: boolean
  isNotifyingProfessors: boolean
  isNotifyingStudents: boolean
  isSendingCertificates: boolean
  onNotifyProfessors: (prazoFinal?: Date) => void
  onNotifyStudents: () => void
  onSendCertificates: (email: string) => void
  onRefreshValidation: () => void
}

export function ReportNotificationsSection({
  selectedYear,
  selectedSemester,
  validationStatus,
  isLoadingValidation,
  isNotifyingProfessors,
  isNotifyingStudents,
  isSendingCertificates,
  onNotifyProfessors,
  onNotifyStudents,
  onSendCertificates,
  onRefreshValidation,
}: ReportNotificationsSectionProps) {
  const [prazoFinal, setPrazoFinal] = useState<string>("")
  const [emailNUMOP, setEmailNUMOP] = useState<string>("")

  const semestreDisplay = SEMESTRE_LABELS[selectedSemester]

  const handleNotifyProfessors = () => {
    const prazoDate = prazoFinal ? new Date(prazoFinal) : undefined
    onNotifyProfessors(prazoDate)
  }

  const handleSendCertificates = () => {
    if (!emailNUMOP) return
    onSendCertificates(emailNUMOP)
  }

  const projetosProgress = validationStatus
    ? Math.round((validationStatus.projetos.comRelatorio / Math.max(validationStatus.projetos.total, 1)) * 100)
    : 0

  const monitoresProgress = validationStatus
    ? Math.round(
        (validationStatus.monitores.totalmenteAssinados / Math.max(validationStatus.monitores.total, 1)) * 100
      )
    : 0

  return (
    <div className="space-y-6">
      {/* Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Status dos Relatórios - {semestreDisplay}/{selectedYear}
          </CardTitle>
          <CardDescription>Acompanhe o progresso dos relatórios finais do semestre</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingValidation ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              <span>Carregando status...</span>
            </div>
          ) : validationStatus ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {/* Projetos Progress */}
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Relatórios de Disciplina</span>
                    <span className="text-sm text-muted-foreground">
                      {validationStatus.projetos.comRelatorio}/{validationStatus.projetos.total}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${projetosProgress}%` }} />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {validationStatus.projetos.assinados} assinados pelo professor
                  </p>
                </div>

                {/* Monitores Progress */}
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Relatórios de Monitor</span>
                    <span className="text-sm text-muted-foreground">
                      {validationStatus.monitores.totalmenteAssinados}/{validationStatus.monitores.total}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-green-600 h-2 rounded-full" style={{ width: `${monitoresProgress}%` }} />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {validationStatus.monitores.comRelatorio} com relatório criado
                  </p>
                </div>
              </div>

              {validationStatus.podeExportar ? (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>Há relatórios prontos para exportar certificados!</AlertDescription>
                </Alert>
              ) : (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Aguardando relatórios serem criados e assinados antes de exportar certificados.
                  </AlertDescription>
                </Alert>
              )}

              <Button variant="outline" size="sm" onClick={onRefreshValidation}>
                Atualizar Status
              </Button>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Selecione ano e semestre para ver o status.</p>
          )}
        </CardContent>
      </Card>

      {/* Notifications Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notificações de Relatórios
          </CardTitle>
          <CardDescription>Envie notificações para professores e alunos sobre relatórios pendentes</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Notify Professors */}
          <div className="p-4 border rounded-lg space-y-3">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              <h4 className="font-medium">Notificar Professores</h4>
            </div>
            <p className="text-sm text-muted-foreground">
              Envia email para todos os professores com projetos aprovados que ainda não criaram relatórios finais.
            </p>
            <div className="flex items-end gap-3">
              <div className="flex-1">
                <Label htmlFor="prazoFinal" className="text-xs">
                  Prazo Final (opcional)
                </Label>
                <Input
                  id="prazoFinal"
                  type="date"
                  value={prazoFinal}
                  onChange={(e) => setPrazoFinal(e.target.value)}
                  className="mt-1"
                />
              </div>
              <Button onClick={handleNotifyProfessors} disabled={isNotifyingProfessors}>
                {isNotifyingProfessors ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Mail className="h-4 w-4 mr-2" />
                    Notificar Professores
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Notify Students */}
          <div className="p-4 border rounded-lg space-y-3">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-green-600" />
              <h4 className="font-medium">Notificar Alunos</h4>
            </div>
            <p className="text-sm text-muted-foreground">
              Envia email para todos os alunos que têm relatórios pendentes de assinatura.
            </p>
            <Button onClick={onNotifyStudents} disabled={isNotifyingStudents} variant="secondary">
              {isNotifyingStudents ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Mail className="h-4 w-4 mr-2" />
                  Notificar Alunos
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Certificates Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Certificados para NUMOP
          </CardTitle>
          <CardDescription>
            Gere e envie as planilhas de certificados para o Núcleo de Monitoria (NUMOP/PROGRAD)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Envia três planilhas Excel: Bolsistas, Voluntários e Relatórios por Disciplina, com links para os PDFs dos
            relatórios.
          </p>
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <Label htmlFor="emailNUMOP" className="text-xs">
                Email NUMOP/PROGRAD
              </Label>
              <Input
                id="emailNUMOP"
                type="email"
                placeholder="numop@ufba.br"
                value={emailNUMOP}
                onChange={(e) => setEmailNUMOP(e.target.value)}
                className="mt-1"
              />
            </div>
            <Button
              onClick={handleSendCertificates}
              disabled={isSendingCertificates || !emailNUMOP || !validationStatus?.podeExportar}
              variant="default"
            >
              {isSendingCertificates ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Mail className="h-4 w-4 mr-2" />
                  Enviar Certificados
                </>
              )}
            </Button>
          </div>
          {!validationStatus?.podeExportar && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                É necessário ter pelo menos um relatório assinado para enviar certificados.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
