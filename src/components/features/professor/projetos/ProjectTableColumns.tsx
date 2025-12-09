import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/atoms/StatusBadge"
import {
  ProfessorProjetoListItem,
  PROJETO_STATUS_APPROVED,
  PROJETO_STATUS_DRAFT,
  PROJETO_STATUS_PENDING_SIGNATURE,
  PROJETO_STATUS_REJECTED,
  PROJETO_STATUS_SUBMITTED,
  PROJETO_TIPO_CONTINUACAO,
  PROJETO_TIPO_NOVO,
  type ProjetoTipo,
  Semestre,
  getSemestreNumero,
} from "@/types"
import { ColumnDef } from "@tanstack/react-table"
import { Edit, Eye, FileSignature, FileText } from "lucide-react"
import Link from "next/link"

interface ProjectColumnsHandlers {
  onViewProjeto: (projeto: ProfessorProjetoListItem) => void
  onViewPdf: (projetoId: number) => void
  loadingPdfProjetoId: number | null
}

const renderTipoProposicaoBadge = (tipo: ProjetoTipo) => {
  switch (tipo) {
    case PROJETO_TIPO_NOVO:
      return <Badge className="bg-blue-100 text-blue-800">Novo</Badge>
    case PROJETO_TIPO_CONTINUACAO:
      return <Badge className="bg-purple-100 text-purple-800">Continuação</Badge>
    default:
      return <Badge variant="outline">{tipo}</Badge>
  }
}

const getActionButtons = (projeto: ProfessorProjetoListItem, handlers: ProjectColumnsHandlers) => {
  const buttons = []

  buttons.push(
    <Button key="view" variant="outline" size="sm" onClick={() => handlers.onViewProjeto(projeto)}>
      <Eye className="h-4 w-4 mr-1" />
      Detalhes
    </Button>
  )

  if (projeto.status === PROJETO_STATUS_DRAFT) {
    buttons.push(
      <Link key="edit" href={`/home/professor/projetos/${projeto.id}/edit`}>
        <Button variant="outline" size="sm">
          <Edit className="h-4 w-4 mr-1" />
          Editar
        </Button>
      </Link>
    )
  }

  if (projeto.status === PROJETO_STATUS_SUBMITTED || projeto.status === PROJETO_STATUS_PENDING_SIGNATURE) {
    buttons.push(
      <Link key="edit-before-sign" href={`/home/professor/projetos/${projeto.id}/edit`}>
        <Button variant="outline" size="sm">
          <Edit className="h-4 w-4 mr-1" />
          Editar
        </Button>
      </Link>
    )
  }

  if (projeto.status === PROJETO_STATUS_DRAFT || projeto.status === PROJETO_STATUS_PENDING_SIGNATURE) {
    buttons.push(
      <Link key="sign" href={`/home/professor/assinatura-documentos?projetoId=${projeto.id}`}>
        <Button variant="primary" size="sm">
          <FileSignature className="h-4 w-4 mr-1" />
          Assinar e Submeter
        </Button>
      </Link>
    )
  }

  if (
    ([PROJETO_STATUS_SUBMITTED, PROJETO_STATUS_APPROVED, PROJETO_STATUS_REJECTED] as string[]).includes(projeto.status)
  ) {
    buttons.push(
      <Button
        key="pdf"
        variant="outline"
        size="sm"
        onClick={() => handlers.onViewPdf(projeto.id)}
        disabled={handlers.loadingPdfProjetoId === projeto.id}
      >
        <FileText className="h-4 w-4" />
      </Button>
    )
  }

  return buttons
}

export const createProjectColumns = (handlers: ProjectColumnsHandlers): ColumnDef<ProfessorProjetoListItem>[] => [
  {
    accessorKey: "titulo",
    header: "Projeto",
    cell: ({ row }) => (
      <div>
        <div className="font-medium">{row.original.titulo}</div>
        <div className="text-sm text-muted-foreground">
          {row.original.departamento.nome} • {row.original.ano}.{getSemestreNumero(row.original.semestre as Semestre)}
        </div>
        {row.original.editalNumero && (
          <div className="text-xs text-blue-600">
            Edital: {row.original.editalNumero}
            {row.original.editalPublicado && " (Publicado)"}
          </div>
        )}
      </div>
    ),
  },
  {
    accessorKey: "tipoProposicao",
    header: "Tipo",
    cell: ({ row }) => renderTipoProposicaoBadge(row.original.tipoProposicao),
  },
  {
    id: "vagas",
    header: "Vagas",
    cell: ({ row }) => (
      <div className="text-center">
        <div className="text-sm">
          <Badge variant="outline" className="mr-1">
            {row.original.bolsasSolicitadas} 🏆
          </Badge>
          <Badge variant="outline">{row.original.voluntariosSolicitados} 👥</Badge>
        </div>
      </div>
    ),
  },
  {
    accessorKey: "inscricoes",
    header: "Inscrições",
    cell: ({ row }) => (
      <div className="text-center">
        <Badge variant={row.original.inscricoes > 0 ? "default" : "outline"}>{row.original.inscricoes}</Badge>
      </div>
    ),
  },
  {
    id: "alocados",
    header: "Alocados",
    cell: ({ row }) => (
      <div className="text-center">
        <div className="text-sm">
          <Badge variant="outline" className="mr-1">
            {row.original.bolsasAlocadas}/{row.original.bolsasSolicitadas}
          </Badge>
          <Badge variant="outline">
            {row.original.voluntariosAlocados}/{row.original.voluntariosSolicitados}
          </Badge>
        </div>
      </div>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => <StatusBadge status={row.original.status} showIcon />,
  },
  {
    id: "actions",
    header: "Ações",
    cell: ({ row }) => {
      const projeto = row.original
      return <div className="flex items-center gap-2">{getActionButtons(projeto, handlers)}</div>
    },
  },
]
