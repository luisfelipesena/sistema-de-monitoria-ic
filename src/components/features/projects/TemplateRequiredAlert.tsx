"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, Settings } from "lucide-react"

interface TemplateRequiredAlertProps {
  onCreateTemplate: () => void
  variant?: "form" | "sidebar"
}

export const TemplateRequiredAlert: React.FC<TemplateRequiredAlertProps> = ({ onCreateTemplate, variant = "form" }) => {
  if (variant === "sidebar") {
    return (
      <Card className="border-amber-300 bg-amber-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-amber-800">
            <AlertCircle className="h-5 w-5" />
            Template Padrão Necessário
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-amber-700">
            Esta disciplina ainda não possui um template padrão. É necessário criar um template antes de criar projetos.
          </p>
          <p className="text-sm text-amber-600">
            O template define valores padrão que serão reutilizados em todos os projetos futuros desta disciplina,
            facilitando a criação.
          </p>
          <Button onClick={onCreateTemplate} className="w-full bg-amber-600 hover:bg-amber-700">
            <Settings className="h-4 w-4 mr-2" />
            Criar Template Padrão
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-amber-300 bg-amber-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-amber-800">
          <AlertCircle className="h-5 w-5" />
          Criar Template Padrão Primeiro
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-amber-700 font-medium">Esta disciplina não possui um template padrão.</p>
        <p className="text-sm text-amber-600">
          Antes de criar projetos para esta disciplina, você precisa definir um template padrão. O template define
          valores que serão reutilizados em todos os projetos futuros, facilitando a criação e mantendo consistência.
        </p>
        <div className="bg-white border border-amber-200 rounded-lg p-4 mt-4">
          <h4 className="font-semibold text-amber-900 mb-2">O que é o template?</h4>
          <ul className="text-sm text-amber-700 space-y-1 list-disc list-inside">
            <li>Título padrão para projetos desta disciplina</li>
            <li>Descrição e objetivos padrão</li>
            <li>Carga horária padrão</li>
            <li>Público alvo padrão</li>
            <li>Atividades típicas da monitoria</li>
          </ul>
        </div>
        <Button onClick={onCreateTemplate} className="w-full bg-amber-600 hover:bg-amber-700">
          <Settings className="h-4 w-4 mr-2" />
          Criar Template Padrão
        </Button>
      </CardContent>
    </Card>
  )
}