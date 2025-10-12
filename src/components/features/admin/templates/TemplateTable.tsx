"use client"

import { TableComponent } from "@/components/layout/TableComponent"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { type ProjectTemplateItem } from "@/types"
import { ColumnDef } from "@tanstack/react-table"
import { Copy, Edit, Trash2 } from "lucide-react"

interface TemplateTableProps {
  templates: ProjectTemplateItem[]
  onEdit: (template: ProjectTemplateItem) => void
  onDelete: (template: ProjectTemplateItem) => void
  onDuplicate: (template: ProjectTemplateItem) => void
}

export const TemplateTable: React.FC<TemplateTableProps> = ({
  templates,
  onEdit,
  onDelete,
  onDuplicate,
}) => {
  const columns: ColumnDef<ProjectTemplateItem>[] = [
    {
      accessorKey: "disciplina",
      header: "Disciplina",
      cell: ({ row }) => (
        <div>
          <p className="font-medium">
            {row.original.disciplina.codigo} - {row.original.disciplina.nome}
          </p>
          <p className="text-sm text-muted-foreground">
            {row.original.disciplina.departamento.sigla}
          </p>
        </div>
      ),
    },
    {
      accessorKey: "tituloDefault",
      header: "Título Padrão",
      cell: ({ row }) => (
        <div className="max-w-md">
          <p className="truncate">{row.original.tituloDefault || "Sem título"}</p>
        </div>
      ),
    },
    {
      id: "detalhes",
      header: "Detalhes",
      cell: ({ row }) => (
        <div className="flex gap-2">
          {row.original.cargaHorariaSemanaDefault && (
            <Badge variant="outline">
              {row.original.cargaHorariaSemanaDefault}h/sem
            </Badge>
          )}
          {row.original.numeroSemanasDefault && (
            <Badge variant="outline">
              {row.original.numeroSemanasDefault} semanas
            </Badge>
          )}
        </div>
      ),
    },
    {
      accessorKey: "createdAt",
      header: "Criado em",
      cell: ({ row }) =>
        new Date(row.original.createdAt).toLocaleDateString("pt-BR"),
    },
    {
      id: "actions",
      header: "Ações",
      cell: ({ row }) => (
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(row.original)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDuplicate(row.original)}
          >
            <Copy className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDelete(row.original)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <TableComponent
      columns={columns}
      data={templates}
      searchPlaceholder="Buscar templates..."
    />
  )
}