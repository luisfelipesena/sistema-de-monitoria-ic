"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { api } from "@/utils/api"
import { useState } from "react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { ChevronLeft, ChevronRight, Eye, RefreshCw, Activity, Bell, CheckCircle, XCircle, Send } from "lucide-react"
import {
  AUDIT_ACTION_ENUM,
  AUDIT_ENTITY_ENUM,
  type AuditAction,
  type AuditEntity,
} from "@/types"

const ACTION_LABELS: Record<AuditAction, string> = {
  CREATE: "Criar",
  UPDATE: "Atualizar",
  DELETE: "Deletar",
  APPROVE: "Aprovar",
  REJECT: "Rejeitar",
  SUBMIT: "Submeter",
  SIGN: "Assinar",
  LOGIN: "Login",
  LOGOUT: "Logout",
  SEND_NOTIFICATION: "Enviar Notificação",
  PUBLISH: "Publicar",
  SELECT: "Selecionar",
  ACCEPT: "Aceitar",
}

const ENTITY_LABELS: Record<AuditEntity, string> = {
  PROJETO: "Projeto",
  INSCRICAO: "Inscrição",
  EDITAL: "Edital",
  RELATORIO: "Relatório",
  VAGA: "Vaga",
  USER: "Usuário",
  PROFESSOR: "Professor",
  ALUNO: "Aluno",
  NOTIFICATION: "Notificação",
}

const ACTION_COLORS: Record<AuditAction, string> = {
  CREATE: "bg-green-100 text-green-800",
  UPDATE: "bg-blue-100 text-blue-800",
  DELETE: "bg-red-100 text-red-800",
  APPROVE: "bg-emerald-100 text-emerald-800",
  REJECT: "bg-rose-100 text-rose-800",
  SUBMIT: "bg-yellow-100 text-yellow-800",
  SIGN: "bg-purple-100 text-purple-800",
  LOGIN: "bg-cyan-100 text-cyan-800",
  LOGOUT: "bg-slate-100 text-slate-800",
  SEND_NOTIFICATION: "bg-indigo-100 text-indigo-800",
  PUBLISH: "bg-teal-100 text-teal-800",
  SELECT: "bg-orange-100 text-orange-800",
  ACCEPT: "bg-lime-100 text-lime-800",
}

