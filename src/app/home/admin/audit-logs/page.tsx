"use client"

import { PagesLayout } from "@/components/layout/PagesLayout"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { AUDIT_ACTION_ENUM, AUDIT_ENTITY_ENUM, type AuditAction, type AuditEntity } from "@/types"
import { api } from "@/utils/api"
import { endOfDay, format, startOfDay, subDays } from "date-fns"
import { ptBR } from "date-fns/locale"
import {
  Activity,
  Bell,
  CalendarIcon,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Clock,
  Download,
  Eye,
  FileText,
  Filter,
  RefreshCw,
  Search,
  Send,
  X,
  XCircle,
} from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import type { DateRange } from "react-day-picker"

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
  CREATE: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  UPDATE: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  DELETE: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  APPROVE: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
  REJECT: "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400",
  SUBMIT: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  SIGN: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  LOGIN: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400",
  LOGOUT: "bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-400",
  SEND_NOTIFICATION: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400",
  PUBLISH: "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400",
  SELECT: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  ACCEPT: "bg-lime-100 text-lime-800 dark:bg-lime-900/30 dark:text-lime-400",
}

const ACTION_ICONS: Record<AuditAction, React.ComponentType<{ className?: string }>> = {
  CREATE: ({ className }) => <FileText className={className} />,
  UPDATE: ({ className }) => <RefreshCw className={className} />,
  DELETE: ({ className }) => <X className={className} />,
  APPROVE: ({ className }) => <CheckCircle className={className} />,
  REJECT: ({ className }) => <XCircle className={className} />,
  SUBMIT: ({ className }) => <Send className={className} />,
  SIGN: ({ className }) => <FileText className={className} />,
  LOGIN: ({ className }) => <Activity className={className} />,
  LOGOUT: ({ className }) => <Activity className={className} />,
  SEND_NOTIFICATION: ({ className }) => <Bell className={className} />,
  PUBLISH: ({ className }) => <Send className={className} />,
  SELECT: ({ className }) => <CheckCircle className={className} />,
  ACCEPT: ({ className }) => <CheckCircle className={className} />,
}

type LogEntry = {
  id: number
  action: AuditAction
  entityType: AuditEntity
  entityId: number | null
  details: string | null
  timestamp: Date
  ipAddress: string | null
  userAgent: string | null
  user?: { id: number; username: string; email: string } | null
}

