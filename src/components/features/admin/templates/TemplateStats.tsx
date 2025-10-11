"use client"

import { Card, CardContent } from "@/components/ui/card"
import { BookOpen, Clock, FileText, Target } from "lucide-react"

interface TemplateStatsProps {
  stats: {
    totalTemplates: number
    totalProfessores: number
    cobertura: number
    disciplinasSemTemplate: number
  }
}

export const TemplateStats: React.FC<TemplateStatsProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start gap-2">
            <FileText className="h-5 w-5 text-blue-600" />
            <div>
              <p className="text-sm text-muted-foreground">Total de Templates</p>
              <p className="text-2xl font-semibold">{stats.totalTemplates}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start gap-2">
            <BookOpen className="h-5 w-5 text-green-600" />
            <div>
              <p className="text-sm text-muted-foreground">Professores</p>
              <p className="text-2xl font-semibold">{stats.totalProfessores}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start gap-2">
            <Target className="h-5 w-5 text-purple-600" />
            <div>
              <p className="text-sm text-muted-foreground">Cobertura</p>
              <p className="text-2xl font-semibold">{stats.cobertura}%</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start gap-2">
            <Clock className="h-5 w-5 text-orange-600" />
            <div>
              <p className="text-sm text-muted-foreground">Sem Template</p>
              <p className="text-2xl font-semibold">{stats.disciplinasSemTemplate}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}