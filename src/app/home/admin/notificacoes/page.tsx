"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useProactiveReminders } from "@/hooks/use-proactive-reminders"
import { api } from "@/utils/api"
import { format, formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Bell, CheckCircle, Clock, History, Mail, Play, RefreshCw, Send, Zap } from "lucide-react"

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