export default function AuditLogsPage() {
  const [selectedAction, setSelectedAction] = useState<AuditAction | "all">("all")
  const [selectedEntity, setSelectedEntity] = useState<AuditEntity | "all">("all")
  const [entityIdSearch, setEntityIdSearch] = useState("")
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined)
  const [offset, setOffset] = useState(0)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(false)
  const [showFilters, setShowFilters] = useState(false)

  const limit = 20

  const { data, isLoading, refetch, isFetching } = api.audit.list.useQuery(
    {
      action: selectedAction === "all" ? undefined : selectedAction,
      entityType: selectedEntity === "all" ? undefined : selectedEntity,
      entityId: entityIdSearch ? Number.parseInt(entityIdSearch, 10) : undefined,
      startDate: dateRange?.from ? startOfDay(dateRange.from) : undefined,
      endDate: dateRange?.to ? endOfDay(dateRange.to) : undefined,
      limit,
      offset,
    },
    {
      refetchInterval: autoRefresh ? 10000 : false,
    }
  )

  const { data: stats, isLoading: statsLoading } = api.audit.getStats.useQuery({
    startDate: dateRange?.from ? startOfDay(dateRange.from) : undefined,
    endDate: dateRange?.to ? endOfDay(dateRange.to) : undefined,
  })

  const logs = data?.data ?? []
  const pagination = data?.pagination

  // Auto-refresh effect
  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        refetch()
      }, 10000)
      return () => clearInterval(interval)
    }
  }, [autoRefresh, refetch])

  const handleViewDetails = (log: LogEntry) => {
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

  const handleClearFilters = () => {
    setSelectedAction("all")
    setSelectedEntity("all")
    setEntityIdSearch("")
    setDateRange(undefined)
    setOffset(0)
  }

  const hasActiveFilters =
    selectedAction !== "all" || selectedEntity !== "all" || entityIdSearch !== "" || dateRange?.from || dateRange?.to

  // Export to Excel
  const handleExportXLSX = useCallback(async () => {
    if (!logs.length) return

    const ExcelJS = await import("exceljs")
    const workbook = new ExcelJS.Workbook()
    const sheet = workbook.addWorksheet("Audit Logs")

    const headers = ["ID", "Data/Hora", "Usuário", "Email", "Ação", "Entidade", "ID Entidade", "IP", "User Agent", "Detalhes"]
    const greenFill = { type: "pattern" as const, pattern: "solid" as const, fgColor: { argb: "FF92D050" } }
    const thinBorder = {
      top: { style: "thin" as const }, left: { style: "thin" as const }, bottom: { style: "thin" as const }, right: { style: "thin" as const },
    }

    const headerRow = sheet.addRow(headers)
    headerRow.eachCell((cell) => {
      cell.fill = greenFill
      cell.font = { bold: true, size: 10 }
      cell.border = thinBorder
      cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true }
    })
    headerRow.height = 25

    logs.forEach((log) => {
      const row = sheet.addRow([
        log.id,
        format(new Date(log.timestamp), "dd/MM/yyyy HH:mm:ss"),
        log.user?.username ?? "Sistema",
        log.user?.email ?? "-",
        ACTION_LABELS[log.action as AuditAction],
        ENTITY_LABELS[log.entityType as AuditEntity],
        log.entityId ?? "-",
        log.ipAddress ?? "-",
        log.userAgent ?? "-",
        log.details ?? "-",
      ])
      row.eachCell((cell) => {
        cell.border = thinBorder
        cell.alignment = { vertical: "middle", wrapText: true }
      })
    })

    const colWidths = [10, 20, 20, 30, 15, 15, 15, 15, 40, 50]
    headers.forEach((_, idx) => {
      sheet.getColumn(idx + 1).width = colWidths[idx] || 15
    })

    const buffer = await workbook.xlsx.writeBuffer()
    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = `audit-logs-${format(new Date(), "yyyy-MM-dd-HHmm")}.xlsx`
    link.click()
  }, [logs])

  // Quick date presets
  const setDatePreset = (preset: "today" | "7days" | "30days" | "all") => {
    switch (preset) {
      case "today":
        setDateRange({ from: new Date(), to: new Date() })
        break
      case "7days":
        setDateRange({ from: subDays(new Date(), 7), to: new Date() })
        break
      case "30days":
        setDateRange({ from: subDays(new Date(), 30), to: new Date() })
        break
      case "all":
        setDateRange(undefined)
        break
    }
    setOffset(0)
  }

  return (
    <PagesLayout
      title="Logs de Auditoria"
      subtitle="Visualize e analise todas as ações realizadas no sistema"
      actions={
        <>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-muted/50">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <Label htmlFor="auto-refresh" className="text-sm cursor-pointer">
              Auto-refresh
            </Label>
            <Switch id="auto-refresh" checked={autoRefresh} onCheckedChange={setAutoRefresh} />
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? "animate-spin" : ""}`} />
            Atualizar
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportXLSX} disabled={logs.length === 0}>
            <Download className="h-4 w-4 mr-2" />
            Baixar Excel
          </Button>
        </>
      }
    >
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="pt-4 sm:pt-6">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-full bg-cyan-100 dark:bg-cyan-900/30">
                  <Activity className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
                </div>
                <span className="text-xs sm:text-sm text-muted-foreground">Logins</span>
              </div>
              {statsLoading ? (
                <Skeleton className="h-8 w-16 mt-1" />
              ) : (
                <p className="text-xl sm:text-2xl font-bold mt-1">{stats?.logins ?? 0}</p>
              )}
            </CardContent>
          </Card>
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="pt-4 sm:pt-6">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-full bg-indigo-100 dark:bg-indigo-900/30">
                  <Bell className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                </div>
                <span className="text-xs sm:text-sm text-muted-foreground">Notificações</span>
              </div>
              {statsLoading ? (
                <Skeleton className="h-8 w-16 mt-1" />
              ) : (
                <p className="text-xl sm:text-2xl font-bold mt-1">{stats?.notifications ?? 0}</p>
              )}
            </CardContent>
          </Card>
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="pt-4 sm:pt-6">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                  <CheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <span className="text-xs sm:text-sm text-muted-foreground">Aprovações</span>
              </div>
              {statsLoading ? (
                <Skeleton className="h-8 w-16 mt-1" />
              ) : (
                <p className="text-xl sm:text-2xl font-bold mt-1">{stats?.approvals ?? 0}</p>
              )}
            </CardContent>
          </Card>
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="pt-4 sm:pt-6">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-full bg-rose-100 dark:bg-rose-900/30">
                  <XCircle className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                </div>
                <span className="text-xs sm:text-sm text-muted-foreground">Rejeições</span>
              </div>
              {statsLoading ? (
                <Skeleton className="h-8 w-16 mt-1" />
              ) : (
                <p className="text-xl sm:text-2xl font-bold mt-1">{stats?.rejects ?? 0}</p>
              )}
            </CardContent>
          </Card>
          <Card className="hover:shadow-md transition-shadow col-span-2 sm:col-span-1">
            <CardContent className="pt-4 sm:pt-6">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-full bg-yellow-100 dark:bg-yellow-900/30">
                  <Send className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                </div>
                <span className="text-xs sm:text-sm text-muted-foreground">Submissões</span>
              </div>
              {statsLoading ? (
                <Skeleton className="h-8 w-16 mt-1" />
              ) : (
                <p className="text-xl sm:text-2xl font-bold mt-1">{stats?.submissions ?? 0}</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Filter className="h-5 w-5 text-muted-foreground" />
                <CardTitle className="text-lg">Filtros</CardTitle>
                {hasActiveFilters && (
                  <Badge variant="secondary" className="ml-2">
                    Ativos
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                {hasActiveFilters && (
                  <Button variant="ghost" size="sm" onClick={handleClearFilters} className="text-muted-foreground">
                    <X className="h-4 w-4 mr-1" />
                    Limpar
                  </Button>
                )}
                <Button variant="ghost" size="sm" onClick={() => setShowFilters(!showFilters)} className="sm:hidden">
                  {showFilters ? "Ocultar" : "Mostrar"}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className={`space-y-4 ${showFilters ? "block" : "hidden sm:block"}`}>
            {/* Quick Date Presets */}
            <div className="flex flex-wrap gap-2">
              <Button variant={!dateRange ? "secondary" : "outline"} size="sm" onClick={() => setDatePreset("all")}>
                Todo período
              </Button>
              <Button
                variant={
                  dateRange?.from?.toDateString() === new Date().toDateString() &&
                  dateRange?.to?.toDateString() === new Date().toDateString()
                    ? "secondary"
                    : "outline"
                }
                size="sm"
                onClick={() => setDatePreset("today")}
              >
                Hoje
              </Button>
              <Button variant="outline" size="sm" onClick={() => setDatePreset("7days")}>
                Últimos 7 dias
              </Button>
              <Button variant="outline" size="sm" onClick={() => setDatePreset("30days")}>
                Últimos 30 dias
              </Button>
            </div>

            {/* Main Filters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Ação</Label>
                <Select
                  value={selectedAction}
                  onValueChange={(value) => {
                    setSelectedAction(value as AuditAction | "all")
                    setOffset(0)
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todas as ações" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as ações</SelectItem>
                    {AUDIT_ACTION_ENUM.map((action) => (
                      <SelectItem key={action} value={action}>
                        <span className="flex items-center gap-2">{ACTION_LABELS[action]}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Entidade</Label>
                <Select
                  value={selectedEntity}
                  onValueChange={(value) => {
                    setSelectedEntity(value as AuditEntity | "all")
                    setOffset(0)
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todas as entidades" />
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

              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">ID da Entidade</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="number"
                    placeholder="Buscar por ID..."
                    value={entityIdSearch}
                    onChange={(e) => {
                      setEntityIdSearch(e.target.value)
                      setOffset(0)
                    }}
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Período personalizado</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateRange?.from ? (
                        dateRange.to ? (
                          <>
                            {format(dateRange.from, "dd/MM/yy")} - {format(dateRange.to, "dd/MM/yy")}
                          </>
                        ) : (
                          format(dateRange.from, "dd/MM/yyyy")
                        )
                      ) : (
                        <span className="text-muted-foreground">Selecionar datas</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="range"
                      defaultMonth={dateRange?.from}
                      selected={dateRange}
                      onSelect={(range) => {
                        setDateRange(range)
                        setOffset(0)
                      }}
                      numberOfMonths={2}
                      locale={ptBR}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Logs Table */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  Registros
                  {isFetching && <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />}
                </CardTitle>
                <CardDescription>
                  {pagination ? (
                    <>
                      Total: <strong>{pagination.total.toLocaleString()}</strong> registros
                    </>
                  ) : (
                    "Carregando..."
                  )}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <Skeleton className="h-10 w-24" />
                    <Skeleton className="h-10 flex-1" />
                    <Skeleton className="h-10 w-20" />
                    <Skeleton className="h-10 w-20" />
                    <Skeleton className="h-10 w-10" />
                  </div>
                ))}
              </div>
            ) : logs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-medium">Nenhum registro encontrado</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {hasActiveFilters
                    ? "Tente ajustar os filtros para ver mais resultados"
                    : "Ainda não há logs de auditoria no sistema"}
                </p>
                {hasActiveFilters && (
                  <Button variant="outline" size="sm" onClick={handleClearFilters} className="mt-4">
                    Limpar filtros
                  </Button>
                )}
              </div>
            ) : (
              <>
                {/* Mobile View */}
                <div className="block lg:hidden space-y-3">
                  {logs.map((log) => {
                    const ActionIcon = ACTION_ICONS[log.action as AuditAction]
                    return (
                      <Card
                        key={log.id}
                        className="cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => handleViewDetails(log as LogEntry)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <Badge className={`${ACTION_COLORS[log.action as AuditAction]} flex items-center gap-1`}>
                                <ActionIcon className="h-3 w-3" />
                                {ACTION_LABELS[log.action as AuditAction]}
                              </Badge>
                              <span className="text-sm text-muted-foreground">
                                {ENTITY_LABELS[log.entityType as AuditEntity]}
                                {log.entityId && ` #${log.entityId}`}
                              </span>
                            </div>
                            {log.details && <Eye className="h-4 w-4 text-muted-foreground" />}
                          </div>
                          <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                            <span>{log.user ? log.user.username : "Sistema"}</span>
                            <span>
                              {format(new Date(log.timestamp), "dd/MM HH:mm", {
                                locale: ptBR,
                              })}
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>

                {/* Desktop View */}
                <div className="hidden lg:block overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-36">Data/Hora</TableHead>
                        <TableHead>Usuário</TableHead>
                        <TableHead className="w-40">Ação</TableHead>
                        <TableHead>Entidade</TableHead>
                        <TableHead className="w-20">ID</TableHead>
                        <TableHead className="text-right w-20">Detalhes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {logs.map((log) => {
                        const ActionIcon = ACTION_ICONS[log.action as AuditAction]
                        return (
                          <TableRow
                            key={log.id}
                            className="cursor-pointer hover:bg-muted/50"
                            onClick={() => handleViewDetails(log as LogEntry)}
                          >
                            <TableCell className="whitespace-nowrap font-mono text-sm">
                              {format(new Date(log.timestamp), "dd/MM/yy HH:mm", {
                                locale: ptBR,
                              })}
                            </TableCell>
                            <TableCell>
                              {log.user ? (
                                <div>
                                  <div className="font-medium">{log.user.username}</div>
                                  <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                                    {log.user.email}
                                  </div>
                                </div>
                              ) : (
                                <span className="text-muted-foreground italic">Sistema</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge
                                className={`${ACTION_COLORS[log.action as AuditAction]} flex items-center gap-1 w-fit`}
                              >
                                <ActionIcon className="h-3 w-3" />
                                {ACTION_LABELS[log.action as AuditAction]}
                              </Badge>
                            </TableCell>
                            <TableCell>{ENTITY_LABELS[log.entityType as AuditEntity]}</TableCell>
                            <TableCell className="font-mono">{log.entityId || "-"}</TableCell>
                            <TableCell className="text-right">
                              {log.details && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleViewDetails(log as LogEntry)
                                  }}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                {pagination && (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4 pt-4 border-t">
                    <div className="text-sm text-muted-foreground">
                      Mostrando{" "}
                      <strong>
                        {offset + 1} - {Math.min(offset + limit, pagination.total)}
                      </strong>{" "}
                      de <strong>{pagination.total.toLocaleString()}</strong> registros
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={offset === 0 || isFetching}
                        onClick={() => setOffset(Math.max(0, offset - limit))}
                      >
                        <ChevronLeft className="h-4 w-4 mr-1" />
                        Anterior
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={!pagination.hasMore || isFetching}
                        onClick={() => setOffset(offset + limit)}
                      >
                        Próximo
                        <ChevronRight className="h-4 w-4 ml-1" />
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
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Detalhes do Registro #{selectedLog?.id}
              </DialogTitle>
              <DialogDescription>
                {selectedLog &&
                  format(new Date(selectedLog.timestamp), "EEEE, dd 'de' MMMM 'de' yyyy 'às' HH:mm:ss", {
                    locale: ptBR,
                  })}
              </DialogDescription>
            </DialogHeader>
            {selectedLog && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Ação</span>
                    <div>
                      <Badge className={`${ACTION_COLORS[selectedLog.action]} text-sm`}>
                        {ACTION_LABELS[selectedLog.action]}
                      </Badge>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Entidade</span>
                    <div className="font-medium">
                      {ENTITY_LABELS[selectedLog.entityType]}
                      {selectedLog.entityId && (
                        <span className="ml-2 text-muted-foreground font-mono">#{selectedLog.entityId}</span>
                      )}
                    </div>
                  </div>
                  {selectedLog.user && (
                    <div className="space-y-1 sm:col-span-2">
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Usuário
                      </span>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-sm font-medium text-primary">
                            {selectedLog.user.username.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <div className="font-medium">{selectedLog.user.username}</div>
                          <div className="text-xs text-muted-foreground">{selectedLog.user.email}</div>
                        </div>
                      </div>
                    </div>
                  )}
                  {selectedLog.ipAddress && (
                    <div className="space-y-1">
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Endereço IP
                      </span>
                      <div className="font-mono text-sm">{selectedLog.ipAddress}</div>
                    </div>
                  )}
                  {selectedLog.userAgent && (
                    <div className="space-y-1 sm:col-span-2">
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        User Agent
                      </span>
                      <div className="text-xs text-muted-foreground break-all bg-muted p-2 rounded">
                        {selectedLog.userAgent}
                      </div>
                    </div>
                  )}
                </div>
                {selectedLog.details && (
                  <div className="space-y-2">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Detalhes da Operação
                    </span>
                    <pre className="p-4 bg-muted rounded-lg overflow-auto text-sm max-h-64 font-mono">
                      {JSON.stringify(parseDetails(selectedLog.details), null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </PagesLayout>
  )
}
