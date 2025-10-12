import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, GraduationCap, Users } from "lucide-react";

interface CourseStatsCardsProps {
  totalCursos: number;
  cursosAtivos: number;
  totalAlunos: number;
  totalDisciplinas: number;
}

export function CourseStatsCards({
  totalCursos,
  cursosAtivos,
  totalAlunos,
  totalDisciplinas,
}: CourseStatsCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start">
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
            <div className="ml-2">
              <p className="text-sm font-medium text-muted-foreground">
                Total de Cursos
              </p>
              <div className="text-2xl font-bold">{totalCursos}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start">
            <GraduationCap className="h-4 w-4 text-green-600" />
            <div className="ml-2">
              <p className="text-sm font-medium text-muted-foreground">
                Ativos
              </p>
              <div className="text-2xl font-bold text-green-600">
                {cursosAtivos}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start">
            <Users className="h-4 w-4 text-blue-600" />
            <div className="ml-2">
              <p className="text-sm font-medium text-muted-foreground">
                Total de Alunos
              </p>
              <div className="text-2xl font-bold text-blue-600">
                {totalAlunos}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start">
            <BookOpen className="h-4 w-4 text-purple-600" />
            <div className="ml-2">
              <p className="text-sm font-medium text-muted-foreground">
                Total de Disciplinas
              </p>
              <div className="text-2xl font-bold text-purple-600">
                {totalDisciplinas}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}