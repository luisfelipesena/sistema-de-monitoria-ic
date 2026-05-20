"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Settings } from "lucide-react"

interface DisciplineSelectorProps {
  disciplines: Array<{
    id: number
    codigo: string
    nome: string
  }>
  onSelect: (disciplineId: string) => void
}

export const DisciplineSelector: React.FC<DisciplineSelectorProps> = ({ disciplines, onSelect }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Selecione a Disciplina
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-muted-foreground">
          Escolha a disciplina para a qual você deseja criar um projeto de monitoria.
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Disciplina</label>
            <Select onValueChange={onSelect}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma disciplina" />
              </SelectTrigger>
              <SelectContent>
                {disciplines?.map((disciplina) => (
                  <SelectItem key={disciplina.id} value={disciplina.id.toString()}>
                    {disciplina.codigo} - {disciplina.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}