"use client"

import { TableComponent } from "@/components/layout/TableComponent"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useProactiveReminders } from "@/hooks/use-proactive-reminders"
import type { EmailFailure } from "@/types"
import { api } from "@/utils/api"
import type { ColumnDef } from "@tanstack/react-table"
import { format, formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"
import {
  AlertTriangle,
  Bell,
  CheckCircle,
  Clock,
  History,
  Mail,
  MailWarning,
  Play,
  RefreshCw,
  Send,
  TrendingUp,
  XCircle,
  Zap,
} from "lucide-react"
import { useMemo, useState } from "react"
import { toast } from "sonner"

const REMINDER_TYPE_ICONS: Record<string, React.ReactNode> = {
  assinatura_projeto_pendente: <Mail className="h-4 w-4" />,
  assinatura_termo_pendente: <Mail className="h-4 w-4" />,
  aceite_vaga_pendente: <CheckCircle className="h-4 w-4" />,
  periodo_inscricao_proximo_fim: <Clock className="h-4 w-4" />,
  relatorio_final_pendente: <Send className="h-4 w-4" />,
  relatorio_monitor_pendente: <Send className="h-4 w-4" />,
}

export default function NotificacoesAdminPage() {
  const { reminderStatus, isLoadingStatus, pendingCount, isExecuting, executeReminders, refetchStatus, lastResult } =
    useProactiveReminders({ autoExecute: false, showToasts: true })

  const { data: executionHistory, isLoading: isLoadingHistory } = api.notificacoes.getReminderExecutionHistory.useQuery(
    { limit: 20 }
  )

  const {
    data: emailHealth,
    isLoading: isLoadingEmailHealth,
    refetch: refetchEmailHealth,
  } = api.notificacoes.emailHealth.useQuery()
  const { data: emailStats } = api.notificacoes.getStats.useQuery({})

  const [testDialogOpen, setTestDialogOpen] = useState(false)
  const [testEmail, setTestEmail] = useState("")

  const sendTestEmail = api.notificacoes.sendTestEmail.useMutation({
    onSuccess: (result) => {
      toast.success(`E-mail de teste enviado para ${result.to}`)
      setTestDialogOpen(false)
      setTestEmail("")
      void refetchEmailHealth()
    },
    onError: (error) => {
      toast.error(error.message)
      void refetchEmailHealth()
    },
  })

  const unhealthyEmail =
    emailHealth && (!emailHealth.transport.healthy || emailHealth.failuresLast24h > 0) ? emailHealth : null

  const failureColumns = useMemo<ColumnDef<EmailFailure>[]>(
    () => [
      {
        id: "dataEnvio",
        accessorKey: "dataEnvio",
        header: "Data/Hora",
        cell: ({ row }) => (
          <span className="font-mono text-sm">
            {format(new Date(row.original.dataEnvio), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
          </span>
        ),
      },
      {
        id: "destinatarioEmail",
        accessorKey: "destinatarioEmail",
        header: "Destinatário",
        cell: ({ row }) => <span className="text-sm">{row.original.destinatarioEmail}</span>,
      },
      {
        id: "assunto",
        accessorKey: "assunto",
        header: "Assunto",
        cell: ({ row }) => <span className="text-sm">{row.original.assunto}</span>,
      },
      {
        id: "mensagemErro",
        accessorKey: "mensagemErro",
        header: "Erro",
        cell: ({ row }) => (
          <span className="text-sm text-red-600 dark:text-red-400 break-all">
            {row.original.mensagemErro ?? "Sem detalhes"}
          </span>
        ),
      },
    ],
    []
  )

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
            <Bell className="h-7 w-7 text-primary" />
            Central de Notificações
          </h1>
          <p className="text-muted-foreground">Gerencie lembretes automáticos e notificações do sistema</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => refetchStatus()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
          <Button onClick={() => executeReminders()} disabled={isExecuting || pendingCount === 0}>
            {isExecuting ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Play className="h-4 w-4 mr-2" />}
            Executar Pendentes ({pendingCount})
          </Button>
        </div>
      </div>

      {/* Last Result Alert */}
      {lastResult && lastResult.totalSent > 0 && (
        <Card className="border-green-200 bg-green-50 dark:bg-green-950/20">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
              <CheckCircle className="h-5 w-5" />
              <span className="font-medium">{lastResult.totalSent} notificações enviadas com sucesso!</span>
            </div>
            <p className="text-sm text-green-600 dark:text-green-500 mt-1">
              Tipos executados:{" "}
              {lastResult.executed
                .filter((r) => r.sent && r.count > 0)
                .map((r) => r.description)
                .join(", ")}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Email Health Alert */}
      {unhealthyEmail && (
        <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
              <AlertTriangle className="h-5 w-5" />
              <span className="font-medium">
                Envio de e-mail com falhas: {unhealthyEmail.failuresLast24h} falhas nas últimas 24h
              </span>
            </div>
            {unhealthyEmail.transport.error && (
              <p className="text-sm text-red-600 dark:text-red-500 mt-1 break-all">
                Conexão SMTP: {unhealthyEmail.transport.error}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Email Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de E-mails</CardTitle>
            <Mail className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-700">{emailStats?.total ?? 0}</div>
            <p className="text-xs text-muted-foreground">Últimos 30 dias</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Enviados</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{emailStats?.enviadas ?? 0}</div>
            <p className="text-xs text-muted-foreground">Entregues ao servidor SMTP</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Falharam</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{emailStats?.falharam ?? 0}</div>
            <p className="text-xs text-muted-foreground">{emailHealth?.failuresLast24h ?? 0} nas últimas 24h</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Entrega</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{emailStats?.taxaEntrega ?? 0}%</div>
            <p className="text-xs text-muted-foreground">Últimos 30 dias</p>
          </CardContent>
        </Card>
      </div>

      {/* Email Health */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <MailWarning className="h-5 w-5 text-red-500" />
                <CardTitle>Saúde do Envio de E-mails</CardTitle>
              </div>
              <CardDescription className="mt-1">
                Estado da conexão SMTP e últimas falhas registradas pelo sistema
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {emailHealth &&
                (emailHealth.transport.healthy ? (
                  <Badge
                    variant="outline"
                    className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                  >
                    Conexão SMTP ok
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                    Conexão SMTP falhando
                  </Badge>
                ))}
              <Dialog open={testDialogOpen} onOpenChange={setTestDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Send className="h-4 w-4 mr-2" />
                    Enviar e-mail de teste
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Enviar e-mail de teste</DialogTitle>
                    <DialogDescription>
                      Envia uma mensagem real pelo servidor SMTP configurado e mostra o erro exato em caso de falha.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-2">
                    <Label htmlFor="test-email">Destinatário</Label>
                    <Input
                      id="test-email"
                      type="email"
                      placeholder="voce@ufba.br"
                      value={testEmail}
                      onChange={(e) => setTestEmail(e.target.value)}
                    />
                  </div>
                  <DialogFooter>
                    <Button
                      onClick={() => sendTestEmail.mutate({ to: testEmail })}
                      disabled={!testEmail || sendTestEmail.isPending}
                    >
                      {sendTestEmail.isPending ? (
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4 mr-2" />
                      )}
                      Enviar
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingEmailHealth ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : emailHealth && emailHealth.recentFailures.length > 0 ? (
            <TableComponent
              columns={failureColumns}
              data={emailHealth.recentFailures}
              showPagination={false}
              emptyMessage="Nenhuma falha registrada."
            />
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <CheckCircle className="h-12 w-12 text-green-500/50 mb-4" />
              <p className="text-muted-foreground">Nenhuma falha de envio registrada</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Proactive Reminders Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-500" />
            <CardTitle>Lembretes Proativos</CardTitle>
          </div>
          <CardDescription>
            Lembretes são verificados automaticamente quando você acessa o Dashboard. Aqui você pode ver o status e
            executar manualmente.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingStatus ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <Skeleton className="h-10 flex-1" />
                  <Skeleton className="h-8 w-24" />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {reminderStatus?.map((reminder) => (
                <div
                  key={reminder.type}
                  className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-full ${
                        reminder.shouldExecute
                          ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                          : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                      }`}
                    >
                      {REMINDER_TYPE_ICONS[reminder.type] || <Bell className="h-4 w-4" />}
                    </div>
                    <div>
                      <p className="font-medium">{reminder.description}</p>
                      <p className="text-xs text-muted-foreground">
                        Intervalo: {reminder.config.minHours}h | Período padrão: {reminder.config.defaultDays} dias
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      {reminder.shouldExecute ? (
                        <Badge
                          variant="outline"
                          className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                        >
                          Pendente
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                        >
                          Em dia
                        </Badge>
                      )}
                      {reminder.lastExecutedAt && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Última:{" "}
                          {formatDistanceToNow(new Date(reminder.lastExecutedAt), { locale: ptBR, addSuffix: true })}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Execution History */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <History className="h-5 w-5 text-blue-500" />
            <CardTitle>Histórico de Execuções</CardTitle>
          </div>
          <CardDescription>Registro das últimas execuções de lembretes (automáticas e manuais)</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingHistory ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : executionHistory && executionHistory.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data/Hora</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Modo</TableHead>
                  <TableHead>Enviadas</TableHead>
                  <TableHead>Executado por</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {executionHistory.map((execution) => (
                  <TableRow key={execution.id}>
                    <TableCell className="font-mono text-sm">
                      {format(new Date(execution.executedAt), "dd/MM/yy HH:mm", { locale: ptBR })}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {REMINDER_TYPE_ICONS[execution.reminderType] || <Bell className="h-4 w-4" />}
                        <span className="text-sm">{execution.reminderType.replace(/_/g, " ")}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {execution.isProactive ? (
                        <Badge variant="secondary" className="text-xs">
                          <Zap className="h-3 w-3 mr-1" />
                          Automático
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs">
                          Manual
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={execution.notificationsSent > 0 ? "default" : "secondary"} className="font-mono">
                        {execution.notificationsSent}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {execution.executedBy?.username ?? "Sistema"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <History className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">Nenhuma execução registrada ainda</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
        <CardContent className="pt-6">
          <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-2 flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Como funciona o sistema proativo?
          </h3>
          <ul className="text-sm text-blue-800 dark:text-blue-400 space-y-2">
            <li>
              • <strong>Automático:</strong> Quando você acessa o Dashboard, o sistema verifica automaticamente se há
              lembretes pendentes e os envia.
            </li>
            <li>
              • <strong>Intervalo mínimo:</strong> Cada tipo de lembrete tem um intervalo mínimo entre execuções para
              evitar spam.
            </li>
            <li>
              • <strong>Manual:</strong> Você pode executar lembretes manualmente a qualquer momento clicando em
              "Executar Pendentes".
            </li>
            <li>
              • <strong>Sem Cron Jobs:</strong> O sistema funciona baseado em acesso, sem necessidade de jobs agendados.
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
