import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EditalListItem, SEMESTRE_1, TIPO_EDITAL_DCC } from "@/types";
import { ColumnDef } from "@tanstack/react-table";
import { Edit, Eye, FileText, Trash2, Upload, Send } from "lucide-react";
import { EditalStatusBadge, getPeriodStatusBadge } from "./EditalStatusBadge";

interface EditalTableColumnsProps {
  onEdit: (edital: EditalListItem) => void;
  onDelete: (id: number) => void;
  onViewPdf: (id: number) => void;
  onPublish: (id: number) => void;
  onRequestSignature: (edital: EditalListItem) => void;
  onUploadSigned: (id: number) => void;
}

export function createEditalTableColumns({
  onEdit,
  onDelete,
  onViewPdf,
  onPublish,
  onRequestSignature,
  onUploadSigned,
}: EditalTableColumnsProps): ColumnDef<EditalListItem>[] {
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("pt-BR");
  };

  const getDurationDays = (start: Date, end: Date) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return [
    {
      accessorKey: "numeroEdital",
      header: "Número",
      cell: ({ row }) => (
        <div className="font-mono text-sm">{row.getValue("numeroEdital")}</div>
      ),
    },
    {
      accessorKey: "titulo",
      header: "Título",
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.getValue("titulo")}</div>
          {row.original.descricaoHtml && (
            <div
              className="text-sm text-muted-foreground mt-1 line-clamp-2"
              dangerouslySetInnerHTML={{ __html: row.original.descricaoHtml }}
            />
          )}
        </div>
      ),
    },
    {
      accessorKey: "tipo",
      header: "Tipo",
      cell: ({ row }) => {
        const tipo = row.getValue("tipo") as string;
        return (
          <Badge variant={tipo === TIPO_EDITAL_DCC ? "default" : "secondary"}>
            {tipo}
          </Badge>
        );
      },
    },
    {
      id: "periodo",
      header: "Período",
      cell: ({ row }) => {
        const periodo = row.original.periodoInscricao;
        if (!periodo) return <span className="text-muted-foreground">-</span>;

        return (
          <div className="text-sm">
            <div className="font-medium">
              {periodo.ano}/{periodo.semestre === SEMESTRE_1 ? "1" : "2"}
            </div>
            <div className="text-muted-foreground">
              {formatDate(periodo.dataInicio)} - {formatDate(periodo.dataFim)}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {getDurationDays(periodo.dataInicio, periodo.dataFim)} dias
            </div>
          </div>
        );
      },
    },
    {
      id: "status",
      header: "Status",
      cell: ({ row }) => {
        const edital = row.original;
        return (
          <div className="space-y-1">
            <EditalStatusBadge edital={edital} />
            {edital.periodoInscricao && (
              <div>{getPeriodStatusBadge(edital.periodoInscricao.status)}</div>
            )}
          </div>
        );
      },
    },
    {
      id: "assinaturas",
      header: "Assinaturas",
      cell: ({ row }) => {
        const edital = row.original;
        return (
          <div className="text-sm">
            {edital.chefeAssinouEm && (
              <div className="text-green-600">
                ✓ Chefe: {formatDate(edital.chefeAssinouEm)}
              </div>
            )}
            {edital.fileIdAssinado && (
              <div className="text-blue-600">✓ PDF Assinado</div>
            )}
            {!edital.chefeAssinouEm && !edital.fileIdAssinado && (
              <span className="text-muted-foreground">Sem assinaturas</span>
            )}
          </div>
        );
      },
    },
    {
      id: "inscricoes",
      header: "Inscrições",
      cell: ({ row }) => {
        const edital = row.original;
        const totalInscricoes = edital.periodoInscricao?.totalInscricoes || 0;
        return (
          <div className="text-center">
            <Badge variant="outline">{totalInscricoes}</Badge>
          </div>
        );
      },
    },
    {
      id: "actions",
      header: "Ações",
      cell: ({ row }) => {
        const edital = row.original;
        const canPublish = edital.chefeAssinouEm && !edital.publicado;
        const canRequestSignature = !edital.chefeAssinouEm && !edital.publicado;
        const canUploadSigned = !edital.fileIdAssinado && !edital.publicado;

        return (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onViewPdf(edital.id)}
              title="Visualizar PDF"
            >
              <Eye className="h-4 w-4" />
            </Button>

            {!edital.publicado && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit(edital)}
                title="Editar"
              >
                <Edit className="h-4 w-4" />
              </Button>
            )}

            {canRequestSignature && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onRequestSignature(edital)}
                title="Solicitar Assinatura do Chefe"
              >
                <Send className="h-4 w-4" />
              </Button>
            )}

            {canUploadSigned && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onUploadSigned(edital.id)}
                title="Upload PDF Assinado"
              >
                <Upload className="h-4 w-4" />
              </Button>
            )}

            {canPublish && (
              <Button
                variant="default"
                size="sm"
                onClick={() => onPublish(edital.id)}
                title="Publicar"
              >
                <FileText className="h-4 w-4" />
              </Button>
            )}

            {!edital.publicado && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => onDelete(edital.id)}
                title="Excluir"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        );
      },
    },
  ];
}