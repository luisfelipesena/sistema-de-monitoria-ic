import { Badge } from "@/components/ui/badge"
import type {
  AllocationStatus,
  DepartmentStatus,
  ProfessorInvitationStatus,
  ProjetoStatus,
  ProjetoTipo,
  StatusInscricao,
  TermoWorkflowStatus,
  TipoVaga,
} from "@/types"
import { cn } from "@/lib/utils"
import { CheckCircle2, XCircle, Clock, FileText, AlertCircle } from "lucide-react"

type StatusType =
  | ProjetoStatus
  | StatusInscricao
  | TipoVaga
  | AllocationStatus
  | ProfessorInvitationStatus
  | ProjetoTipo
  | DepartmentStatus
  | TermoWorkflowStatus
  | string

interface StatusConfig {
  variant: "default" | "secondary" | "destructive" | "outline"
  label: string
  ariaLabel: string
  icon?: React.ComponentType<{ className?: string }>
  className?: string
}

const STATUS_CONFIG_MAP: Record<string, StatusConfig> = {
  // Project statuses
  DRAFT: {
    variant: "secondary",
    label: "Rascunho",
    ariaLabel: "Status: Rascunho não enviado",
    icon: FileText,
    className: "bg-gray-100 text-gray-800 border-gray-300",
  },
  SUBMITTED: {
    variant: "outline",
    label: "Aguardando Aprovação",
    ariaLabel: "Status: Aguardando aprovação administrativa",
    icon: Clock,
    className: "bg-yellow-50 text-yellow-800 border-yellow-300",
  },
  APPROVED: {
    variant: "default",
    label: "Aprovado",
    ariaLabel: "Status: Projeto aprovado",
    icon: CheckCircle2,
    className: "bg-green-500 text-white border-green-600",
  },
  REJECTED: {
    variant: "destructive",
    label: "Rejeitado",
    ariaLabel: "Status: Projeto rejeitado",
    icon: XCircle,
  },
  PENDING_PROFESSOR_SIGNATURE: {
    variant: "outline",
    label: "Pendente Assinatura",
    ariaLabel: "Status: Aguardando assinatura do professor",
    icon: AlertCircle,
    className: "bg-orange-50 text-orange-800 border-orange-300",
  },

  // Inscription statuses
  SELECTED_BOLSISTA: {
    variant: "default",
    label: "Selecionado - Bolsista",
    ariaLabel: "Resultado: Selecionado como monitor bolsista",
    icon: CheckCircle2,
    className: "bg-green-500 text-white border-green-600",
  },
  SELECTED_VOLUNTARIO: {
    variant: "default",
    label: "Selecionado - Voluntário",
    ariaLabel: "Resultado: Selecionado como monitor voluntário",
    icon: CheckCircle2,
    className: "bg-blue-500 text-white border-blue-600",
  },
  ACCEPTED_BOLSISTA: {
    variant: "default",
    label: "Aceito - Bolsista",
    ariaLabel: "Status: Aceitou vaga de monitor bolsista",
    icon: CheckCircle2,
    className: "bg-green-600 text-white border-green-700",
  },
  ACCEPTED_VOLUNTARIO: {
    variant: "default",
    label: "Aceito - Voluntário",
    ariaLabel: "Status: Aceitou vaga de monitor voluntário",
    icon: CheckCircle2,
    className: "bg-blue-600 text-white border-blue-700",
  },
  REJECTED_BY_PROFESSOR: {
    variant: "destructive",
    label: "Rejeitado pelo Professor",
    ariaLabel: "Resultado: Rejeitado pelo professor",
    icon: XCircle,
  },
  REJECTED_BY_STUDENT: {
    variant: "outline",
    label: "Rejeitado pelo Estudante",
    ariaLabel: "Status: Estudante recusou a vaga",
    icon: XCircle,
    className: "bg-gray-50 text-gray-700 border-gray-300",
  },
  WAITING_LIST: {
    variant: "outline",
    label: "Lista de Espera",
    ariaLabel: "Status: Na lista de espera",
    icon: Clock,
    className: "bg-amber-50 text-amber-800 border-amber-300",
  },

  // Course/Department statuses
  ATIVO: {
    variant: "default",
    label: "Ativo",
    ariaLabel: "Status: Ativo",
    icon: CheckCircle2,
    className: "bg-green-500 text-white border-green-600",
  },
  INATIVO: {
    variant: "secondary",
    label: "Inativo",
    ariaLabel: "Status: Inativo",
    icon: XCircle,
    className: "bg-gray-100 text-gray-800 border-gray-300",
  },
  EM_REFORMULACAO: {
    variant: "outline",
    label: "Em Reformulação",
    ariaLabel: "Status: Em reformulação",
    icon: AlertCircle,
    className: "bg-blue-50 text-blue-800 border-blue-300",
  },
  CONCLUIDO: {
    variant: "secondary",
    label: "Concluído",
    ariaLabel: "Status: Monitoria concluída",
    icon: CheckCircle2,
    className: "bg-blue-500 text-white border-blue-600",
  },
  "CONCLUÍDO": {
    variant: "secondary",
    label: "Concluído",
    ariaLabel: "Status: Monitoria concluída",
    icon: CheckCircle2,
    className: "bg-blue-500 text-white border-blue-600",
  },
  EM_ANDAMENTO: {
    variant: "outline",
    label: "Em Andamento",
    ariaLabel: "Status: Monitoria em andamento",
    icon: Clock,
    className: "bg-yellow-50 text-yellow-800 border-yellow-400",
  },
  SUSPENSO: {
    variant: "destructive",
    label: "Suspenso",
    ariaLabel: "Status: Monitoria suspensa",
    icon: AlertCircle,
    className: "bg-red-50 text-red-700 border-red-400",
  },
  pendente_assinatura: {
    variant: "outline",
    label: "Pendente Assinatura",
    ariaLabel: "Status: Termo pendente de assinatura",
    icon: Clock,
    className: "border-orange-400 text-orange-600",
  },
  parcialmente_assinado: {
    variant: "secondary",
    label: "Parcialmente Assinado",
    ariaLabel: "Status: Termo parcialmente assinado",
    icon: AlertCircle,
    className: "bg-blue-50 text-blue-700 border-blue-300",
  },
  assinado_completo: {
    variant: "default",
    label: "Assinado Completo",
    ariaLabel: "Status: Termo totalmente assinado",
    icon: CheckCircle2,
    className: "bg-green-500 text-white border-green-600",
  },

  // Vaga types
  BOLSISTA: {
    variant: "default",
    label: "Bolsista",
    ariaLabel: "Tipo de vaga: Bolsista",
    className: "bg-green-500 text-white border-green-600",
  },
  VOLUNTARIO: {
    variant: "default",
    label: "Voluntário",
    ariaLabel: "Tipo de vaga: Voluntário",
    className: "bg-blue-500 text-white border-blue-600",
  },

  // Allocation statuses
  NAO_ALOCADO: {
    variant: "outline",
    label: "Não Alocado",
    ariaLabel: "Status de alocação: Não alocado",
    icon: XCircle,
    className: "border-red-500 text-red-700",
  },
  PARCIALMENTE_ALOCADO: {
    variant: "outline",
    label: "Parcial",
    ariaLabel: "Status de alocação: Parcialmente alocado",
    icon: Clock,
    className: "border-yellow-500 text-yellow-700",
  },
  TOTALMENTE_ALOCADO: {
    variant: "default",
    label: "Completo",
    ariaLabel: "Status de alocação: Totalmente alocado",
    icon: CheckCircle2,
    className: "bg-green-500 text-white border-green-600",
  },
  SOBRE_ALOCADO: {
    variant: "outline",
    label: "Sobre-alocado",
    ariaLabel: "Status de alocação: Sobre-alocado",
    icon: AlertCircle,
    className: "border-purple-500 text-purple-700",
  },

  // Invitation statuses
  PENDING: {
    variant: "outline",
    label: "Pendente",
    ariaLabel: "Status: Convite pendente",
    icon: Clock,
    className: "border-yellow-500 text-yellow-700",
  },
  ACCEPTED: {
    variant: "default",
    label: "Aceito",
    ariaLabel: "Status: Convite aceito",
    icon: CheckCircle2,
    className: "bg-green-500 text-white border-green-600",
  },
  EXPIRED: {
    variant: "outline",
    label: "Expirado",
    ariaLabel: "Status: Convite expirado",
    icon: AlertCircle,
    className: "border-red-500 text-red-700",
  },
}

interface StatusBadgeProps {
  status: StatusType
  className?: string
  showIcon?: boolean
}

export function StatusBadge({ status, className, showIcon = false }: StatusBadgeProps) {
  const config = STATUS_CONFIG_MAP[status] || {
    variant: "outline" as const,
    label: status,
    ariaLabel: `Status: ${status}`,
    className: "bg-gray-50 text-gray-700 border-gray-300",
  }

  const Icon = config.icon

  return (
    <Badge
      variant={config.variant}
      className={cn("gap-1.5 font-medium", config.className, className)}
      aria-label={config.ariaLabel}
      role="status"
    >
      {showIcon && Icon && <Icon className="h-3 w-3" aria-hidden="true" />}
      {config.label}
    </Badge>
  )
}