export default function AuditLogsPage() {
  const [selectedAction, setSelectedAction] = useState<AuditAction | "all">("all")
  const [selectedEntity, setSelectedEntity] = useState<AuditEntity | "all">("all")
  const [offset, setOffset] = useState(0)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [selectedLog, setSelectedLog] = useState<{
    id: number
    action: AuditAction
    entityType: AuditEntity
    entityId: number | null
    details: string | null
    timestamp: Date
    user?: { username: string; email: string } | null
  } | null>(null)

  const limit = 20

  const { data, isLoading, refetch } = api.audit.list.useQuery({
    action: selectedAction === "all" ? undefined : selectedAction,
    entityType: selectedEntity === "all" ? undefined : selectedEntity,
    limit,
    offset,
  })

  const { data: stats } = api.audit.getStats.useQuery({})

  const logs = data?.data ?? []
  const pagination = data?.pagination

  const handleViewDetails = (log: typeof selectedLog) => {
    setSelectedLog(log)
    setDetailsOpen(true)
  }

  const parseDetails = (details: string | null) => {
    if (!details) return null
    try {
      return JSON.parse(details)
    } catch {
      return null
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Logs de Auditoria</h1>
          <p className="text-muted-foreground">
            Visualize todas as ações realizadas no sistema
          </p>
        </div>
        <Button variant="outline" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Atualizar
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-cyan-500" />
                <span className="text-sm text-muted-foreground">Logins</span>
              </div>
              <p className="text-2xl font-bold">{stats.logins}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-indigo-500" />
                <span className="text-sm text-muted-foreground">Notificações</span>
              </div>
              <p className="text-2xl font-bold">{stats.notifications}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-500" />
                <span className="text-sm text-muted-foreground">Aprovações</span>
              </div>
              <p className="text-2xl font-bold">{stats.approvals}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-rose-500" />
                <span className="text-sm text-muted-foreground">Rejeições</span>
              </div>
              <p className="text-2xl font-bold">{stats.rejects}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Send className="h-4 w-4 text-yellow-500" />
                <span className="text-sm text-muted-foreground">Submissões</span>
              </div>
              <p className="text-2xl font-bold">{stats.submissions}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-4">
          <div className="w-48">
            <Select
              value={selectedAction}
              onValueChange={(value) => {
                setSelectedAction(value as AuditAction | "all")
                setOffset(0)
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Ação" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as ações</SelectItem>
                {AUDIT_ACTION_ENUM.map((action) => (
                  <SelectItem key={action} value={action}>
                    {ACTION_LABELS[action]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="w-48">
            <Select
              value={selectedEntity}
              onValueChange={(value) => {
                setSelectedEntity(value as AuditEntity | "all")
                setOffset(0)
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Entidade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as entidades</SelectItem>
                {AUDIT_ENTITY_ENUM.map((entity) => (
                  <SelectItem key={entity} value={entity}>
                    {ENTITY_LABELS[entity]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Registros</CardTitle>
          <CardDescription>
            {pagination && `Total: ${pagination.total} registros`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum registro encontrado
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data/Hora</TableHead>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Ação</TableHead>
                    <TableHead>Entidade</TableHead>
                    <TableHead>ID</TableHead>
                    <TableHead className="text-right">Detalhes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="whitespace-nowrap">
                        {format(new Date(log.timestamp), "dd/MM/yyyy HH:mm", {
                          locale: ptBR,
                        })}
                      </TableCell>
                      <TableCell>
                        {log.user ? (
                          <div>
                            <div className="font-medium">{log.user.username}</div>
                            <div className="text-xs text-muted-foreground">
                              {log.user.email}
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">Sistema</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className={ACTION_COLORS[log.action as AuditAction]}>
                          {ACTION_LABELS[log.action as AuditAction]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {ENTITY_LABELS[log.entityType as AuditEntity]}
                      </TableCell>
                      <TableCell>
                        {log.entityId || "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        {log.details && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewDetails(log as typeof selectedLog)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {pagination && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-muted-foreground">
                    Mostrando {offset + 1} - {Math.min(offset + limit, pagination.total)} de{" "}
                    {pagination.total}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={offset === 0}
                      onClick={() => setOffset(Math.max(0, offset - limit))}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Anterior
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!pagination.hasMore}
                      onClick={() => setOffset(offset + limit)}
                    >
                      Próximo
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes do Registro</DialogTitle>
            <DialogDescription>
              {selectedLog &&
                format(new Date(selectedLog.timestamp), "dd/MM/yyyy HH:mm:ss", {
                  locale: ptBR,
                })}
            </DialogDescription>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-muted-foreground">Ação</span>
                  <div>
                    <Badge className={ACTION_COLORS[selectedLog.action]}>
                      {ACTION_LABELS[selectedLog.action]}
                    </Badge>
                  </div>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Entidade</span>
                  <div className="font-medium">
                    {ENTITY_LABELS[selectedLog.entityType]}
                    {selectedLog.entityId && ` #${selectedLog.entityId}`}
                  </div>
                </div>
                {selectedLog.user && (
                  <div className="col-span-2">
                    <span className="text-sm text-muted-foreground">Usuário</span>
                    <div className="font-medium">
                      {selectedLog.user.username} ({selectedLog.user.email})
                    </div>
                  </div>
                )}
              </div>
              {selectedLog.details && (
                <div>
                  <span className="text-sm text-muted-foreground">Detalhes</span>
                  <pre className="mt-2 p-4 bg-muted rounded-lg overflow-auto text-sm max-h-64">
                    {JSON.stringify(parseDetails(selectedLog.details), null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
