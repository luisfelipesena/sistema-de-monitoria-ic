import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CursoListItem } from "@/types";
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
        const tipo = row.getValue("tipo") as string;
        const tipoColor: Record<string, string> = {
          BACHARELADO: "bg-blue-100 text-blue-800",
          LICENCIATURA: "bg-green-100 text-green-800",
          TECNICO: "bg-yellow-100 text-yellow-800",
          POS_GRADUACAO: "bg-purple-100 text-purple-800",
        };

        const tipoLabel: Record<string, string> = {
          BACHARELADO: "Bacharelado",
          LICENCIATURA: "Licenciatura",
          TECNICO: "Técnico",
          POS_GRADUACAO: "Pós-Graduação",
        };

        return (
          <Badge className={tipoColor[tipo] || ""} variant="secondary">
            {tipoLabel[tipo] || tipo}
          </Badge>
        );
      },
    },
    {
      accessorKey: "modalidade",
      header: "Modalidade",
      cell: ({ row }) => {
        const modalidade = row.getValue("modalidade") as string;
        const modalidadeLabel: Record<string, string> = {
          PRESENCIAL: "Presencial",
          EAD: "EAD",
          HIBRIDO: "Híbrido",
        };
        return (
          <span className="text-sm">{modalidadeLabel[modalidade] || modalidade}</span>
        );
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
        const status = row.getValue("status") as string;
        const statusColor: Record<string, string> = {
          ATIVO: "bg-green-100 text-green-800",
          INATIVO: "bg-gray-100 text-gray-800",
          EM_REFORMULACAO: "bg-yellow-100 text-yellow-800",
        };

        const statusLabel: Record<string, string> = {
          ATIVO: "Ativo",
          INATIVO: "Inativo",
          EM_REFORMULACAO: "Em Reformulação",
        };

        return (
          <Badge className={statusColor[status] || ""} variant="secondary">
            {statusLabel[status] || status}
          </Badge>
        );
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