import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays, CheckCircle, FileText, Users } from "lucide-react";

interface EditalStatsCardsProps {
  totalEditais: number;
  editaisAtivos: number;
  editaisPublicados: number;
  editaisAssinados: number;
}

export function EditalStatsCards({
  totalEditais,
  editaisAtivos,
  editaisPublicados,
  editaisAssinados,
}: EditalStatsCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Total de Editais
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <span className="text-2xl font-bold">{totalEditais}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Editais Ativos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <CalendarDays className="h-4 w-4 text-green-500" />
            <span className="text-2xl font-bold text-green-600">{editaisAtivos}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Publicados
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-4 w-4 text-blue-500" />
            <span className="text-2xl font-bold text-blue-600">{editaisPublicados}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Assinados
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <Users className="h-4 w-4 text-purple-500" />
            <span className="text-2xl font-bold text-purple-600">{editaisAssinados}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}