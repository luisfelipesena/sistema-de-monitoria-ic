import { createFilterableHeader } from "@/components/layout/DataTableFilterHeader"
import { multiselectFilterFn } from "@/components/layout/TableComponent"
import { StatusBadge } from "@/components/atoms/StatusBadge"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
  SEMESTRE_1,
  SEMESTRE_2,
  getSemestreNumero,
} from "@/types"
import { ColumnDef, FilterFn } from "@tanstack/react-table"
import { Edit, Eye, FileSignature, FileText } from "lucide-react"
import Link from "next/link"

interface ProjectColumnsHandlers {
  onViewProjeto: (projeto: ProfessorProjetoListItem) => void
  onViewPdf: (projetoId: number) => void
  loadingPdfProjetoId: number | null
}

export interface ProjectColumnsOptions {
  handlers: ProjectColumnsHandlers
  anoFilterOptions?: { value: string; label: string }[]
  statusFilterOptions?: { value: string; label: string }[]
}

// Filter functions
const tituloFilterFn: FilterFn<ProfessorProjetoListItem> = (row, _columnId, filterValue) => {
  if (!filterValue || filterValue === "") return true
  const titulo = row.original.titulo.toLowerCase()
  const departamento = row.original.departamento?.nome?.toLowerCase() || ""
  const searchValue = String(filterValue).toLowerCase()
  return titulo.includes(searchValue) || departamento.includes(searchValue)
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

// Default filter options
const defaultStatusOptions = [
  { value: PROJETO_STATUS_DRAFT, label: "Rascunho" },
  { value: PROJETO_STATUS_PENDING_SIGNATURE, label: "Aguardando Assinatura" },
  { value: PROJETO_STATUS_SUBMITTED, label: "Submetido" },
  { value: PROJETO_STATUS_APPROVED, label: "Aprovado" },
  { value: PROJETO_STATUS_REJECTED, label: "Rejeitado" },
]

const defaultSemestreOptions = [
  { value: SEMESTRE_1, label: "1º Semestre" },
  { value: SEMESTRE_2, label: "2º Semestre" },
]

const tipoProposicaoOptions = [
  { value: PROJETO_TIPO_NOVO, label: "Novo" },
  { value: PROJETO_TIPO_CONTINUACAO, label: "Continuação" },
]

export const createProjectColumns = (options: ProjectColumnsOptions): ColumnDef<ProfessorProjetoListItem>[] => {
  const { handlers, anoFilterOptions = [], statusFilterOptions = defaultStatusOptions } = options

  return [
    {
      id: "titulo",
      accessorKey: "titulo",
      header: createFilterableHeader<ProfessorProjetoListItem>({
        title: "Projeto",
        filterType: "text",
        filterPlaceholder: "Buscar projeto...",
        wide: true,
      }),
      filterFn: tituloFilterFn,
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.original.titulo}</div>
          <div className="text-sm text-muted-foreground">
            {row.original.departamento?.nome || "N/A"} • {row.original.ano}.
            {getSemestreNumero(row.original.semestre as Semestre)}
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
      id: "ano",
      accessorKey: "ano",
      header: createFilterableHeader<ProfessorProjetoListItem>({
        title: "Ano",
        filterType: "multiselect",
        filterOptions: anoFilterOptions,
      }),
      filterFn: multiselectFilterFn,
      cell: ({ row }) => <span>{row.original.ano}</span>,
    },
    {
      id: "semestre",
      accessorKey: "semestre",
      header: createFilterableHeader<ProfessorProjetoListItem>({
        title: "Semestre",
        filterType: "multiselect",
        filterOptions: defaultSemestreOptions,
      }),
      filterFn: multiselectFilterFn,
      cell: ({ row }) => <span>{getSemestreNumero(row.original.semestre as Semestre)}º</span>,
    },
    {
      id: "tipoProposicao",
      accessorKey: "tipoProposicao",
      header: createFilterableHeader<ProfessorProjetoListItem>({
        title: "Tipo",
        filterType: "multiselect",
        filterOptions: tipoProposicaoOptions,
      }),
      filterFn: multiselectFilterFn,
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
      id: "inscricoes",
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
      id: "status",
      accessorKey: "status",
      header: createFilterableHeader<ProfessorProjetoListItem>({
        title: "Status",
        filterType: "multiselect",
        filterOptions: statusFilterOptions,
      }),
      filterFn: multiselectFilterFn,
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
}
