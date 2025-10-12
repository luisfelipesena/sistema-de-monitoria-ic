import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle, Clock } from "lucide-react";
import { EditalListItem } from "@/types";

interface EditalStatusBadgeProps {
  edital: EditalListItem;
}

export function EditalStatusBadge({ edital }: EditalStatusBadgeProps) {
  if (edital.publicado) {
    return (
      <Badge variant="default" className="bg-green-500">
        <CheckCircle className="h-3 w-3 mr-1" />
        Publicado
      </Badge>
    );
  }

  if (edital.chefeAssinouEm) {
    return (
      <Badge variant="outline" className="border-purple-500 text-purple-700">
        <CheckCircle className="h-3 w-3 mr-1" />
        Assinado pelo Chefe
      </Badge>
    );
  }

  if (edital.fileIdAssinado) {
    return (
      <Badge variant="outline" className="border-blue-500 text-blue-700">
        <Clock className="h-3 w-3 mr-1" />
        PDF Assinado
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className="border-yellow-500 text-yellow-700">
      <AlertCircle className="h-3 w-3 mr-1" />
      Rascunho
    </Badge>
  );
}

export function getPeriodStatusBadge(status: string) {
  switch (status) {
    case "ATIVO":
      return (
        <Badge variant="default" className="bg-green-500">
          Ativo
        </Badge>
      );
    case "FUTURO":
      return (
        <Badge variant="outline" className="border-blue-500 text-blue-700">
          Futuro
        </Badge>
      );
    case "FINALIZADO":
      return <Badge variant="outline">Finalizado</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}