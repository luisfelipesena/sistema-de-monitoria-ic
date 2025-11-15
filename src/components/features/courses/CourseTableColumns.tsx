import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  MODALIDADE_CURSO_EAD,
  MODALIDADE_CURSO_HIBRIDO,
  MODALIDADE_CURSO_LABELS,
  MODALIDADE_CURSO_PRESENCIAL,
  STATUS_CURSO_ATIVO,
  STATUS_CURSO_EM_REFORMULACAO,
  STATUS_CURSO_INATIVO,
  TIPO_CURSO_BACHARELADO,
  TIPO_CURSO_LICENCIATURA,
  TIPO_CURSO_POS_GRADUACAO,
  TIPO_CURSO_TECNICO,
  TIPO_CURSO_LABELS,
  type CursoListItem,
  type ModalidadeCurso,
  type StatusCurso,
  type TipoCurso,
} from "@/types";
import { ColumnDef } from "@tanstack/react-table";
import { Edit, Trash2 } from "lucide-react";

interface CourseTableColumnsProps {
  onEdit: (curso: CursoListItem) => void;
  onDelete: (curso: CursoListItem) => void;
}

export function createCourseTableColumns({
  onEdit,
  onDelete,
}: CourseTableColumnsProps): ColumnDef<CursoListItem>[] {
  return [
    {
      accessorKey: "codigo",
      header: "Código",
      cell: ({ row }) => (
        <span className="font-mono">{row.getValue("codigo")}</span>
      ),
    },
    {
      accessorKey: "nome",
      header: "Nome do Curso",
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.getValue("nome")}</div>
          {row.original.descricao && (
            <div className="text-sm text-muted-foreground line-clamp-1">
              {row.original.descricao}
            </div>
          )}
        </div>
      ),
    },
    {
      accessorKey: "tipo",
      header: "Tipo",
      cell: ({ row }) => {
        const tipo = row.getValue("tipo") as TipoCurso;
        const tipoColor: Record<TipoCurso, string> = {
          [TIPO_CURSO_BACHARELADO]: "bg-blue-100 text-blue-800",
          [TIPO_CURSO_LICENCIATURA]: "bg-green-100 text-green-800",
          [TIPO_CURSO_TECNICO]: "bg-yellow-100 text-yellow-800",
          [TIPO_CURSO_POS_GRADUACAO]: "bg-purple-100 text-purple-800",
        };

        return (
          <Badge className={tipoColor[tipo] || ""} variant="secondary">
            {TIPO_CURSO_LABELS[tipo] || tipo}
          </Badge>
        );
      },
    },
    {
      accessorKey: "modalidade",
      header: "Modalidade",
      cell: ({ row }) => {
        const modalidade = row.getValue("modalidade") as ModalidadeCurso;
        return (
          <span className="text-sm">{MODALIDADE_CURSO_LABELS[modalidade] || modalidade}</span>
        )
      },
    },
    {
      accessorKey: "departamento",
      header: "Departamento",
      cell: ({ row }) => {
        const departamento = row.original.departamento;
        return (
          <div>
            <div className="font-medium">{departamento.sigla}</div>
            <div className="text-sm text-muted-foreground">
              {departamento.nome}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "duracao",
      header: "Duração",
      cell: ({ row }) => `${row.getValue("duracao")} semestres`,
    },
    {
      accessorKey: "cargaHoraria",
      header: "Carga Horária",
      cell: ({ row }) => `${row.getValue("cargaHoraria")}h`,
    },
    {
      accessorKey: "coordenador",
      header: "Coordenador",
      cell: ({ row }) => {
        const coordenador = row.getValue("coordenador") as string | undefined;
        return coordenador ? (
          <div>
            <div className="font-medium">{coordenador}</div>
            {row.original.emailCoordenacao && (
              <div className="text-sm text-muted-foreground">
                {row.original.emailCoordenacao}
              </div>
            )}
          </div>
        ) : (
          <span className="text-muted-foreground">-</span>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as StatusCurso
        const statusColor: Record<StatusCurso, string> = {
          [STATUS_CURSO_ATIVO]: "bg-green-100 text-green-800",
          [STATUS_CURSO_INATIVO]: "bg-gray-100 text-gray-800",
          [STATUS_CURSO_EM_REFORMULACAO]: "bg-yellow-100 text-yellow-800",
        }
        const statusLabel: Record<StatusCurso, string> = {
          [STATUS_CURSO_ATIVO]: "Ativo",
          [STATUS_CURSO_INATIVO]: "Inativo",
          [STATUS_CURSO_EM_REFORMULACAO]: "Em Reformulação",
        }

        return (
          <Badge className={statusColor[status] || ""} variant="secondary">
            {statusLabel[status] || status}
          </Badge>
        )
      },
    },
    {
      id: "stats",
      header: "Estatísticas",
      cell: ({ row }) => {
        const curso = row.original;
        return (
          <div className="text-sm">
            <div>Alunos: {curso.alunos}</div>
            <div>Disciplinas: {curso.disciplinas}</div>
            <div>Projetos: {curso.projetos}</div>
          </div>
        );
      },
    },
    {
      id: "actions",
      header: "Ações",
      cell: ({ row }) => {
        const curso = row.original;
        return (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(curso)}
            >
              <Edit className="h-4 w-4" />
            </Button>

            <Button
              variant="destructive"
              size="sm"
              onClick={() => onDelete(curso)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        );
      },
    },
  ];
}